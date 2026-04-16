/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, m as maybeRenderHead, k as Fragment, u as unescapeHTML, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { p as prisma } from '../chunks/prisma_D3fH1VVB.mjs';
import { f as formatPoints } from '../chunks/format_DsPesR42.mjs';
export { renderers } from '../renderers.mjs';

const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  let stats = { members: 0, tournaments: 0, bouts: 0, events: 0 };
  let topFencers = [];
  let recentTournaments = [];
  try {
    const [members, tournaments, bouts, events] = await Promise.all([
      // Roster rows from membership import always have cffLicence set (real CFF or __nocff__* placeholder).
      // Tournament-only name stubs have null licence and are excluded from this count.
      prisma.member.count({ where: { cffLicence: { not: null } } }),
      prisma.tournament.count(),
      prisma.match.count(),
      prisma.event.count()
    ]);
    stats = { members, tournaments, bouts, events };
    topFencers = await prisma.pointEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        member: { select: { id: true, fullName: true, club: true } },
        tournament: { select: { name: true } }
      }
    }).then(
      (rows) => rows.map((r, i) => ({
        rank: i + 1,
        member: r.member,
        points: r.points,
        eventName: r.eventName,
        season: r.season,
        weapon: r.weapon,
        category: r.category,
        tournamentName: r.tournament?.name ?? ""
      }))
    );
    recentTournaments = await prisma.tournament.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: 5,
      include: { _count: { select: { tournamentResults: true, events: true } } }
    });
  } catch (e) {
  }
  const Icons = {
    users: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    trophy: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>`,
    swords: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><line x1="13" x2="19" y1="19" y2="13"/><line x1="16" x2="20" y1="16" y2="20"/><line x1="19" x2="21" y1="21" y2="19"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><line x1="5" x2="9" y1="14" y2="18"/><line x1="7" x2="4" y1="17" y2="20"/><line x1="3" x2="5" y1="19" y2="21"/></svg>`,
    clipboard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>`,
    search: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>`,
    trending: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
    medal: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
    chevron: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`
  };
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Dashboard" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="flex flex-col gap-6 md:gap-8"> <!-- Header --> <div class="flex flex-col gap-1"> <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
Dashboard
</h1> <p class="terminal-label">
$ afa-analytics · Alberta Fencing Association · Tournament Intelligence Platform
</p> <div class="piste-line mt-2 max-w-xs"></div> </div> <!-- Stats Grid --> <div class="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4"> ${[
    { title: "Registered Members", value: stats.members.toLocaleString(), sub: "membership roster (excl. name-only stubs)", icon: Icons.users },
    { title: "Tournaments", value: stats.tournaments.toLocaleString(), sub: "across all seasons", icon: Icons.trophy },
    { title: "Bouts Recorded", value: stats.bouts.toLocaleString(), sub: "pool + elim matches", icon: Icons.swords },
    { title: "Events Tracked", value: stats.events.toLocaleString(), sub: "weapon \xD7 category", icon: Icons.clipboard }
  ].map((stat) => renderTemplate`<div class="stat-card group hover:shadow-sm hover:border-primary/30 transition-all duration-200"> <div class="flex items-center justify-between"> <span class="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest"> ${stat.title} </span> <div class="p-1.5 rounded-lg bg-primary/8 text-primary group-hover:bg-primary/15 transition-colors"> ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(stat.icon)}` })} </div> </div> <div class="piste-line"></div> <div class="text-xl sm:text-2xl font-bold text-foreground tabular-nums tracking-tight mt-0.5"> ${stat.value} </div> <p class="terminal-label">${stat.sub}</p> </div>`)} </div> <!-- Quick Nav Cards --> <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"> ${[
    { href: "/fencer", title: "Fencer Search", desc: "Profiles, ELO history & head-to-head stats", icon: Icons.search },
    { href: "/elo", title: "ELO Leaderboard", desc: "Live ratings from every recorded bout", icon: Icons.trending },
    { href: "/clubs", title: "Club Rankings", desc: "Points table standings by club", icon: Icons.medal }
  ].map((card) => renderTemplate`<a${addAttribute(card.href, "href")} class="group card flex items-start gap-4 p-5 hover:shadow-sm hover:border-primary/40 transition-all duration-200"> <div class="p-2.5 rounded-xl bg-primary/8 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200 flex-shrink-0 mt-0.5"> ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(card.icon)}` })} </div> <div class="flex-1 min-w-0"> <div class="flex items-center justify-between"> <h2 class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors"> ${card.title} </h2> <span class="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity -translate-x-1 group-hover:translate-x-0 duration-150"> ${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(Icons.chevron)}` })} </span> </div> <p class="text-xs text-muted-foreground mt-1 leading-relaxed"> ${card.desc} </p> </div> </a>`)} </div> <!-- Tables --> <div class="grid gap-4 md:grid-cols-2"> <!-- Recent point results (single event — not a combined total) --> <div class="card overflow-hidden"> <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border"> <div> <h2 class="font-semibold text-sm text-foreground">Recent point results</h2> <p class="terminal-label mt-0.5">per event · season / weapon / category</p> </div> <a href="/rankings" class="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
