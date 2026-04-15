#!/usr/bin/env tsx
// scripts/recompute-elo.ts
// Run after backfilling Match.eventId / poolId to recompute ELO per weapon, season, and category.
// Usage: npx tsx scripts/recompute-elo.ts

import { PrismaClient } from '@prisma/client';
import { calculateElo, ELO_DEFAULT_RATING } from '../src/lib/elo';
import { eloStrandFromMatch } from '../src/lib/matchContext';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function main() {
  console.log('🗑️  Clearing existing ELO data…');
  await prisma.eloHistory.deleteMany();
  await prisma.eloRating.deleteMany();

  console.log('📈  Recomputing ELO ratings…');

  const matches = await prisma.match.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      pool: { include: { event: { include: { tournament: true } } } },
      event: { include: { tournament: true } },
    },
  });

  const ratings = new Map<string, number>();
  const wins = new Map<string, number>();
  const losses = new Map<string, number>();
  const games = new Map<string, number>();
  const peaks = new Map<string, number>();
  const historyBuf: Array<{
    eloKey: string;
    memberId: string;
    weapon: string;
    before: number;
    after: number;
    change: number;
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
    wins.set(rkW, (wins.get(rkW) ?? 0) + 1);
    losses.set(rkL, (losses.get(rkL) ?? 0) + 1);
    games.set(rkW, (games.get(rkW) ?? 0) + 1);
    games.set(rkL, (games.get(rkL) ?? 0) + 1);
    peaks.set(rkW, Math.max(peaks.get(rkW) ?? ELO_DEFAULT_RATING, nW));
    peaks.set(rkL, Math.max(peaks.get(rkL) ?? ELO_DEFAULT_RATING, nL));

    historyBuf.push({ eloKey: rkW, memberId: winnerId, weapon, before: rW, after: nW, change: nW - rW, opponentId: loserId });
    historyBuf.push({ eloKey: rkL, memberId: loserId, weapon, before: rL, after: nL, change: nL - rL, opponentId: winnerId });
  }

  for (const [key, rating] of ratings.entries()) {
    const [memberId, weapon] = key.split('::');
    await prisma.eloRating.upsert({
      where: { memberId_weapon_season_category: { memberId, weapon, season: '', category: '' } },
      update: {
        rating,
        gamesPlayed: games.get(key) ?? 0,
        wins: wins.get(key) ?? 0,
        losses: losses.get(key) ?? 0,
        peakRating: peaks.get(key) ?? rating,
        lastUpdated: new Date(),
      },
      create: {
        memberId,
        weapon,
        season: '',
        category: '',
        rating,
        gamesPlayed: games.get(key) ?? 0,
        wins: wins.get(key) ?? 0,
        losses: losses.get(key) ?? 0,
        peakRating: peaks.get(key) ?? rating,
      },
    });
  }

  const eloRatingIdMap = new Map<string, string>();
  const allElo = await prisma.eloRating.findMany({
    select: { id: true, memberId: true, weapon: true, season: true, category: true },
  });
  for (const e of allElo) {
    eloRatingIdMap.set(`${e.memberId}::${e.weapon}`, e.id);
  }

  const batchSize = 500;
  for (let i = 0; i < historyBuf.length; i += batchSize) {
    const batch = historyBuf.slice(i, i + batchSize);
    await prisma.eloHistory.createMany({
      data: batch
        .map((h) => ({
          eloRatingId: eloRatingIdMap.get(h.eloKey)!,
          ratingBefore: h.before,
          ratingAfter: h.after,
          change: h.change,
          opponentId: h.opponentId,
        }))
        .filter((h) => h.eloRatingId),
      skipDuplicates: true,
    });
  }

  console.log(`  ✅  ${ratings.size} ELO ratings · ${historyBuf.length} history entries`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌  Failed:', e);
  prisma.$disconnect();
  process.exit(1);
});
