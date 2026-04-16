function eloTier(rating) {
  if (rating >= 2e3) return { label: "Master", color: "text-yellow-400" };
  if (rating >= 1800) return { label: "Diamond", color: "text-cyan-400" };
  if (rating >= 1600) return { label: "Platinum", color: "text-purple-400" };
  if (rating >= 1400) return { label: "Gold", color: "text-amber-400" };
  if (rating >= 1200) return { label: "Silver", color: "text-slate-300" };
  return { label: "Bronze", color: "text-orange-600" };
}

export { eloTier as e };