Rankings
${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(Icons.chevron)}` })} </a> </div> ${topFencers.length === 0 ? renderTemplate`<div class="m-4 p-5 text-muted-foreground text-sm text-center border border-dashed border-border rounded-xl">
No data yet — run <code class="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">npm run db:import</code> </div>` : renderTemplate`<table class="w-full text-sm"> <thead> <tr class="border-b border-border"> <th class="px-5 py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Fencer</th> <th class="py-2.5 text-left text-[10px] font-semibold text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Discipline</th> <th class="px-5 py-2.5 text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Pts</th> </tr> </thead> <tbody> ${topFencers.map((f) => renderTemplate`<tr class="border-b last:border-0 border-border table-row-hover"> <td class="px-5 py-3"> <a${addAttribute(`/fencer/${f.member?.id}`, "href")} class="font-semibold text-foreground hover:text-primary transition-colors text-sm"> ${f.member?.fullName ?? "\u2014"} </a> <div class="terminal-label mt-0.5 truncate max-w-[200px]"> ${f.tournamentName || f.eventName || "\u2014"} </div> </td> <td class="py-3 pr-2 text-muted-foreground text-xs hidden sm:table-cell"> ${[f.weapon, f.category, f.season].filter(Boolean).join(" \xB7 ") || "\u2014"} </td> <td class="px-5 py-3 text-right font-mono font-bold text-primary text-sm tabular-nums">
+${formatPoints(f.points)} </td> </tr>`)} </tbody> </table>`} </div> <!-- Recent Tournaments --> <div class="card overflow-hidden"> <div class="flex items-center justify-between px-5 pt-5 pb-3 border-b border-border"> <div> <h2 class="font-semibold text-sm text-foreground">Recent Tournaments</h2> <p class="terminal-label mt-0.5">latest · sorted by date</p> </div> <a href="/tournaments" class="text-xs text-primary hover:text-primary/80 transition-colors font-medium flex items-center gap-1">
View all
${renderComponent($$result2, "Fragment", Fragment, {}, { "default": async ($$result3) => renderTemplate`${unescapeHTML(Icons.chevron)}` })} </a> </div> ${recentTournaments.length === 0 ? renderTemplate`<div class="m-4 p-5 text-muted-foreground text-sm text-center border border-dashed border-border rounded-xl">
No tournaments imported yet
</div>` : renderTemplate`<div class="divide-y divide-border"> ${recentTournaments.map((t) => renderTemplate`<a${addAttribute(`/tournaments/${t.id}`, "href")} class="flex items-center gap-3 px-5 py-3.5 table-row-hover group"> <div class="min-w-0 flex-1"> <div class="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate"> ${t.name} </div> <div class="terminal-label mt-0.5 flex items-center gap-1.5 flex-wrap"> <span> ${t.date ? new Date(t.date).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" }) : t.season ?? "\u2014"} </span> <span class="opacity-40">·</span> <span>${t._count.events} events</span> <span class="opacity-40">·</span> <span>${t._count.tournamentResults} results</span> </div> </div> <span${addAttribute(
    t.level >= 3 ? "badge-lv3" : t.level >= 2 ? "badge-lv2" : "badge-lv1",
    "class"
  )}>
LV ${t.level} </span> </a>`)} </div>`} </div> </div> <!-- Setup Banner (only shown when DB is empty) --> ${stats.members === 0 && renderTemplate`<div class="card-accent bg-card p-5 border-border"> <h3 class="font-semibold text-foreground mb-3 text-sm flex items-center gap-2"> <span class="terminal-label text-primary">~/afa $</span>
Getting started
</h3> <ol class="text-sm text-muted-foreground space-y-2.5 list-decimal list-inside"> <li>
Copy <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">.env.example</code> → <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">.env</code> and add your Supabase credentials.
</li> <li>
Run <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">npm run db:push</code> to create the database schema.
</li> <li>
Run <code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">npm run db:import</code> to load your Excel data.
</li> </ol> </div>`} </div> ` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/index.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
