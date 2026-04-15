#!/usr/bin/env tsx
// scripts/import-data.ts
//
// Reads the five Excel workbooks and upserts everything into the Prisma schema.
// Run: npm run db:import
//
// Prerequisites:
//   npm install xlsx          (SheetJS – pure TS, no native deps)
//   npm run db:push           (push schema to Supabase first)

import XLSX from 'xlsx';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { calculateElo, ELO_DEFAULT_RATING } from '../src/lib/elo';
import { eloStrandFromMatch } from '../src/lib/matchContext';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../data');   // put your xlsx files here

const prisma = new PrismaClient({ log: ['warn', 'error'] });

// ─── helpers ────────────────────────────────────────────────────────────────

/**
 * Retries a database operation if the connection is dropped (e.g. P1017).
 * This is common in long-running scripts against remote DBs like Supabase
 * where idle connections are aggressively culled by proxies/load balancers.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 1000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Prisma codes: P1017 (Server closed connection) or P1008 (Timeout)
      if ((error.code === 'P1017' || error.code === 'P1008') && i < retries) {
        console.warn(`  ⚠ DB connection reset, waiting ${delayMs}ms before retry ${i + 1}/${retries}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

function readSheet(file: string, sheetName = 'Combined_Data') {
  const wb = XLSX.readFile(path.join(DATA_DIR, file));
  const ws = wb.Sheets[sheetName] ?? wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
}

function str(v: unknown): string {
  return v == null ? '' : String(v).trim();
}

function num(v: unknown): number | null {
  const n = Number(v);
  return isNaN(n) ? null : n;
}

/**
 * Parse placement fields that can include tie suffixes like "3T".
 * Returns the numeric placement (e.g. "3T" -> 3) or null if unparseable.
 */
function placeNum(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  // Common format in the spreadsheet: "<number>T" indicating a tie.
  // Also tolerate whitespace like "3 T".
  const m = s.match(/^(\d+)\s*T?$/i);
  if (m) return parseInt(m[1], 10);
  // Last-resort: extract leading digits if present (e.g. "3rd", "3 (tie)")
  const lead = s.match(/^(\d+)/);
  return lead ? parseInt(lead[1], 10) : null;
}

/** Parse fencer name+club strings like "BRAVI Dante\nEPIC / ARES-P&FC / Alberta / CAN" */
function parseFencerField(raw: string): { name: string; club: string } {
  const parts = raw.split('\n');
  return { name: str(parts[0]), club: str(parts[1]) };
}

/** Parse score strings like "V5", "D2", "10 - 7" */
function parseScore(raw: string | null): { touches: number | null; isVictory: boolean } {
  if (!raw) return { touches: null, isVictory: false };
  const s = str(raw);
  if (s.startsWith('V')) return { touches: num(s.slice(1)), isVictory: true };
  if (s.startsWith('D')) return { touches: num(s.slice(1)), isVictory: false };
  return { touches: null, isVictory: false };
}

/** Normalise weapon strings */
function normalizeWeapon(raw: string): string {
  const w = raw.toLowerCase();
  if (w.includes('epee') || w.includes('épée')) return 'Epee';
  if (w.includes('foil'))  return 'Foil';
  if (w.includes('saber') || w.includes('sabre')) return 'Saber';
  return raw || 'Mixed';
}

/** Extract weapon from event name like "Senior Men's Epee" */
function weaponFromEventName(name: string): string {
  if (/epee|épée/i.test(name)) return 'Epee';
  if (/foil/i.test(name))       return 'Foil';
  if (/saber|sabre/i.test(name)) return 'Saber';
  return 'Mixed';
}

/** Extract sex from event name */
function sexFromEventName(name: string): string {
  if (/women/i.test(name))     return 'Women';
  if (/\bmen\b/i.test(name))   return 'Men';
  if (/mixed/i.test(name))     return 'Mixed';
  if (/wheelchair/i.test(name)) return 'Wheelchair';
  return 'Mixed';
}

