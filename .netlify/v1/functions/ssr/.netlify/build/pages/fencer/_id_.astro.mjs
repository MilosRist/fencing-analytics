/* empty css                                    */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_D1AG8OrP.mjs';
import { c as getMemberProfile } from '../../chunks/queries_B5_YOMHP.mjs';
import { e as eloTier } from '../../chunks/elo_CChpJCox.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, BarChart, Bar } from 'recharts';
import { f as formatPoints } from '../../chunks/format_DsPesR42.mjs';
export { renderers } from '../../renderers.mjs';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#0f1629] border border-white/20 rounded-xl p-3 text-xs shadow-xl", children: [
    /* @__PURE__ */ jsx("div", { className: "text-slate-400 mb-1.5 font-medium", children: label }),
    payload.map((p) => /* @__PURE__ */ jsxs("div", { style: { color: p.color }, className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full inline-block", style: { background: p.color } }),
      /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
        p.name,
        ":"
      ] }),
      /* @__PURE__ */ jsx("span", { className: "font-bold tabular-nums", children: typeof p.value === "number" ? formatPoints(p.value) : p.value })
    ] }, p.dataKey))
  ] });
};
function FencerCharts({ data }) {
  const { pointsStrands, eloHistoryStrands, wlByWeapon } = data;
  const [eloIdx, setEloIdx] = useState(0);
  const eloData = eloHistoryStrands[eloIdx]?.history ?? [];
  const hasPoints = pointsStrands.some((s) => (s.points?.length ?? 0) > 1);
  const hasElo = eloData.length > 1;
  const hasWL = wlByWeapon.length > 0;
  const strandSelectClass = "mt-2 w-full text-xs rounded-lg border border-white/10 bg-white/5 text-slate-300 px-2 py-1.5";
  const pointsTimeline = useMemo(() => {
    if (pointsStrands.length === 0) return [];
    const maxN = Math.max(0, ...pointsStrands.map((s) => s.points.length));
    const rows = Array.from({ length: maxN }, (_, i) => ({
      n: i + 1,
      t: "T" + (i + 1)
    }));
    for (const s of pointsStrands) {
      for (const p of s.points) {
        rows[p.n - 1][s.key] = p.cumulative;
      }
    }
    return rows;
  }, [pointsStrands]);
  const colorForStrand = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const s of pointsStrands) {
      let h = 0;
      for (let i = 0; i < s.key.length; i++) h = h * 31 + s.key.charCodeAt(i) >>> 0;
      const hue = h * 137.50776405 % 360;
      map.set(s.key, `hsl(${hue.toFixed(1)} 78% 58%)`);
    }
    return map;
  }, [pointsStrands]);
  if (!hasPoints && !hasElo && !hasWL) return null;
  return /* @__PURE__ */ jsxs("div", { className: "grid md:grid-cols-2 gap-6 mb-6", children: [
    pointsStrands.length > 0 && /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm text-slate-400 uppercase tracking-wide mb-1", children: "Points trajectory" }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 mb-3", children: "Cumulative points within each season · weapon · category — not merged across disciplines." }),
      hasPoints ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, children: /* @__PURE__ */ jsxs(LineChart, { data: pointsTimeline, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "n", tick: { fill: "#94a3b8", fontSize: 10 }, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { tick: { fill: "#94a3b8", fontSize: 10 }, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: "11px", color: "#94a3b8" } }),
        pointsStrands.map((s) => /* @__PURE__ */ jsx(
          Line,
          {
            type: "monotone",
            dataKey: s.key,
            name: s.label,
            stroke: colorForStrand.get(s.key) ?? "#4d78ff",
            strokeWidth: 2.25,
            dot: false,
            connectNulls: true
          },
          s.key
        ))
      ] }) }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 py-8 text-center", children: "Add more than one result in this strand to plot a curve." })
    ] }),
    eloHistoryStrands.length > 0 && /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm text-slate-400 uppercase tracking-wide mb-1", children: "ELO history" }),
      /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 mb-3", children: "Rating changes for one discipline strand at a time." }),
      eloHistoryStrands.length > 1 && /* @__PURE__ */ jsx("select", { className: strandSelectClass, value: eloIdx, onChange: (e) => setEloIdx(Number(e.target.value)), children: eloHistoryStrands.map((s, i) => /* @__PURE__ */ jsx("option", { value: i, children: s.label }, s.key)) }),
      hasElo ? /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, children: /* @__PURE__ */ jsxs(LineChart, { data: eloData, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "name", tick: { fill: "#94a3b8", fontSize: 10 }, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { tick: { fill: "#94a3b8", fontSize: 10 }, tickLine: false, axisLine: false, domain: ["auto", "auto"] }),
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(Line, { type: "monotone", dataKey: "rating", name: "ELO", stroke: "#a855f7", strokeWidth: 2.5, dot: false })
      ] }) }) : /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500 py-8 text-center", children: "Not enough rated bouts in this strand for a history line." })
    ] }),
    hasWL && /* @__PURE__ */ jsxs("div", { className: "card p-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm text-slate-400 uppercase tracking-wide mb-4", children: "Win / loss by weapon" }),
      /* @__PURE__ */ jsx(ResponsiveContainer, { width: "100%", height: 200, children: /* @__PURE__ */ jsxs(BarChart, { data: wlByWeapon, barGap: 4, children: [
        /* @__PURE__ */ jsx(CartesianGrid, { strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.06)" }),
        /* @__PURE__ */ jsx(XAxis, { dataKey: "weapon", tick: { fill: "#94a3b8", fontSize: 11 }, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(YAxis, { tick: { fill: "#94a3b8", fontSize: 10 }, tickLine: false, axisLine: false }),
        /* @__PURE__ */ jsx(Tooltip, { content: /* @__PURE__ */ jsx(CustomTooltip, {}) }),
        /* @__PURE__ */ jsx(Legend, { wrapperStyle: { fontSize: "11px", color: "#94a3b8" } }),
        /* @__PURE__ */ jsx(Bar, { dataKey: "wins", name: "Wins", fill: "#22c55e", radius: [4, 4, 0, 0] }),
        /* @__PURE__ */ jsx(Bar, { dataKey: "losses", name: "Losses", fill: "#ef4444", radius: [4, 4, 0, 0] })
      ] }) })
    ] })
  ] });
}

