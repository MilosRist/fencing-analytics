// src/lib/queries.ts
import prisma from './prisma';
import { matchStandardWeapon, type MatchWithEventContext } from './matchContext';

// ── Rankings ────────────────────────────────────────────────────────────────

export async function getRankings(filters: {
  season?:   string;
  weapon?:   string;
  sex?:      string;
  category?: string;
  limit?:    number;
}) {
  const { season, weapon, sex, category, limit = 50 } = filters;
  if (!season || !weapon || !category) return [];

  const where: Record<string, unknown> = { season, weapon, category };
  if (sex) where.sex = sex;

  const results = await prisma.pointEntry.groupBy({
    by:       ['memberId'],
    where,
    _sum:     { points: true },
    _count:   { id: true },
    orderBy:  { _sum: { points: 'desc' } },
    take:     limit,
  });

  const memberIds = results.map(r => r.memberId);
  const members   = await prisma.member.findMany({
    where:  { id: { in: memberIds } },
    select: { id: true, fullName: true, club: true, province: true },
  });
  const memberMap = Object.fromEntries(members.map(m => [m.id, m]));

  return results.map((r, i) => ({
    rank:         i + 1,
    member:       memberMap[r.memberId],
    totalPoints:  r._sum.points ?? 0,
    tournaments:  r._count.id,
  }));
}

/**
 * AFA-only rankings: only members with province = 'AB' are shown.
 *
 * Sex filter semantics:
 *   "Men"   → include Men + Mixed event points (folded into Men ranking)
 *   "Women" → include Women event points only
 *   "Any"   → include ALL event sex values (Men + Women + Mixed), summed per fencer
 */
export async function getRankingsAFA(filters: {
  season?:   string;
  weapon?:   string;
  sex?:      string;
  category?: string;
  limit?:    number;
}) {
  const { season, weapon, sex, category, limit = 100 } = filters;
  if (!season || !weapon || !category) return [];

  const where: Record<string, unknown> = { season, weapon, category };

  if (sex === 'Men') {
    where.sex = { in: ['Men', 'Mixed'] };
  } else if (sex === 'Women') {
    where.sex = 'Women';
  }
  // "Any" → no sex filter

  const entries = await prisma.pointEntry.findMany({
    where,
    select: {
      memberId: true,
      points:   true,
      member: {
        select: { id: true, fullName: true, club: true, isAfaMember: true },
      },
    },
  });

  // Only show AFA members (imported from ftest Membership sheet) in rankings
  const afaEntries = entries.filter(e => e.member.isAfaMember);

  const memberTotals = new Map<string, { member: any; totalPoints: number; tournaments: number }>();
  for (const e of afaEntries) {
    const existing = memberTotals.get(e.memberId);
    if (existing) {
      existing.totalPoints += e.points ?? 0;
      existing.tournaments += 1;
    } else {
      memberTotals.set(e.memberId, {
        member:      e.member,
        totalPoints: e.points ?? 0,
        tournaments: 1,
      });
    }
  }

  return [...memberTotals.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, limit)
    .map((row, i) => ({ rank: i + 1, ...row }));
}

// ── Member search ────────────────────────────────────────────────────────────

export async function searchMembers(query: string, limit = 20) {
  return prisma.member.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { firstName: { contains: query, mode: 'insensitive' } },
        { lastName: { contains: query, mode: 'insensitive' } },
        { cffLicence: { contains: query, mode: 'insensitive' } },
      ],
    },
    take: limit,
    select: { id: true, fullName: true, club: true, sex: true },
  });
}

// ── Member profile ───────────────────────────────────────────────────────────

export async function getMemberProfile(memberId: string) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      eloRatings: { include: { history: { orderBy: { createdAt: 'asc' } } } },
      tournamentResults: {
        include: { tournament: true, event: true },
        orderBy: { tournament: { date: 'desc' } },
        take: 20,
      },
      pointEntries: {
        orderBy: { createdAt: 'desc' },
        take: 500,
      },
    },
  });

  if (!member) return null;

  const matches = await prisma.match.findMany({
    where: { OR: [{ leftMemberId: memberId }, { rightMemberId: memberId }] },
    include: {
      pool: { include: { event: { include: { tournament: true } } } },
      event: { include: { tournament: true } },
    },
  });

  const decided = matches.filter((m) => m.winnerId);
  const wins = decided.filter((m) => m.winnerId === memberId).length;
  const losses = decided.length - wins;

  const wlByWeapon = (['Epee', 'Foil', 'Saber'] as const).map((weapon) => {
    const inWeapon = matches.filter((m) => matchStandardWeapon(m as MatchWithEventContext) === weapon);
    const decidedInWeapon = inWeapon.filter((m) => m.winnerId);
    const w = decidedInWeapon.filter((m) => m.winnerId === memberId).length;
    const l = decidedInWeapon.length - w;
    return { weapon, wins: w, losses: l };
  }).filter((row) => row.wins > 0 || row.losses > 0);

  return {
    ...member,
    stats: {
      totalMatches: decided.length,
      wins,
      losses,
      winRate: decided.length > 0 ? (wins / decided.length) * 100 : 0,
    },
    wlByWeapon,
  };
}

// ── Club detail ─────────────────────────────────────────────────────────────