/** Extract category from event name */
function categoryFromEventName(name: string): string {
  if (/senior/i.test(name))   return 'Senior';
  if (/junior/i.test(name))   return 'Junior';
  if (/cadet/i.test(name))    return 'Cadet';
  if (/veteran/i.test(name))  return 'Veteran';
  if (/v60|v50|v40/i.test(name)) return 'Veteran';
  return 'Open';
}

// Member cache: fullName → Member.id
const memberCache = new Map<string, string>();

async function findOrCreateMember(params: {
  fullName: string;
  firstName?: string;
  lastName?: string;
  club?: string;
  sex?: string;
  cffLicence?: string;
}) {
  const key = params.fullName.toUpperCase().trim();
  if (memberCache.has(key)) return memberCache.get(key)!;

  // Check by full name first
  let existing = await withRetry(() => prisma.member.findFirst({
    where: { fullName: { equals: key, mode: 'insensitive' } },
  }));

  // If not found by name and cffLicence is provided, check by licence
  if (!existing && params.cffLicence) {
    existing = await withRetry(() => prisma.member.findFirst({
      where: { cffLicence: params.cffLicence },
    }));
  }

  if (existing) {
    memberCache.set(key, existing.id);
    return existing.id;
  }

  const parts = params.fullName.split(/\s+/);
  
  try {
    const created = await withRetry(() => prisma.member.create({
      data: {
        fullName:  key,
        firstName: params.firstName ?? parts.slice(1).join(' ') ?? '',
        lastName:  params.lastName  ?? parts[0] ?? '',
        club:      params.club ?? null,
        sex:       params.sex ?? null,
        cffLicence: params.cffLicence ?? null,
      },
    }));

    memberCache.set(key, created.id);
    return created.id;
  } catch (error: any) {
    // Handle unique constraint violation on cffLicence
    if (error.code === 'P2002') {
      const existingByLicence = await withRetry(() => prisma.member.findFirst({
        where: { cffLicence: params.cffLicence },
      }));
      if (existingByLicence) {
        memberCache.set(key, existingByLicence.id);
        return existingByLicence.id;
      }
    }
    throw error;
  }
}

// Tournament cache: sourceKey → Tournament
const tournamentCache = new Map<string, string>();

async function findOrCreateTournament(sourceKey: string, level: number, season?: string) {
  if (tournamentCache.has(sourceKey)) return tournamentCache.get(sourceKey)!;

  const name = sourceKey
    .replace(/_/g, ' ')
    .replace(/^\d{4}\s*/, '')
    .replace(/\b\w/g, c => c.toUpperCase());

  const t = await withRetry(() => prisma.tournament.upsert({
    where:  { sourceKey },
    update: {},
    create: { sourceKey, name, level, season: season ?? null },
  }));

  tournamentCache.set(sourceKey, t.id);
  return t.id;
}

// Event cache: tournamentId+eventName → Event.id
const eventCache = new Map<string, string>();

async function findOrCreateEvent(tournamentId: string, eventName: string) {
  const key = `${tournamentId}::${eventName}`;
  if (eventCache.has(key)) return eventCache.get(key)!;

  const weapon   = weaponFromEventName(eventName);
  const sex      = sexFromEventName(eventName);
  const category = categoryFromEventName(eventName);

  const existing = await withRetry(() => prisma.event.findFirst({
    where: { tournamentId, name: eventName },
  }));

  if (existing) { eventCache.set(key, existing.id); return existing.id; }

  const created = await withRetry(() => prisma.event.create({
    data: { tournamentId, name: eventName, weapon, sex, category },
  }));
  eventCache.set(key, created.id);
  return created.id;
}

// Tournament events cache: tournamentId → Event[]
const tournamentEventsCache = new Map<string, { id: string; weapon: string; sex: string }[]>();

// Cross-reference cache: memberId → (tournamentId → eventId)
// Populated during loadTournamentResults to instantly resolve paired matches without guessing.
const memberTournamentEventCache = new Map<string, Map<string, string>>();

// ─── Step 1: load classification + membership from ftest.xlsx ───────────────

