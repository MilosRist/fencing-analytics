/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { b as getEloLeaderboard, a as getFilterOptions } from '../chunks/queries_B5_YOMHP.mjs';
import { e as eloTier } from '../chunks/elo_CChpJCox.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Elo = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Elo;
  const url = Astro2.url;
  const weapon = url.searchParams.get("weapon") ?? "";
  const season = url.searchParams.get("season") ?? "";
  const category = url.searchParams.get("category") ?? "";
  const WEAPONS = ["Epee", "Foil", "Saber"];
  let leaderboard = [];
  let filterOpts = { seasons: [], weapons: [], categories: [] };
  try {
    [leaderboard, filterOpts] = await Promise.all([
      getEloLeaderboard({
        weapon: weapon || void 0,
        season: season || void 0,
        category: category || void 0,
        limit: 1e3
      }),
      getFilterOptions()
    ]);
  } catch {
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "ELO Ratings" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-extrabold mb-1">ELO Ratings</h1> <p class="text-slate-400">Separate ratings per weapon, category, and season · Base rating: 1200</p> </div>  <form method="get" class="card p-4 mb-6 flex flex-wrap gap-3 items-end"> <div class="flex gap-2 flex-wrap"> <a href="/elo"${addAttribute(`btn-${!weapon && !season && !category ? "primary" : "secondary"}`, "class")}>All</a> ${WEAPONS.map((w) => renderTemplate`<a${addAttribute("/elo?weapon=" + encodeURIComponent(w) + (season ? "&season=" + encodeURIComponent(season) : "") + (category ? "&category=" + encodeURIComponent(category) : ""), "href")}${addAttribute(`btn-${weapon === w ? "primary" : "secondary"}`, "class")}>${w}</a>`)} </div> <div class="min-w-[120px]"> <label class="block text-xs text-slate-500 mb-1 uppercase tracking-wide">Season</label> <select name="season" class="input text-sm py-2"> <option value="">Any</option> ${filterOpts.seasons.map((s) => renderTemplate`<option${addAttribute(s, "value")}${addAttribute(s === season, "selected")}>${s}</option>`)} </select> </div> <div class="min-w-[120px]"> <label class="block text-xs text-slate-500 mb-1 uppercase tracking-wide">Category</label> <select name="category" class="input text-sm py-2"> <option value="">Any</option> ${filterOpts.categories.map((c) => renderTemplate`<option${addAttribute(c, "value")}${addAttribute(c === category, "selected")}>${c}</option>`)} </select> </div> ${weapon && renderTemplate`<input type="hidden" name="weapon"${addAttribute(weapon, "value")}>`} <button type="submit" class="btn-primary shrink-0">Apply</button> </form>  <div class="card p-4 mb-6 flex flex-wrap gap-3"> <span class="text-xs text-slate-500 uppercase tracking-wide self-center mr-2">Tiers:</span> ${[
    { label: "Master", color: "text-yellow-400", min: "2000+" },
    { label: "Diamond", color: "text-cyan-400", min: "1800" },
    { label: "Platinum", color: "text-purple-400", min: "1600" },
    { label: "Gold", color: "text-amber-400", min: "1400" },
    { label: "Silver", color: "text-slate-300", min: "1200" },
    { label: "Bronze", color: "text-orange-600", min: "<1200" }
  ].map((t) => renderTemplate`<span${addAttribute(`text-xs font-semibold ${t.color}`, "class")}>${t.label} (${t.min})</span>`)} </div> <div class="card overflow-hidden"> <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b border-white/10 bg-white/5"> <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide w-12">#</th> <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Fencer</th> <th class="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide hidden sm:table-cell">Club</th> <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide hidden md:table-cell">Weapon</th> <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Category</th> <th class="px-4 py-3 text-center text-xs font-semibold text-slate-400 uppercase tracking-wide hidden lg:table-cell">Season</th> <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">W / L</th> <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Peak</th> <th class="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wide">Rating</th> </tr> </thead> <tbody class="divide-y divide-white/5"> ${leaderboard.length === 0 ? renderTemplate`<tr> <td colspan="9" class="px-4 py-12 text-center text-slate-500">
ELO ratings will appear after importing match data and running the ELO computation.
</td> </tr>` : leaderboard.map((entry) => {
    const tier = eloTier(entry.rating);
    return renderTemplate`<tr class="table-row-hover"> <td class="px-4 py-3 font-bold tabular-nums text-slate-400">#${entry.rank}</td> <td class="px-4 py-3"> <a${addAttribute(`/fencer/${entry.member.id}`, "href")} class="font-semibold hover:text-brand-300 transition-colors"> ${entry.member.fullName} </a> </td> <td class="px-4 py-3 text-slate-400 text-xs hidden sm:table-cell">${entry.member.club ?? "\u2014"}</td> <td class="px-4 py-3 text-center hidden md:table-cell"> <span class="badge bg-white/10 text-slate-300">${entry.weapon}</span> </td> <td class="px-4 py-3 text-center text-slate-400 text-xs hidden lg:table-cell">${entry.category || "\u2014"}</td> <td class="px-4 py-3 text-center text-slate-400 text-xs hidden lg:table-cell">${entry.season || "\u2014"}</td> <td class="px-4 py-3 text-right tabular-nums text-xs text-slate-400"> <span class="text-green-400">${entry.wins}W</span> / <span class="text-red-400">${entry.losses}L</span> </td> <td class="px-4 py-3 text-right tabular-nums text-slate-500 text-xs">${entry.peakRating}</td> <td class="px-4 py-3 text-right"> <span${addAttribute(`font-mono font-bold tabular-nums ${tier.color}`, "class")}>${entry.rating}</span> <div${addAttribute(`text-xs ${tier.color} opacity-70`, "class")}>${tier.label}</div> </td> </tr>`;
  })} </tbody> </table> </div> </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/elo.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/elo.astro";
const $$url = "/elo";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Elo,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
