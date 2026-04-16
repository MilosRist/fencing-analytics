import { p as prisma } from './prisma_D3fH1VVB.mjs';

function resolvedEvent(m) {
  return m.pool?.event ?? m.event ?? null;
}
const STANDARD_WEAPONS = /* @__PURE__ */ new Set(["Epee", "Foil", "Saber"]);
function matchStandardWeapon(m) {
  const ev = resolvedEvent(m);
  const w = ev?.weapon;
  if (w && STANDARD_WEAPONS.has(w)) return w;
  const name = (ev?.name ?? "").toLowerCase();
  if (name.includes("epee") || name.includes("épée")) return "Epee";
  if (name.includes("foil")) return "Foil";
  if (name.includes("saber") || name.includes("sabre")) return "Saber";
  return null;
}
function formatRoundLabel(round) {
  if (!round) return "Bout";
  if (round === "pool") return "Pool round";
  if (round === "elimination") return "Elimination";
  return round;
}

async function getRankings(filters) {
  const { season, weapon, sex, category, limit = 50 } = filters;
  if (!weapon && !category) return [];
  const where = {};
  if (season) where.season = season;
  if (weapon) where.weapon = weapon;
  if (sex) where.sex = sex;
  if (category) where.category = category;
  const results = await prisma.pointEntry.groupBy({
    by: ["memberId"],
    where,
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: "desc" } },
    take: limit
  });
  const memberIds = results.map((r) => r.memberId);
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, fullName: true, club: true, province: true }
  });
  const memberMap = Object.fromEntries(members.map((m) => [m.id, m]));
  return results.map((r, i) => ({
    rank: i + 1,
    member: memberMap[r.memberId],
    totalPoints: r._sum.points ?? 0,
    tournaments: r._count.id
  }));
}
async function searchMembers(query, limit = 20) {
  return prisma.member.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: "insensitive" } },
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { cffLicence: { contains: query, mode: "insensitive" } }
      ]
    },
    take: limit,
    select: { id: true, fullName: true, club: true, sex: true }
  });
}
async function getMemberProfile(memberId) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      eloRatings: { include: { history: { orderBy: { createdAt: "asc" } } } },
      tournamentResults: {
        include: { tournament: true, event: true },
        orderBy: { tournament: { date: "desc" } },
        take: 20
      },
      pointEntries: {
        orderBy: { createdAt: "desc" },
        take: 500
      }
    }
  });
  if (!member) return null;
  const matches = await prisma.match.findMany({
    where: { OR: [{ leftMemberId: memberId }, { rightMemberId: memberId }] },
    include: {
      pool: { include: { event: { include: { tournament: true } } } },
      event: { include: { tournament: true } }
    }
  });
  const decided = matches.filter((m) => m.winnerId);
  const wins = decided.filter((m) => m.winnerId === memberId).length;
  const losses = decided.length - wins;
  const wlByWeapon = ["Epee", "Foil", "Saber"].map((weapon) => {
    const inWeapon = matches.filter((m) => matchStandardWeapon(m) === weapon);
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
      winRate: decided.length > 0 ? wins / decided.length * 100 : 0
    },
    wlByWeapon
  };
}
async function getClubRankings(filters) {
  const { season, weapon } = filters;
  const where = {};
  if (season) where.season = season;
  if (weapon) where.weapon = weapon;
  const results = await prisma.pointEntry.groupBy({
    by: ["memberId"],
    where,
    _sum: { points: true }
  });
  const memberIds = results.map((r) => r.memberId);
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds } },
    select: { id: true, club: true }
  });
  const clubPoints = {};
  for (const r of results) {
    const member = members.find((m) => m.id === r.memberId);
    const club = member?.club ?? "Unknown";
    if (!clubPoints[club]) clubPoints[club] = { points: 0, members: /* @__PURE__ */ new Set() };
    clubPoints[club].points += r._sum.points ?? 0;
    clubPoints[club].members.add(r.memberId);
  }
  return Object.entries(clubPoints).map(([club, data]) => ({
    club,
    totalPoints: data.points,
    memberCount: data.members.size
  })).sort((a, b) => b.totalPoints - a.totalPoints).map((c, i) => ({ ...c, rank: i + 1 }));
}
async function getEloLeaderboard(filters) {
  const { weapon, season, category, limit = 50 } = filters;
  const where = {};
  if (weapon) where.weapon = weapon;
  if (season) where.season = season;
  if (category) where.category = category;
  const ratings = await prisma.eloRating.findMany({
    where,
    orderBy: { rating: "desc" },
    take: limit,
    include: {
      member: { select: { id: true, fullName: true, club: true, sex: true } }
    }
  });
  return ratings.map((r, i) => ({ rank: i + 1, ...r }));
}
async function getHeadToHead(memberAId, memberBId) {
  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { leftMemberId: memberAId, rightMemberId: memberBId },
        { leftMemberId: memberBId, rightMemberId: memberAId }
      ]
    },
    include: {
      leftMember: { select: { id: true, fullName: true } },
      rightMember: { select: { id: true, fullName: true } },
      pool: { include: { event: { include: { tournament: true } } } },
      event: { include: { tournament: true } }
    },
    orderBy: { createdAt: "desc" }
  });
  const decided = matches.filter((m) => m.winnerId);
  const aWins = decided.filter((m) => m.winnerId === memberAId).length;
  const bWins = decided.filter((m) => m.winnerId === memberBId).length;
  return { matches, aWins, bWins };
}
async function getFilterOptions() {
  const [seasons, weapons, categories] = await Promise.all([
    prisma.pointEntry.findMany({ distinct: ["season"], select: { season: true }, where: { season: { not: null } } }),
    prisma.pointEntry.findMany({ distinct: ["weapon"], select: { weapon: true }, where: { weapon: { not: null } } }),
    prisma.pointEntry.findMany({ distinct: ["category"], select: { category: true }, where: { category: { not: null } } })
  ]);
  return {
    seasons: seasons.map((s) => s.season).sort().reverse(),
    weapons: weapons.map((w) => w.weapon).sort(),
    categories: categories.map((c) => c.category).sort()
  };
}
async function getTournaments() {
  return prisma.tournament.findMany({
    include: {
      _count: { select: { events: true, tournamentResults: true } }
    },
    orderBy: [{ date: "desc" }, { name: "asc" }]
  });
}
async function getTournamentDetail(id) {
  return prisma.tournament.findUnique({
    where: { id },
    include: {
      events: {
        include: {
          tournamentResults: {
            include: { member: { select: { id: true, fullName: true, club: true } } },
            orderBy: { place: "asc" }
          },
          _count: { select: { pools: true, tournamentResults: true } }
        }
      }
    }
  });
}

export { getFilterOptions as a, getEloLeaderboard as b, getMemberProfile as c, getHeadToHead as d, getRankings as e, formatRoundLabel as f, getClubRankings as g, getTournamentDetail as h, getTournaments as i, searchMembers as s };