async function loadClassification() {
  console.log('\n📋  Loading tournament classifications…');
  const wb = XLSX.readFile(path.join(DATA_DIR, 'ftest.xlsx'));

  const classWs = wb.Sheets['Classification'];
  if (!classWs) { console.warn('  ⚠ No Classification sheet'); return; }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(classWs, { defval: null });
  for (const row of rows) {
    const key    = str(row['Tournament '] ?? row['Tournament']);
    const level  = str(row['Classification']).toLowerCase().replace('level ', '');
    const season = str(row['Season']);
    if (!key) continue;
    await findOrCreateTournament(key, parseInt(level) || 0, season || undefined);
  }
  console.log(`  ✅  ${rows.length} tournaments`);
}

async function loadMembership() {
  console.log('\n👤  Loading membership roster…');
  const wb = XLSX.readFile(path.join(DATA_DIR, 'ftest.xlsx'));
  const ws = wb.Sheets['Membership'];
  if (!ws) { console.warn('  ⚠ No Membership sheet'); return; }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  let count = 0;

  for (const row of rows) {
    const firstName = str(row['First Name']);
    const lastName  = str(row['Last Name']);
    if (!firstName && !lastName) continue;

    const fullName = `${lastName.toUpperCase()} ${firstName}`.trim();
    const cff = str(row['CFF Licence']) || null;

    await withRetry(() => prisma.member.upsert({
      where:  { cffLicence: cff ?? `__nocff__${fullName}` },
      update: {
        fullName,
        firstName,
        lastName,
        club:     str(row['Affiliates']) || null,
        sex:      str(row['Sex']) || null,
        province: str(row['Member Province']) || null,
        city:     str(row['Member City']) || null,
        country:  str(row['Member Country']) || null,
        status:   str(row['Status']) || null,
      },
      create: {
        fullName,
        firstName,
        lastName,
        cffLicence: cff,
        club:     str(row['Affiliates']) || null,
        sex:      str(row['Sex']) || null,
        province: str(row['Member Province']) || null,
        city:     str(row['Member City']) || null,
        country:  str(row['Member Country']) || null,
        status:   str(row['Status']) || null,
      },
    }));

    if (cff) {
      const byLicence = await withRetry(() => prisma.member.findFirst({ where: { cffLicence: cff } }));
      if (byLicence) memberCache.set(fullName.toUpperCase(), byLicence.id);
    }
    count++;
  }
  console.log(`  ✅  ${count} members`);
}

// ─── Step 2: point entries from ftest.xlsx LV0-LV4 sheets ───────────────────

function buildPointsLookup(wb: XLSX.WorkBook): Map<string, number> {
  const ws = wb.Sheets['Point Breakdown '] ?? wb.Sheets['Point Breakdown'];
  if (!ws) {
    console.warn('  ⚠ No Point Breakdown sheet found');
    return new Map();
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: null });
  const lookup = new Map<string, number>();

  const levelColumns: Record<number, string> = {
    0: 'regional',
    1: 'Sanctioned regional',
    2: 'AB Cup',
    3: 'Provincials',
    4: 'Canada Cup ',
  };

  for (const row of rows) {
    const place = num(row['__EMPTY']);
    if (!place) continue;

    for (const [levelIndex, col] of Object.entries(levelColumns)) {
      const pts = num(row[col]);
      if (pts != null) {
        lookup.set(`${levelIndex}::${place}`, pts);
      }
    }
  }

  console.log(`  📊  Points lookup built: ${lookup.size} place/level combinations`);
  return lookup;
}

