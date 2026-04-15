// src/lib/elo.ts

export const ELO_K_FACTOR = 32;
export const ELO_DEFAULT_RATING = 1200;

/**
 * Calculate expected score for player A vs player B
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

/**
 * Calculate new ELO ratings after a match
 * Returns [newRatingWinner, newRatingLoser]
 */
export function calculateElo(
  winnerRating: number,
  loserRating: number,
  kFactor = ELO_K_FACTOR
): [number, number] {
  const expectedWin = expectedScore(winnerRating, loserRating);
  const expectedLoss = expectedScore(loserRating, winnerRating);

  const newWinnerRating = Math.round(winnerRating + kFactor * (1 - expectedWin));
  const newLoserRating = Math.round(loserRating + kFactor * (0 - expectedLoss));

  return [newWinnerRating, newLoserRating];
}

/**
 * Get descriptive tier from ELO rating
 */
export function eloTier(rating: number): { label: string; color: string } {
  if (rating >= 2000) return { label: 'Master',     color: 'text-yellow-400' };
  if (rating >= 1800) return { label: 'Diamond',    color: 'text-cyan-400'   };
  if (rating >= 1600) return { label: 'Platinum',   color: 'text-purple-400' };
  if (rating >= 1400) return { label: 'Gold',       color: 'text-amber-400'  };
  if (rating >= 1200) return { label: 'Silver',     color: 'text-slate-300'  };
  return               { label: 'Bronze',     color: 'text-orange-600' };
}
