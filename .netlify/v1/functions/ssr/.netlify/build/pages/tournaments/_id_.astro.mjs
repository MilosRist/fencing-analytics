/* empty css                                    */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_D1AG8OrP.mjs';
import { h as getTournamentDetail } from '../../chunks/queries_B5_YOMHP.mjs';
import { p as prisma } from '../../chunks/prisma_D3fH1VVB.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
async function getStaticPaths() {
  const tournaments = await prisma.tournament.findMany({
    select: { id: true }
  });
  return tournaments.map((tournament) => ({
    params: { id: tournament.id }
  }));
}
const $$id = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$id;
  const { id } = Astro2.params;
  let tournament = null;
  try {
    tournament = await getTournamentDetail(id);
  } catch {
  }
  if (!tournament) {
    return Astro2.redirect("/tournaments");
  }
  const LEVEL_LABELS = {
    0: "Regional",
    1: "Sanctioned Regional",
    2: "AB Cup",
    3: "Provincials",
    4: "Canada Cup"
  };
  const weaponColors = {
    Epee: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/20",
    Foil: "bg-green-500/15 text-green-700 dark:text-green-400 border border-green-500/20",
    Saber: "bg-red-500/15 text-red-700 dark:text-red-400 border border-red-500/20",
    Mixed: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": tournament.name }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-2"> <a href="/tournaments" class="text-sm text-muted-foreground hover:text-foreground transition-colors">← Tournaments</a> </div> <div class="mb-8"> <div class="flex items-start gap-3 flex-wrap"> <div> <h1 class="text-3xl font-bold tracking-tight text-foreground mb-1">${tournament.name}</h1> <div class="flex items-center gap-3 text-muted-foreground text-sm flex-wrap">  <span${addAttribute("badge " + (tournament.level >= 4 ? "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20" : tournament.level >= 3 ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border border-purple-500/20" : tournament.level >= 2 ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20" : "bg-secondary text-muted-foreground border border-border"), "class")}> ${LEVEL_LABELS[tournament.level] ?? "Level " + tournament.level} </span> ${tournament.date && renderTemplate`<span>${new Date(tournament.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" })}</span>`} ${tournament.season && renderTemplate`<span>Season ${tournament.season}</span>`} </div> </div> </div> </div>  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8"> <div class="stat-card"> <div class="text-2xl font-bold tabular-nums text-foreground">${tournament.events.length}</div> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Events</div> </div> <div class="stat-card"> <div class="text-2xl font-bold tabular-nums text-foreground"> ${tournament.events.reduce((s, e) => s + e._count.tournamentResults, 0)} </div> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Competitors</div> </div> <div class="stat-card"> <div class="text-2xl font-bold tabular-nums text-foreground"> ${tournament.events.reduce((s, e) => s + e._count.pools, 0)} </div> <div class="text-xs text-muted-foreground uppercase tracking-wide font-medium">Pools</div> </div> </div>  <h2 class="font-semibold text-xl text-foreground mb-4">Events</h2> <div class="grid md:grid-cols-2 gap-4"> ${tournament.events.map((event) => renderTemplate`<div class="card p-5 hover:shadow-md transition-shadow"> <div class="flex items-center justify-between mb-3"> <div> <h3 class="font-semibold text-foreground">${event.name || event.category + " " + event.sex + "'s " + event.weapon}</h3> <div class="flex gap-2 mt-1.5">  <span${addAttribute("badge " + (weaponColors[event.weapon] ?? "bg-secondary text-muted-foreground border border-border"), "class")}>${event.weapon}</span> <span class="badge bg-secondary text-muted-foreground border border-border">${event.sex}</span> ${event.category && renderTemplate`<span class="badge bg-secondary text-muted-foreground border border-border">${event.category}</span>`} </div> </div> <div class="text-right text-sm text-muted-foreground"> <div class="font-semibold text-foreground tabular-nums">${event._count.tournamentResults}</div> <div class="text-xs">fencers</div> </div> </div> <!-- Full standings --> ${event.tournamentResults.length > 0 && renderTemplate`<div class="mt-3 pt-3 border-t border-border"> <div class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Standings</div> <div class="max-h-64 overflow-y-auto space-y-1 pr-1"> ${event.tournamentResults.map((r) => renderTemplate`<div class="flex items-center gap-2 text-sm">  <span${addAttribute("w-6 text-center font-bold " + (r.place === 1 ? "text-yellow-500 dark:text-yellow-400" : r.place === 2 ? "text-slate-400" : r.place === 3 ? "text-orange-500 dark:text-orange-400" : "text-muted-foreground"), "class")}>  ${r.place <= 3 ? ["\u{1F947}", "\u{1F948}", "\u{1F949}"][r.place - 1] : "#" + r.place} </span> <a${addAttribute("/fencer/" + r.member.id, "href")} class="hover:text-primary transition-colors flex-1 truncate text-foreground"> ${r.member.fullName} </a> <span class="text-xs text-muted-foreground truncate max-w-[120px]">${r.club ?? r.member.club ?? ""}</span> </div>`)} </div> </div>`} </div>`)} </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/tournaments/[id].astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/tournaments/[id].astro";
const $$url = "/tournaments/[id]";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$id,
  file: $$file,
  getStaticPaths,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