async function loadPointEntries() {
  console.log('\n🏅  Loading point entries…');

  const wb = XLSX.readFile(path.join(DATA_DIR, 'ftest.xlsx'));
  const pointsLookup = buildPointsLookup(wb);

  const classWs = wb.Sheets['Classification'];
  const classRows = classWs
    ? XLSX.utils.sheet_to_json<Record<string, unknown>>(classWs, { defval: null })
    : [];
  const classificationMap = new Map<string, { level: number; season: string }>();
  for (const r of classRows) {
    const key    = str(r['Tournament '] ?? r['Tournament']);
    const level  = parseInt(str(r['Classification']).replace(/\D/g, '')) || 0;
    const season = str(r['Season']);
    if (key) classificationMap.set(key, { level, season });
  }

  const rows = readSheet('combined_fencing_results.xlsx');

  type PendingEntry = {
    memberId:     string;
    tournamentId: string;
    eventName:    string;
    place:        number;
    points:       number;
    weapon:       string;
    sex:          string;
    category:     string;
    season:       string | null;
  };

  const pendingByFencerTournament = new Map<string, PendingEntry[]>();
  let skipped = 0;

  for (const row of rows) {
    const sourceEvent = str(row['Source_Event']);
    const fencer      = str(row['fencer']);
    const place       = placeNum(row['place']);
    const club        = str(row['club']);
    const weapon      = normalizeWeapon(str(row['weapon']) || '');
    const sex         = str(row['sex']) || 'Mixed';
    const levelStr    = str(row['level']) || 'Open';
    const season      = str(row['season']);

    if (!fencer || !sourceEvent || place == null) { skipped++; continue; }

    const classification  = classificationMap.get(sourceEvent);
    const level           = classification?.level ?? 0;
    const resolvedSeason  = classification?.season || season || null;
    const points          = pointsLookup.get(`${level}::${place}`) ?? 0;
    const category        = categoryFromEventName(levelStr);
    const eventName       = `${levelStr} ${sex} ${weapon}`.trim();

    const memberId     = await findOrCreateMember({ fullName: fencer.toUpperCase(), club: club || undefined });
    const tournamentId = await findOrCreateTournament(sourceEvent, level, resolvedSeason ?? undefined);

    const bucketKey = `${memberId}::${tournamentId}`;
    if (!pendingByFencerTournament.has(bucketKey)) {
      pendingByFencerTournament.set(bucketKey, []);
    }
    pendingByFencerTournament.get(bucketKey)!.push({
      memberId, tournamentId, eventName, place, points,
      weapon, sex, category, season: resolvedSeason,
    });
  }

  let deduped = 0;
  const finalEntries: PendingEntry[] = [];

  for (const entries of pendingByFencerTournament.values()) {
    const hasWomensEntry = new Set<string>();
    for (const e of entries) {
      if (e.sex === 'Women' || e.sex === 'Female') {
        hasWomensEntry.add(`${e.weapon}::${e.category}`);
      }
    }

    for (const e of entries) {
      if (
        (e.sex === 'Mixed' || e.sex === 'Wheelchair') &&
        hasWomensEntry.has(`${e.weapon}::${e.category}`)
      ) {
        deduped++;
        continue;
      }
      finalEntries.push(e);
    }
  }

  let total = 0;
  for (const e of finalEntries) {
    await prisma.pointEntry.upsert({
      where:  { memberId_tournamentId_eventName: { memberId: e.memberId, tournamentId: e.tournamentId, eventName: e.eventName } },
      update: { points: e.points, place: e.place, season: e.season },
      create: {
        memberId:     e.memberId,
        tournamentId: e.tournamentId,
        eventName:    e.eventName,
        place:        e.place,
        points:       e.points,
        weapon:       e.weapon,
        sex:          e.sex,
        category:     e.category,
        season:       e.season,
      },
    });
    total++;
  }

  console.log(`  ✅  ${total} point entries written`);
  console.log(`  ♀️   ${deduped} mixed entries dropped in favour of women's entries`);
  console.log(`  ⏭️   ${skipped} rows skipped — missing fencer or place`);
}

// ─── Step 3: tournament results from combined_fencing_results.xlsx ───────────

