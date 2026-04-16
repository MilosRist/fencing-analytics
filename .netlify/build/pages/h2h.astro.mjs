/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { d as getHeadToHead, f as formatRoundLabel } from '../chunks/queries_B5_YOMHP.mjs';
import { p as prisma } from '../chunks/prisma_D3fH1VVB.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$H2H = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$H2H;
  const url = Astro2.url;
  const aId = url.searchParams.get("a") ?? "";
  const bId = url.searchParams.get("b") ?? "";
  let h2h = null;
  let memberA = null;
  let memberB = null;
  if (aId && bId) {
    try {
      [memberA, memberB] = await Promise.all([
        prisma.member.findUnique({ where: { id: aId }, select: { id: true, fullName: true, club: true } }),
        prisma.member.findUnique({ where: { id: bId }, select: { id: true, fullName: true, club: true } })
      ]);
      h2h = await getHeadToHead(aId, bId);
    } catch {
    }
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Head to Head" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-extrabold mb-1">Head-to-Head</h1> <p class="text-slate-400">Every recorded bout between two fencers, with tournament context and scores</p> </div>  <div class="card p-6 mb-6"> <form method="get" class="space-y-4" id="h2h-form"> <div class="grid md:grid-cols-2 gap-4"> <div> <label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Fencer A</label> <div class="relative"> <input type="text" id="search-a" placeholder="Search fencer…" class="input" autocomplete="off"> <input type="hidden" name="a" id="val-a"${addAttribute(aId, "value")}> <div id="results-a" class="absolute top-full left-0 right-0 mt-1 z-20 hidden"></div> </div> ${memberA && renderTemplate`<div class="mt-2 text-sm text-brand-300 font-medium">${memberA.fullName}</div>`} </div> <div> <label class="block text-xs text-slate-500 mb-1.5 uppercase tracking-wide">Fencer B</label> <div class="relative"> <input type="text" id="search-b" placeholder="Search fencer…" class="input" autocomplete="off"> <input type="hidden" name="b" id="val-b"${addAttribute(bId, "value")}> <div id="results-b" class="absolute top-full left-0 right-0 mt-1 z-20 hidden"></div> </div> ${memberB && renderTemplate`<div class="mt-2 text-sm text-brand-300 font-medium">${memberB.fullName}</div>`} </div> </div> <button type="submit" class="btn-primary">Compare</button> </form> </div> ${h2h && memberA && memberB && renderTemplate`<div> <!-- Score banner (decided bouts only) --> <div class="card p-6 mb-6 flex items-center justify-around text-center gap-4"> <div class="flex-1"> <a${addAttribute(`/fencer/${memberA.id}`, "href")} class="font-extrabold text-xl hover:text-brand-300 transition-colors">${memberA.fullName}</a> <div class="text-xs text-slate-500 mt-0.5">${memberA.club ?? ""}</div> </div> <div class="flex items-center gap-4 shrink-0"> <div${addAttribute(`text-5xl font-extrabold tabular-nums ${h2h.aWins > h2h.bWins ? "text-green-400" : "text-slate-400"}`, "class")}>${h2h.aWins}</div> <div class="text-2xl text-slate-600">–</div> <div${addAttribute(`text-5xl font-extrabold tabular-nums ${h2h.bWins > h2h.aWins ? "text-green-400" : "text-slate-400"}`, "class")}>${h2h.bWins}</div> </div> <div class="flex-1"> <a${addAttribute(`/fencer/${memberB.id}`, "href")} class="font-extrabold text-xl hover:text-brand-300 transition-colors">${memberB.fullName}</a> <div class="text-xs text-slate-500 mt-0.5">${memberB.club ?? ""}</div> </div> </div> <p class="text-xs text-slate-500 mb-4 -mt-2 text-center">
Win totals count only bouts with a recorded winner (${h2h.aWins + h2h.bWins} decided of ${h2h.matches.length} listed).
</p> <!-- Match history --> <h2 class="font-bold text-lg mb-3">Match history (${h2h.matches.length} bouts)</h2> ${h2h.matches.length === 0 ? renderTemplate`<div class="card p-10 text-center text-slate-500">No head-to-head bouts on record</div>` : renderTemplate`<div class="card overflow-hidden"> <table class="w-full text-sm"> <thead> <tr class="border-b border-white/10 bg-white/5"> <th class="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wide">Date</th> <th class="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wide">Tournament</th> <th class="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wide hidden md:table-cell">Event</th> <th class="px-4 py-3 text-left text-xs text-slate-400 uppercase tracking-wide">Phase</th> <th class="px-4 py-3 text-center text-xs text-slate-400 uppercase tracking-wide">Score (A – B)</th> <th class="px-4 py-3 text-right text-xs text-slate-400 uppercase tracking-wide">Winner</th> </tr> </thead> <tbody class="divide-y divide-white/5"> ${h2h.matches.map((m) => {
    const aIsLeft = m.leftMemberId === aId;
    const aScore = aIsLeft ? m.leftScore : m.rightScore;
    const bScore = aIsLeft ? m.rightScore : m.leftScore;
    const aWon = m.winnerId === aId;
    const bWon = m.winnerId === bId;
    const winner = aWon ? memberA.fullName : bWon ? memberB.fullName : m.winnerId ? "\u2014" : "Undecided";
    const ev = m.pool?.event ?? m.event;
    const tName = ev?.tournament?.name ?? "\u2014";
    const eName = ev?.name ?? "\u2014";
    const phase = formatRoundLabel(m.round);
    const dateStr = m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : "\u2014";
    return renderTemplate`<tr class="table-row-hover"> <td class="px-4 py-3 text-slate-400 whitespace-nowrap">${dateStr}</td> <td class="px-4 py-3"> ${ev?.tournament?.id ? renderTemplate`<a${addAttribute("/tournaments/" + ev.tournament.id, "href")} class="text-brand-300 hover:underline font-medium"> ${tName} </a>` : renderTemplate`<span class="text-slate-200">${tName}</span>`} </td> <td class="px-4 py-3 text-slate-400 text-xs hidden md:table-cell max-w-[180px] truncate"${addAttribute(eName, "title")}> ${eName} </td> <td class="px-4 py-3 text-slate-300 text-xs">${phase}</td> <td class="px-4 py-3 text-center font-mono font-bold tabular-nums"> <span${addAttribute(aWon ? "text-green-400" : "text-slate-400", "class")}>${aScore != null ? String(aScore) : "\u2014"}</span> <span class="text-slate-600 mx-1">–</span> <span${addAttribute(bWon ? "text-green-400" : "text-slate-400", "class")}>${bScore != null ? String(bScore) : "\u2014"}</span> </td> <td class="px-4 py-3 text-right font-semibold text-brand-300">${winner}</td> </tr>`;
  })} </tbody> </table> </div>`} </div>`}` })} `;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/h2h.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/h2h.astro";
const $$url = "/h2h";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$H2H,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