const $$Astro = createAstro();
const prerender = false;
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  let profile = null;
  try {
    profile = await getMemberProfile(id);
  } catch {
  }
  if (!profile) return Astro2.redirect("/fencer");
  const sortedByTime = profile.pointEntries.slice().sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const strandMap = /* @__PURE__ */ new Map();
  for (const e of sortedByTime) {
    const season = e.season ?? "\u2014";
    const weapon = e.weapon ?? "\u2014";
    const category = e.category ?? "\u2014";
    const key = `${season}|${weapon}|${category}`;
    if (!strandMap.has(key)) {
      strandMap.set(key, { label: `${weapon} \xB7 ${category} \xB7 ${season}`, rows: [] });
    }
    strandMap.get(key).rows.push(e);
  }
  const pointsStrands = [...strandMap.entries()].map(([key, { label, rows }]) => {
    let cum = 0;
    const points = rows.map((entry, i) => {
      cum += entry.points ?? 0;
      return {
        n: i + 1,
        name: entry.eventName?.slice(0, 22) ?? `T${i + 1}`,
        points: entry.points ?? 0,
        cumulative: cum
      };
    });
    return { key, label, points };
  }).filter((s) => s.points.length > 0);
  const pointTotalsByStrand = [...strandMap.entries()].map(([key, { label, rows }]) => {
    const [season, weapon, category] = key.split("|");
    const totalPoints = rows.reduce((sum, r) => sum + (r.points ?? 0), 0);
    return {
      key,
      label,
      season,
      weapon,
      category,
      tournaments: rows.length,
      totalPoints
    };
  }).sort((a, b) => {
    if (a.season !== b.season) return String(b.season).localeCompare(String(a.season));
    if (a.weapon !== b.weapon) return String(a.weapon).localeCompare(String(b.weapon));
    return String(a.category).localeCompare(String(b.category));
  });
  const eloHistoryStrands = profile.eloRatings.map((r) => ({
    key: r.id,
    label: `${r.weapon} \xB7 ${r.category || "\u2014"} \xB7 ${r.season || "\u2014"}`,
    history: r.history.slice().map((h, i) => ({
      name: `M${i + 1}`,
      rating: h.ratingAfter
    }))
  })).filter((s) => s.history.length > 0);
  const chartData = {
    pointsStrands,
    eloHistoryStrands,
    wlByWeapon: profile.wlByWeapon ?? []
  };
  const wins = profile.stats.wins;
  const losses = profile.stats.losses;
  const totalMatches = profile.stats.totalMatches;
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": profile.fullName }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-2 flex flex-wrap gap-3 items-center justify-between"> <a href="/fencer" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Search</a> <a href="/h2h" class="text-sm text-primary hover:text-primary/80 transition-colors">Head-to-head →</a> </div>  <div class="card p-6 mb-6 flex items-start gap-5 flex-wrap"> <div class="w-16 h-16 rounded-2xl bg-secondary text-secondary-foreground border border-border flex items-center justify-center font-bold text-2xl shrink-0"> ${profile.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")} </div> <div class="flex-1 min-w-0"> <h1 class="text-2xl font-bold tracking-tight text-foreground">${profile.fullName}</h1> <div class="text-muted-foreground text-sm mt-0.5">${profile.club ?? "No club listed"}</div> <div class="flex flex-wrap gap-2 mt-2"> ${profile.sex && renderTemplate`<span class="badge bg-secondary text-secondary-foreground border border-border">${profile.sex === "M" ? "Male" : profile.sex === "F" ? "Female" : profile.sex}</span>`} ${profile.country && renderTemplate`<span class="badge bg-secondary text-secondary-foreground border border-border">${profile.country}</span>`} ${profile.province && renderTemplate`<span class="badge bg-secondary text-secondary-foreground border border-border">${profile.province}</span>`} ${profile.cffLicence && renderTemplate`<span class="badge bg-primary/10 text-primary border border-primary/20">CFF: ${profile.cffLicence}</span>`} </div> </div> <!-- Quick stats: decided bouts only (matches win/loss by weapon totals) --> <div class="flex gap-6 text-center"> <div> <div class="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">${wins}</div> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Wins</div> </div> <div> <div class="text-2xl font-bold tabular-nums text-red-600 dark:text-red-400">${losses}</div> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Losses</div> </div> <div> <div class="text-2xl font-bold tabular-nums text-foreground">${totalMatches > 0 ? (wins / totalMatches * 100).toFixed(1) : 0}%</div> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Win rate</div> </div> </div> </div> <p class="text-xs text-muted-foreground mb-4 -mt-2">
Record uses bouts with a recorded winner (${totalMatches} total). Weapon breakdown includes pool and elimination matches once event data is linked.
</p>  ${profile.eloRatings.length > 0 && renderTemplate`<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6"> ${profile.eloRatings.map((r) => {
    const tier = eloTier(r.rating);
    return renderTemplate`<div class="card p-4 text-center hover:shadow-md transition-shadow"> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">${r.weapon} ELO</div> <div class="text-[11px] text-muted-foreground mb-1">${r.category || "\u2014"} · ${r.season || "\u2014"}</div> <div${addAttribute("text-3xl font-bold tabular-nums " + tier.color, "class")}>${r.rating}</div> <div${addAttribute("text-sm font-semibold mt-0.5 " + tier.color, "class")}>${tier.label}</div> <div class="text-xs text-muted-foreground mt-2">${r.gamesPlayed} games · Peak ${r.peakRating}</div> </div>`;
  })} </div>`} ${renderComponent($$result2, "FencerCharts", FencerCharts, { "data": chartData, "client:load": true, "client:component-hydration": "load", "client:component-path": "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/components/FencerCharts", "client:component-export": "default" })}  <div class="card overflow-hidden mb-6"> <div class="px-5 py-4 border-b border-border"> <h2 class="font-semibold text-lg text-foreground">Tournament Results</h2> </div> <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b border-border bg-muted/50"> <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Tournament</th> <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Event</th> <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Place</th> </tr> </thead> <tbody class="divide-y divide-border"> ${profile.tournamentResults.length === 0 ? renderTemplate`<tr> <td colspan="3" class="px-4 py-8 text-center text-muted-foreground">No tournament results recorded</td> </tr>` : profile.tournamentResults.map((r) => renderTemplate`<tr class="table-row-hover"> <td class="px-4 py-3"> <a${addAttribute("/tournaments/" + r.tournament.id, "href")} class="hover:text-primary transition-colors font-medium text-foreground"> ${r.tournament.name} </a> <div class="text-xs text-muted-foreground mt-0.5">${r.tournament.season ?? ""}</div> </td> <td class="px-4 py-3 text-muted-foreground text-xs hidden md:table-cell"> ${r.event?.name ?? "\u2014"} </td> <td class="px-4 py-3 text-right"> <span${addAttribute("font-bold tabular-nums " + (r.place === 1 ? "text-yellow-500 dark:text-yellow-400" : r.place === 2 ? "text-slate-400" : r.place === 3 ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground"), "class")}> ${r.place <= 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][r.place - 1] : "#" + r.place} </span> </td> </tr>`)} </tbody> </table> </div> </div>  <div class="card overflow-hidden"> <div class="px-5 py-4 border-b border-border"> <h2 class="font-semibold text-lg text-foreground">Point history</h2> <p class="text-xs text-muted-foreground mt-1">Points are tracked per season, weapon, and category — there is no single combined total.</p> </div> ${pointTotalsByStrand.length > 0 && renderTemplate`<div class="px-5 py-4 border-b border-border bg-muted/30"> <div class="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
Totals by season · weapon · category
</div> <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b border-border"> <th class="py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Season</th> <th class="py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Weapon</th> <th class="py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Category</th> <th class="py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Tournaments</th> <th class="py-2 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Total points</th> </tr> </thead> <tbody class="divide-y divide-border"> ${pointTotalsByStrand.map((row) => renderTemplate`<tr> <td class="py-2 pr-4 text-foreground">${row.season ?? "\u2014"}</td> <td class="py-2 pr-4 text-foreground">${row.weapon ?? "\u2014"}</td> <td class="py-2 pr-4 text-muted-foreground hidden sm:table-cell">${row.category ?? "\u2014"}</td> <td class="py-2 pl-4 text-right text-muted-foreground hidden md:table-cell tabular-nums">${row.tournaments}</td> <td class="py-2 pl-4 text-right font-mono font-semibold text-foreground tabular-nums">${formatPoints(row.totalPoints)}</td> </tr>`)} </tbody> </table> </div> </div>`} <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b border-border bg-muted/50"> <th class="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">Event</th> <th class="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Season</th> <th class="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Weapon</th> <th class="px-4 py-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Category</th> <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide hidden md:table-cell">Place</th> <th class="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wide">Points</th> </tr> </thead> <tbody class="divide-y divide-border"> ${profile.pointEntries.slice(0, 40).map((e) => renderTemplate`<tr class="table-row-hover"> <td class="px-4 py-2.5 max-w-[200px] truncate text-foreground">${e.eventName}</td> <td class="px-4 py-2.5 text-center text-muted-foreground hidden sm:table-cell">${e.season ?? "\u2014"}</td> <td class="px-4 py-2.5 text-center text-muted-foreground hidden lg:table-cell">${e.weapon ?? "\u2014"}</td> <td class="px-4 py-2.5 text-center text-muted-foreground hidden lg:table-cell">${e.category ?? "\u2014"}</td> <td class="px-4 py-2.5 text-right text-muted-foreground hidden md:table-cell tabular-nums">${e.place ?? "\u2014"}</td> <td class="px-4 py-2.5 text-right font-mono font-semibold text-foreground tabular-nums">+${formatPoints(e.points ?? 0)}</td> </tr>`)} </tbody> </table> </div> </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/fencer/[id].astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/fencer/[id].astro";
const $$url = "/fencer/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  prerender,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