async function loadTournamentResults() {
  console.log('\n🏆  Loading tournament results…');
  const rows = readSheet('combined_fencing_results.xlsx');
  let count = 0;

  for (const row of rows) {
    const sourceEvent = str(row['Source_Event']);
    const fencer      = str(row['fencer']);
    const place       = placeNum(row['place']);
    const club        = str(row['club']);
    const weapon      = normalizeWeapon(str(row['weapon']) || '');
    const sex         = str(row['sex']) || 'Mixed';
    const level       = str(row['level']) || 'Open';
    const season      = str(row['season']);

    if (!fencer || !sourceEvent) continue;

    const eventName = `${level} ${sex} ${weapon}`.trim();

    const tournamentId = await findOrCreateTournament(sourceEvent, 0, season || undefined);
    const memberId     = await findOrCreateMember({ fullName: fencer.toUpperCase(), club: club || undefined });
    const eventId      = await findOrCreateEvent(tournamentId, eventName);

    // Populate cross-reference cache for paired matches & bout orders
    if (!memberTournamentEventCache.has(memberId)) {
      memberTournamentEventCache.set(memberId, new Map());
    }
    memberTournamentEventCache.get(memberId)!.set(tournamentId, eventId);

    await prisma.tournamentResult.upsert({
      where:  { eventId_memberId: { eventId, memberId } },
      update: { place: place ?? 999, club: club || null },
      create: { tournamentId, eventId, memberId, place: place ?? 999, club: club || null },
    });
    count++;
  }
  console.log(`  ✅  ${count} tournament results`);
}

// ─── Step 4: pool sheets ─────────────────────────────────────────────────────

async function loadPoolSheets() {
  console.log('\n🎱  Loading pool sheets…');
  const rows = readSheet('combined_pool_sheets.xlsx');
  
  const poolMap = new Map<string, string>();
  let count = 0;

  for (const row of rows) {
    const sourceEvent    = str(row['Source_Event']);
    const fencerRaw      = str(row['Fencer']);
    const poolId         = str(row['Pool ID']);
    const sex            = str(row['Sex']) || 'Mixed';
    const level          = str(row['Level']) || 'Open';
    const victories      = num(row['Victories']) ?? 0;
    const bouts          = num(row['Number of Bouts']) ?? 0;
    const ts             = num(row['Touches Scored']) ?? 0;
    const touchesReceived = num(row['Touches Received']) ?? 0;
    const indicator      = num(row['Indicators']) ?? 0;
    const winRate        = num(row['Victories / Matches']) ?? 0;
    const poolPos        = num(row['Pool Position']) ?? 0;

    if (!fencerRaw || !sourceEvent) continue;

    const { name: fencerName, club } = parseFencerField(fencerRaw);
    if (!fencerName) continue;

    const tournamentId = await findOrCreateTournament(sourceEvent, 0);
    const memberId = await findOrCreateMember({ fullName: fencerName.toUpperCase(), club: club || undefined });

    const tournamentResult = await prisma.tournamentResult.findFirst({
      where: { tournamentId, memberId },
      select: { eventId: true },
    });

    let eventId: string | null = tournamentResult?.eventId ?? null;
    if (!eventId) {
      const ev = await prisma.event.findFirst({
        where: {
          tournamentId,
          name: { contains: `${level} ${sex}`.trim(), mode: 'insensitive' },
        },
        select: { id: true },
      });
      eventId = ev?.id ?? null;
    }
    if (!eventId) {
      const only = await prisma.event.findMany({
        where: { tournamentId },
        select: { id: true },
        take: 2,
      });
      if (only.length === 1) eventId = only[0].id;
    }
    if (!eventId) continue;

    const poolKey = `${eventId}::${poolId}`;
    if (!poolMap.has(poolKey)) {
      const pool = await prisma.pool.create({
        data: { eventId, sourcePoolId: poolId },
      });
      poolMap.set(poolKey, pool.id);
    }
    const dbPoolId = poolMap.get(poolKey)!;

    await prisma.poolEntry.upsert({
      where:  { poolId_memberId: { poolId: dbPoolId, memberId } },
      update: { victories, bouts, touchesScored: ts, touchesReceived, indicator, winRate, poolPosition: poolPos },
      create: { poolId: dbPoolId, memberId, victories, bouts, touchesScored: ts, touchesReceived, indicator, winRate, poolPosition: poolPos },
    });
    count++;
  }
  console.log(`  ✅  ${count} pool entries across ${poolMap.size} pools`);
}

// ─── Step 5: bout orders (individual bouts within pools) ────────────────────

