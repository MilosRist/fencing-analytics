export function formatPoints(value: unknown): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return '0';

  // Avoid floating point noise like 37.499999999.
  const rounded1 = Math.round(n * 10) / 10;

  // Keep decimals when they matter (e.g. 37.5), but don't show trailing ".0".
  return Number.isInteger(rounded1) ? rounded1.toFixed(0) : rounded1.toFixed(1);
}

