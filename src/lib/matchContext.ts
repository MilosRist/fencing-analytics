// Resolve event / weapon / season context for a match (pool bouts vs direct elimination).
import type { Event, Match, Pool, Tournament } from '@prisma/client';

export type MatchWithEventContext = Match & {
  pool?: (Pool & { event?: (Event & { tournament?: Tournament | null }) | null }) | null;
  event?: (Event & { tournament?: Tournament | null }) | null;
};

export function resolvedEvent(m: MatchWithEventContext): (Event & { tournament?: Tournament | null }) | null {
  return (m.pool?.event ?? m.event) ?? null;
}

const STANDARD_WEAPONS = new Set(['Epee', 'Foil', 'Saber']);

/** Weapon for stats / ELO (excludes Mixed / unknown). */
export function matchStandardWeapon(m: MatchWithEventContext): string | null {
  const ev = resolvedEvent(m);
  const w = ev?.weapon;
  if (w && STANDARD_WEAPONS.has(w)) return w;

  // Many imported events can have weapon="Mixed" even though the event name
  // contains the real weapon. Infer from the event name as a fallback.
  const name = (ev?.name ?? '').toLowerCase();
  if (name.includes('epee') || name.includes('épée')) return 'Epee';
  if (name.includes('foil')) return 'Foil';
  if (name.includes('saber') || name.includes('sabre')) return 'Saber';

  return null;
}

export function eloStrandFromMatch(m: MatchWithEventContext): { weapon: string; season: string; category: string } | null {
  const weapon = matchStandardWeapon(m);
  if (!weapon) return null;

  // Single ELO per weapon: collapse season/category dimensions.
  return { weapon, season: '', category: '' };
}

export function formatRoundLabel(round: string | null): string {
  if (!round) return 'Bout';
  if (round === 'pool') return 'Pool round';
  if (round === 'elimination') return 'Elimination';
  return round;
}