async function loadBoutOrders() {
  console.log('\n⚔️   Loading bout orders…');
  const rows = readSheet('combined_bout_orders.xlsx');
  let count = 0;
  let skipped = 0;

  for (const row of rows) {
    const sourceEvent  = str(row['Source_Event']);
    const leftName     = str(row['Fencer Left']);
    const rightName    = str(row['Fencer Right']);
    const leftRaw      = str(row['Fencer Left Touches Scored']);
    const rightRaw     = str(row['Fencer Right Touches Scored']);
    const leftScore    = num(row['left score']);
    const rightScore   = num(row['right score']);

    if (!leftName || !rightName || !sourceEvent) continue;

    const { isVictory: leftWon, touches: leftTouches }  = parseScore(leftRaw);
    const { isVictory: rightWon, touches: rightTouches } = parseScore(rightRaw);

    const tournamentId  = await findOrCreateTournament(sourceEvent, 0);
    const leftMemberId  = await findOrCreateMember({ fullName: leftName.toUpperCase() });
    const rightMemberId = await findOrCreateMember({ fullName: rightName.toUpperCase() });
    const winnerId      = leftWon ? leftMemberId : rightWon ? rightMemberId : null;

    const poolIdStr = str(row['Pool ID']);
    let dbPoolId: string | undefined;
    let resolvedEventId: string | undefined;
    
    if (poolIdStr) {
      const poolRow = await prisma.pool.findFirst({
        where: { sourcePoolId: poolIdStr, event: { tournamentId } },
        select: { id: true, eventId: true },
      });
      if (poolRow) {
        dbPoolId = poolRow.id;
        resolvedEventId = poolRow.eventId;
      }
    }

    let eventId: string | null = resolvedEventId ?? null;
    
    // Cross-reference check via results cache
    if (!eventId) {
      eventId = memberTournamentEventCache.get(leftMemberId)?.get(tournamentId) ?? null;
    }
    if (!eventId) {
      eventId = memberTournamentEventCache.get(rightMemberId)?.get(tournamentId) ?? null;
    }

    let tournamentEvents = tournamentEventsCache.get(tournamentId);
    if (!tournamentEvents) {
      tournamentEvents = await prisma.event.findMany({
        where: { tournamentId },
        select: { id: true, weapon: true, sex: true },
      });
      tournamentEventsCache.set(tournamentId, tournamentEvents);
    }

    if (!eventId && tournamentEvents.length === 1) {
      eventId = tournamentEvents[0].id;
    } else if (!eventId && tournamentEvents.length > 1) {
      skipped++;
      continue;
    }

    const match = await withRetry(() => prisma.match.create({
      data: {
        poolId:       dbPoolId ?? undefined,
        eventId:      eventId ?? undefined,
        round:        'pool',
        leftMemberId,
        rightMemberId,
        leftScore:    leftScore ?? leftTouches,
        rightScore:   rightScore ?? rightTouches,
        winnerId,
      },
    }));

    await withRetry(() => prisma.boutResult.createMany({
      data: [
        {
          matchId:       match.id,
          memberId:      leftMemberId,
          touchesScored: leftScore ?? leftTouches ?? 0,
          result:        leftWon ? 'V' : 'D',
          poolPosition:  num(row['Fencer Left Pool Position']),
        },
        {
          matchId:       match.id,
          memberId:      rightMemberId,
          touchesScored: rightScore ?? rightTouches ?? 0,
          result:        rightWon ? 'V' : 'D',
          poolPosition:  num(row['Fencer Right Pool Position']),
        },
      ],
    }));
    count++;
  }
  console.log(`  ✅  ${count} bouts`);
  if (skipped > 0) console.log(`  ⏭️  ${skipped} pool bouts skipped (could not determine weapon/event)`);
}

// ─── Step 6: paired matches (elimination rounds) ─────────────────────────────

