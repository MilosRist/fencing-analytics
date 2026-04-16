/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { g as getClubRankings, a as getFilterOptions } from '../chunks/queries_B5_YOMHP.mjs';
import { f as formatPoints } from '../chunks/format_DsPesR42.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Clubs = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Clubs;
  const url = Astro2.url;
  const season = url.searchParams.get("season") ?? "";
  const weapon = url.searchParams.get("weapon") ?? "";
  let clubs = [];
  let filterOpts = { seasons: [], weapons: [], categories: [] };
  try {
    [clubs, filterOpts] = await Promise.all([
      getClubRankings({ season: season || void 0, weapon: weapon || void 0 }),
      getFilterOptions()
    ]);
  } catch {
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Club Rankings" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-bold tracking-tight text-foreground mb-1">Club Rankings</h1> <p class="text-muted-foreground">Aggregate points earned by members across tournaments</p> </div> <form method="get" class="card p-4 mb-6 flex flex-wrap gap-3 items-end"> <div class="flex-1 min-w-[140px]"> <label class="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Season</label> <select name="season" class="select"> <option value="">All Seasons</option> ${filterOpts.seasons.map((s) => renderTemplate`<option${addAttribute(s, "value")}${addAttribute(s === season, "selected")}>${s}</option>`)} </select> </div> <div class="flex-1 min-w-[130px]"> <label class="block text-xs text-muted-foreground mb-1.5 uppercase tracking-wide font-medium">Weapon</label> <select name="weapon" class="select"> <option value="">All Weapons</option> ${filterOpts.weapons.map((w) => renderTemplate`<option${addAttribute(w, "value")}${addAttribute(w === weapon, "selected")}>${w}</option>`)} </select> </div> <button type="submit" class="btn-primary shrink-0">Apply</button> <a href="/clubs" class="btn-secondary shrink-0">Reset</a> </form> <div class="grid gap-4"> ${clubs.length === 0 ? renderTemplate`<div class="card p-12 text-center text-muted-foreground border border-dashed border-border">
No club data available yet.
</div>` : clubs.map((club) => {
    const pct = clubs[0]?.totalPoints > 0 ? club.totalPoints / clubs[0].totalPoints * 100 : 0;
    return renderTemplate`<div class="card p-5 hover:shadow-md transition-shadow"> <div class="flex items-center gap-4">  <div${addAttribute("text-2xl font-bold tabular-nums w-10 shrink-0 " + (club.rank === 1 ? "text-yellow-500 dark:text-yellow-400" : club.rank === 2 ? "text-slate-400" : club.rank === 3 ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground"), "class")}>  ${club.rank <= 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][club.rank - 1] : "#" + club.rank} </div> <div class="flex-1 min-w-0"> <div class="font-semibold text-base text-foreground truncate">${club.club}</div> <div class="text-xs text-muted-foreground mt-0.5">${club.memberCount} competing members</div> <div class="mt-2.5 h-1.5 rounded-full bg-secondary overflow-hidden">  <div class="h-full rounded-full bg-primary transition-all"${addAttribute("width: " + pct + "%", "style")}></div> </div> </div> <div class="text-right shrink-0"> <div class="font-mono font-bold text-xl text-foreground tabular-nums">${formatPoints(club.totalPoints)}</div> <div class="text-xs text-muted-foreground mt-0.5">points</div> </div> </div> </div>`;
  })} </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/clubs.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/clubs.astro";
const $$url = "/clubs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Clubs,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