export async function getClubDetail(clubName: string) {
  // All point entries for members of this club
  const entries = await prisma.pointEntry.findMany({
    where: { member: { club: clubName } },
    select: {
      memberId: true,
      points:   true,
      member: { select: { id: true, fullName: true, club: true, isAfaMember: true } },
    },
  });

  // Get best ELO rating per member (highest current rating across all weapons)
  const eloRatings = await prisma.eloRating.findMany({
    where: { member: { club: clubName } },
    orderBy: { rating: 'desc' },
    include: { member: { select: { id: true } } },
  });

  // Map: memberId → best ELO entry
  const bestEloMap = new Map<string, any>();
  for (const r of eloRatings) {
    if (!bestEloMap.has(r.memberId)) {
      bestEloMap.set(r.memberId, r);
    }
  }

  // Aggregate totals
  const memberTotals = new Map<string, { member: any; totalPoints: number; tournaments: number }>();
  for (const e of entries) {
    const existing = memberTotals.get(e.memberId);
    if (existing) {
      existing.totalPoints += e.points ?? 0;
      existing.tournaments += 1;
    } else {
      memberTotals.set(e.memberId, {
        member:      e.member,
        totalPoints: e.points ?? 0,
        tournaments: 1,
      });
    }
  }

  return [...memberTotals.values()]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map(row => ({
      ...row,
      bestElo: bestEloMap.get(row.member.id) ?? null,
    }));
}

// ── Club rankings ────────────────────────────────────────────────────────────

export async function getClubRankings(filters: { season?: string; weapon?: string }) {
  const { season, weapon } = filters;
  const where: Record<string, unknown> = {};
  if (season) where.season = season;
  if (weapon) where.weapon = weapon;

  const results = await prisma.pointEntry.groupBy({
    by: ['memberId'],
    where,
    _sum: { points: true },
  });

  const memberIds = results.map((r) => r.memberId);
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, club: true },
  });

  const clubPoints: Record<string, { points: number; members: Set<string> }> = {};
  for (const r of results) {
    const member = members.find((m) => m.id === r.memberId);
    const club = member?.club ?? 'Unknown';
    if (!clubPoints[club]) clubPoints[club] = { points: 0, members: new Set() };
    clubPoints[club].points += r._sum.points ?? 0;
    clubPoints[club].members.add(r.memberId);
  }

  return Object.entries(clubPoints)
    .map(([club, data]) => ({
      club,
      totalPoints: data.points,
      memberCount: data.members.size,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((c, i) => ({ ...c, rank: i + 1 }));
}

// ── ELO leaderboard ──────────────────────────────────────────────────────────

export async function getEloLeaderboard(filters: {
  weapon?: string;
  season?: string;
  category?: string;
  sex?: string;
  limit?: number;
}) {
  const { weapon, season, category, sex, limit = 50 } = filters;
  const where: Record<string, unknown> = {};
  if (weapon) where.weapon = weapon;
  // sex is on the member relation — filter post-query if provided
  
  const ratings = await prisma.eloRating.findMany({
    where,
    orderBy: { rating: 'desc' },
    take: 5000, // fetch generously, filter down after
    include: {
      member: { select: { id: true, fullName: true, club: true, sex: true, isAfaMember: true } },
    },
  });

  // Only display AFA members on the leaderboard.
  // Non-AFA members still participate in ELO calculations (recompute-elo.ts)
  // and are searchable via fencer search and head-to-head — just not shown here.
  const afaOnly = ratings.filter(r => r.member.isAfaMember);

  // Apply sex filter if provided (Member.sex stores 'M'/'F', UI sends 'Men'/'Women')
  const sexMap: Record<string, string> = { Men: 'M', Women: 'F' };
  const filtered = sex
    ? afaOnly.filter(r => r.member.sex === (sexMap[sex] ?? sex)).slice(0, limit)
    : afaOnly.slice(0, limit);

  return filtered.map((r, i) => ({ rank: i + 1, ...r }));
}

// ── Head-to-head ─────────────────────────────────────────────────────────────

export async function getHeadToHead(memberAId: string, memberBId: string) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { leftMemberId: memberAId, rightMemberId: memberBId },
        { leftMemberId: memberBId, rightMemberId: memberAId },
      ],
    },
    include: {
      leftMember:  { select: { id: true, fullName: true } },
      rightMember: { select: { id: true, fullName: true } },
      pool: { include: { event: { include: { tournament: true } } } },
      event: { include: { tournament: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  const decided = matches.filter((m) => m.winnerId);
  const aWins = decided.filter((m) => m.winnerId === memberAId).length;
  const bWins = decided.filter((m) => m.winnerId === memberBId).length;

  return { matches, aWins, bWins };
}

// ── Seasons / filter options ──────────────────────────────────────────────────

export async function getFilterOptions() {
  const [seasons, weapons, categories] = await Promise.all([
    prisma.pointEntry.findMany({ distinct: ['season'], select: { season: true }, where: { season: { not: null } } }),
    prisma.pointEntry.findMany({ distinct: ['weapon'], select: { weapon: true }, where: { weapon: { not: null } } }),
    prisma.pointEntry.findMany({ distinct: ['category'], select: { category: true }, where: { category: { not: null } } }),
  ]);

  return {
    seasons: seasons.map((s) => s.season!).sort().reverse(),
    weapons: weapons.map((w) => w.weapon!).sort(),
    categories: categories.map((c) => c.category!).sort(),
  };
}

// ── Tournament overview ───────────────────────────────────────────────────────

export async function getTournaments(filters?: { season?: string; level?: number }) {
  const where: Record<string, unknown> = {};
  if (filters?.season) where.season = filters.season;
  if (filters?.level !== undefined) where.level = filters.level;
  return prisma.tournament.findMany({
    where,
    include: {
      _count: { select: { events: true, tournamentResults: true } },
    },
    orderBy: [{ date: 'desc' }, { name: 'asc' }],
  });
}

export async function getTournamentDetail(id: string) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          tournamentResults: {
            include: { member: { select: { id: true, fullName: true, club: true } } },
            orderBy: { place: 'asc' },
          },
          _count: { select: { pools: true, tournamentResults: true } },
        },
      },
    },
  });
}