async function loadPairedMatches() {
  console.log('\n🎯  Loading paired matches (elimination)…');
  const rows = readSheet('combined_paired_matches.xlsx');
  let count = 0;
  let skipped = 0;

  for (const row of rows) {
    const sourceEvent = str(row['Source_Event']);
    const fencerA     = str(row['Fencer A']);
    const fencerB     = str(row['Fencer B']);
    const scoreRaw    = str(row['Score and Referee']);

    if (!fencerA || !fencerB || !sourceEvent) continue;
    if (fencerB.includes('BYE'))  continue;

    const scoreParts = scoreRaw.split('-').map(s => num(s.trim()));
    const scoreA = scoreParts[0];
    const scoreB = scoreParts[1];

    const cleanName = (raw: string) => raw.replace(/^\(\d+\)\s*/, '').split('/')[0].trim();
    const nameA = cleanName(fencerA);
    const nameB = cleanName(fencerB);

    if (!nameA || !nameB) continue;

    const tournamentId  = await findOrCreateTournament(sourceEvent, 0);
    const leftMemberId  = await findOrCreateMember({ fullName: nameA.toUpperCase() });
    const rightMemberId = await findOrCreateMember({ fullName: nameB.toUpperCase() });
    
    let winnerId: string | null = null;
    if (scoreA != null && scoreB != null) {
      winnerId = scoreA > scoreB ? leftMemberId : scoreB > scoreA ? rightMemberId : null;
    }

    let eventId: string | null = null;
    
    // 1. Ultra-fast memory lookup using data from combined_fencing_results.xlsx
    eventId = memberTournamentEventCache.get(leftMemberId)?.get(tournamentId) ?? null;
    
    // 2. Try right fencer in memory cache
    if (!eventId) {
      eventId = memberTournamentEventCache.get(rightMemberId)?.get(tournamentId) ?? null;
    }

    // 3. DB fallback: TournamentResult for left fencer
    if (!eventId) {
      const resultA = await prisma.tournamentResult.findFirst({
        where: { memberId: leftMemberId, tournamentId },
        select: { eventId: true },
      });
      eventId = resultA?.eventId ?? null;
    }

    // 4. DB fallback: TournamentResult for right fencer
    if (!eventId) {
      const resultB = await prisma.tournamentResult.findFirst({
        where: { memberId: rightMemberId, tournamentId },
        select: { eventId: true },
      });
      eventId = resultB?.eventId ?? null;
    }

    // 5. DB fallback: PoolEntry for left fencer
    if (!eventId) {
      const poolA = await prisma.poolEntry.findFirst({
        where: { memberId: leftMemberId, pool: { event: { tournamentId } } },
        select: { pool: { select: { eventId: true } } },
      });
      eventId = poolA?.pool?.eventId ?? null;
    }

    // 6. DB fallback: PoolEntry for right fencer
    if (!eventId) {
      const poolB = await prisma.poolEntry.findFirst({
        where: { memberId: rightMemberId, pool: { event: { tournamentId } } },
        select: { pool: { select: { eventId: true } } },
      });
      eventId = poolB?.pool?.eventId ?? null;
    }

    // 7. If we STILL can't find the weapon/event, skip the match to prevent ELO contamination
    if (!eventId) {
      skipped++;
      continue;
    }

    await withRetry(() => prisma.match.create({
      data: {
        round:        'elimination',
        eventId:      eventId,
        leftMemberId,
        rightMemberId,
        leftScore:    scoreA,
        rightScore:   scoreB,
        winnerId,
      },
    }));
    count++;
  }
  console.log(`  ✅  ${count} elimination matches`);
  if (skipped > 0) console.log(`  ⏭️  ${skipped} elimination matches skipped (could not determine weapon/event)`);
}

// ─── Step 7: compute ELO ratings from all matches ────────────────────────────

