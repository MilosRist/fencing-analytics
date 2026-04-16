/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { e as getRankings, a as getFilterOptions } from '../chunks/queries_B5_YOMHP.mjs';
import { f as formatPoints } from '../chunks/format_DsPesR42.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Rankings = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Rankings;
  const url = Astro2.url;
  const season = url.searchParams.get("season") ?? "";
  const weapon = url.searchParams.get("weapon") ?? "";
  const sex = url.searchParams.get("sex") ?? "";
  const category = url.searchParams.get("category") ?? "";
  parseInt(url.searchParams.get("page") ?? "1");
  const limit = 50;
  let rankings = [];
  let filterOpts = { seasons: [], weapons: [], categories: [] };
  try {
    [rankings, filterOpts] = await Promise.all([
      getRankings({ season: season || void 0, weapon: weapon || void 0, sex: sex || void 0, category: category || void 0, limit }),
      getFilterOptions()
    ]);
  } catch {
  }
  const SEX_OPTIONS = ["Men", "Women", "Mixed", "Wheelchair"];
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Rankings" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-bold tracking-tight text-foreground mb-1">Rankings</h1> <p class="text-muted-foreground">Cumulative points across all tournaments</p> </div>  <form method="get" class="card p-4 mb-6 flex flex-wrap gap-3 items-end"> <div class="flex-1 min-w-[140px]"> <label class="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Season</label> <select name="season" class="select"> <option value="">All Seasons</option> ${filterOpts.seasons.map((s) => renderTemplate`<option${addAttribute(s, "value")}${addAttribute(s === season, "selected")}>${s}</option>`)} </select> </div> <div class="flex-1 min-w-[130px]"> <label class="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Weapon</label> <select name="weapon" class="select"> <option value="">All Weapons</option> ${filterOpts.weapons.map((w) => renderTemplate`<option${addAttribute(w, "value")}${addAttribute(w === weapon, "selected")}>${w}</option>`)} </select> </div> <div class="flex-1 min-w-[130px]"> <label class="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Sex</label> <select name="sex" class="select"> <option value="">All</option> ${SEX_OPTIONS.map((s) => renderTemplate`<option${addAttribute(s, "value")}${addAttribute(s === sex, "selected")}>${s}</option>`)} </select> </div> <div class="flex-1 min-w-[140px]"> <label class="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Category</label> <select name="category" class="select"> <option value="">All Categories</option> ${filterOpts.categories.map((c) => renderTemplate`<option${addAttribute(c, "value")}${addAttribute(c === category, "selected")}>${c}</option>`)} </select> </div> <button type="submit" class="btn-primary shrink-0">Apply</button> <a href="/rankings" class="btn-secondary shrink-0">Reset</a> </form>  <div class="card overflow-hidden"> <div class="overflow-x-auto"> <table class="w-full text-sm"> <thead> <tr class="border-b border-border bg-muted/50"> <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide w-12">#</th> <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fencer</th> <th class="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Club</th> <th class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Tournaments</th> <th class="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide">Points</th> </tr> </thead> <tbody class="divide-y divide-border"> <!-- Replace the existing empty state td --> ${rankings.length === 0 ? renderTemplate`<tr> <td colspan="5" class="px-4 py-12 text-center text-slate-500"> ${!weapon && !category ? "Select a weapon or category to view rankings." : "No results found for the selected filters."} </td> </tr>` : rankings.map((r) => renderTemplate`<tr class="table-row-hover"> <td class="px-4 py-3">  <span${addAttribute("font-bold tabular-nums text-sm " + (r.rank === 1 ? "text-yellow-500 dark:text-yellow-400" : r.rank === 2 ? "text-slate-400" : r.rank === 3 ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground"), "class")}>  ${r.rank <= 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][r.rank - 1] : "#" + r.rank} </span> </td> <td class="px-4 py-3"> <a${addAttribute("/fencer/" + r.member?.id, "href")} class="font-semibold hover:text-primary transition-colors text-foreground"> ${r.member?.fullName ?? "\u2014"} </a> </td> <td class="px-4 py-3 text-muted-foreground hidden sm:table-cell text-xs">${r.member?.club ?? "\u2014"}</td> <td class="px-4 py-3 text-right text-muted-foreground hidden md:table-cell tabular-nums">${r.tournaments}</td> <td class="px-4 py-3 text-right font-mono font-bold text-foreground tabular-nums"> ${formatPoints(r.totalPoints ?? 0)} </td> </tr>`)} </tbody> </table> </div> </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/rankings.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/rankings.astro";
const $$url = "/rankings";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Rankings,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
