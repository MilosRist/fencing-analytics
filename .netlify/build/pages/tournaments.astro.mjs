/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { i as getTournaments } from '../chunks/queries_B5_YOMHP.mjs';
export { renderers } from '../renderers.mjs';

const $$Tournaments = createComponent(async ($$result, $$props, $$slots) => {
  let tournaments = [];
  try {
    tournaments = await getTournaments();
  } catch {
  }
  const LEVEL_LABELS = {
    0: "Regional",
    1: "Sanctioned Regional",
    2: "AB Cup",
    3: "Provincials",
    4: "Canada Cup"
  };
  const LEVEL_COLORS = {
    0: "bg-slate-500/20 text-slate-400",
    1: "bg-blue-500/20 text-blue-300",
    2: "bg-indigo-500/20 text-indigo-300",
    3: "bg-purple-500/20 text-purple-300",
    4: "bg-yellow-500/20 text-yellow-300"
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Tournaments" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-extrabold mb-1">Tournaments</h1> <p class="text-slate-400">${tournaments.length} tournaments across all seasons</p> </div> <div class="grid gap-3"> ${tournaments.length === 0 ? renderTemplate`<div class="card p-12 text-center text-slate-500">No tournament data imported yet.</div>` : tournaments.map((t) => renderTemplate`<a${addAttribute(`/tournaments/${t.id}`, "href")} class="card p-5 hover:bg-white/10 transition-all group flex items-center gap-4"> <div class="flex-1 min-w-0"> <div class="flex items-center gap-2 flex-wrap"> <h2 class="font-bold group-hover:text-brand-300 transition-colors">${t.name}</h2> <span${addAttribute(`badge ${LEVEL_COLORS[t.level] ?? LEVEL_COLORS[0]}`, "class")}> ${LEVEL_LABELS[t.level] ?? `Level ${t.level}`} </span> </div> <div class="text-sm text-slate-500 mt-0.5"> ${t.date ? new Date(t.date).toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" }) : "Date TBD"} ${t.season ? ` \xB7 Season ${t.season}` : ""} </div> </div> <div class="flex gap-6 text-right shrink-0"> <div> <div class="font-bold tabular-nums">${t._count.events}</div> <div class="text-xs text-slate-500">events</div> </div> <div> <div class="font-bold tabular-nums">${t._count.tournamentResults}</div> <div class="text-xs text-slate-500">results</div> </div> </div> </a>`)} </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/tournaments.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/tournaments.astro";
const $$url = "/tournaments";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Tournaments,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