async function computeEloRatings() {
  console.log('\n📈  Computing ELO ratings…');

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      pool: { include: { event: { include: { tournament: true } } } },
      event: { include: { tournament: true } },
    },
  });

  const ratings = new Map<string, number>();
  const wins    = new Map<string, number>();
  const losses  = new Map<string, number>();
  const games   = new Map<string, number>();
  const peaks   = new Map<string, number>();
  const historyBuf: Array<{
    eloKey:     string;
    memberId:   string;
    weapon:     string;
    before:     number;
    after:      number;
    change:     number;
    opponentId: string;
  }> = [];

  const rKey = (mid: string, weapon: string) =>
    `${mid}::${weapon}`;
  const getR = (mid: string, weapon: string) =>
    ratings.get(rKey(mid, weapon)) ?? ELO_DEFAULT_RATING;

  for (const match of matches) {
    if (!match.winnerId) continue;

    const strand = eloStrandFromMatch(match);
    if (!strand) continue;

    const { weapon } = strand;
    const { leftMemberId: a, rightMemberId: b, winnerId } = match;
    const loserId = winnerId === a ? b : a;

    const rkW = rKey(winnerId, weapon);
    const rkL = rKey(loserId, weapon);

    const rW = getR(winnerId, weapon);
    const rL = getR(loserId, weapon);
    const [nW, nL] = calculateElo(rW, rL);

    ratings.set(rkW, nW);
    ratings.set(rkL, nL);
    wins.set(   rkW, (wins.get(   rkW) ?? 0) + 1);
    losses.set( rkL, (losses.get( rkL) ?? 0) + 1);
    games.set(  rkW, (games.get(  rkW) ?? 0) + 1);
    games.set(  rkL, (games.get(  rkL) ?? 0) + 1);
    peaks.set(  rkW, Math.max(peaks.get(rkW) ?? ELO_DEFAULT_RATING, nW));
    peaks.set(  rkL, Math.max(peaks.get(rkL) ?? ELO_DEFAULT_RATING, nL));

    historyBuf.push({ eloKey: rkW, memberId: winnerId, weapon, before: rW, after: nW, change: nW - rW, opponentId: loserId });
    historyBuf.push({ eloKey: rkL, memberId: loserId,  weapon, before: rL, after: nL, change: nL - rL, opponentId: winnerId });
  }

  // Persist EloRating rows
  for (const [key, rating] of ratings.entries()) {
    const [memberId, weapon] = key.split('::');
    await withRetry(() => prisma.eloRating.upsert({
      where:  { memberId_weapon_season_category: { memberId, weapon, season: '', category: '' } },
      update: {
        rating,
        gamesPlayed: games.get(key)  ?? 0,
        wins:        wins.get(key)   ?? 0,
        losses:      losses.get(key) ?? 0,
        peakRating:  peaks.get(key)  ?? rating,
        lastUpdated: new Date(),
      },
      create: {
        memberId,
        weapon,
        season: '',
        category: '',
        rating,
        gamesPlayed: games.get(key)  ?? 0,
        wins:        wins.get(key)   ?? 0,
        losses:      losses.get(key) ?? 0,
        peakRating:  peaks.get(key)  ?? rating,
      },
    }));
  }

  // Build eloRatingId lookup map
  const eloRatingIdMap = new Map<string, string>();
  const allElo = await withRetry(() =>
    prisma.eloRating.findMany({ select: { id: true, memberId: true, weapon: true, season: true, category: true } }),
  );
  for (const e of allElo) {
    eloRatingIdMap.set(`${e.memberId}::${e.weapon}`, e.id);
  }

  // Insert history in batches of 500
  const batchSize = 500;
  for (let i = 0; i < historyBuf.length; i += batchSize) {
    const batch = historyBuf.slice(i, i + batchSize);
    await withRetry(() => prisma.eloHistory.createMany({
      data: batch
        .map(h => ({
          eloRatingId:  eloRatingIdMap.get(h.eloKey)!,
          ratingBefore: h.before,
          ratingAfter:  h.after,
          change:       h.change,
          opponentId:   h.opponentId,
        }))
        .filter(h => h.eloRatingId),
      skipDuplicates: true,
    }));
  }

  console.log(`  ✅  ${ratings.size} ELO ratings · ${historyBuf.length} history entries`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🏁  Starting data import…');
  console.log('   Data directory:', DATA_DIR);

  await loadClassification();
  await loadMembership();
  await loadPointEntries();
  await loadTournamentResults(); // Populates the cross-reference cache
  await loadPoolSheets();
  await loadBoutOrders();
  await loadPairedMatches();     // Uses the cross-reference cache
  await computeEloRatings();

  console.log('\n🎉  Import complete!');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('❌  Import failed:', e);
  prisma.$disconnect();
  process.exit(1);
});