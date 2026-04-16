function formatPoints(value) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return "0";
  const rounded1 = Math.round(n * 10) / 10;
  return Number.isInteger(rounded1) ? rounded1.toFixed(0) : rounded1.toFixed(1);
}

export { formatPoints as f };
