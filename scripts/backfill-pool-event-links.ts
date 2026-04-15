#!/usr/bin/env tsx
// scripts/backfill-pool-event-links.ts
//
// Fixes pools/matches that were linked to "Mixed" events due to older imports.
// Strategy:
// - For each pool: look at pool entries' members, find TournamentResult rows in the same tournament,
//   choose the most common eventId, and update pool.eventId to that eventId.
// - Then ensure all matches in that pool have match.eventId = pool.eventId.
//
// Run: npx tsx scripts/backfill-pool-event-links.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({ log: ['warn', 'error'] });

async function main() {
  const pools = await prisma.pool.findMany({
    select: {
      id: true,
      eventId: true,
      sourcePoolId: true,
      event: { select: { tournamentId: true, weapon: true, name: true } },
      entries: { select: { memberId: true } },
    },
  });

  let updatedPools = 0;
  let updatedMatches = 0;
  let skippedPools = 0;

  for (const pool of pools) {
    const tournamentId = pool.event.tournamentId;
    const memberIds = pool.entries.map((e) => e.memberId);
    if (memberIds.length === 0) {
      skippedPools++;
      continue;
    }

    const trs = await prisma.tournamentResult.findMany({
      where: { tournamentId, memberId: { in: memberIds } },
      select: { eventId: true },
    });

    const counts = new Map<string, number>();
    for (const tr of trs) counts.set(tr.eventId, (counts.get(tr.eventId) ?? 0) + 1);

    // No signal; skip.
    if (counts.size === 0) {
      skippedPools++;
      continue;
    }

    // Pick most common eventId.
    let bestEventId = pool.eventId;
    let bestCount = -1;
    for (const [eventId, c] of counts.entries()) {
      if (c > bestCount) {
        bestCount = c;
        bestEventId = eventId;
      }
    }

    if (bestEventId !== pool.eventId) {
      await prisma.pool.update({
        where: { id: pool.id },
        data: { eventId: bestEventId },
      });
      updatedPools++;
    }

    const m = await prisma.match.updateMany({
      where: { poolId: pool.id, eventId: { not: bestEventId } },
      data: { eventId: bestEventId },
    });
    updatedMatches += m.count;
  }

  console.log(`✅ Updated pools: ${updatedPools}`);
  console.log(`✅ Updated pool matches: ${updatedMatches}`);
  console.log(`⏭️  Skipped pools (no entries / no TR signal): ${skippedPools}`);

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error('❌ Failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});

