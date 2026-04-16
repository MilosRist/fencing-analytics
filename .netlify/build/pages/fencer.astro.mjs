/* empty css                                 */
import { f as createComponent, j as renderComponent, r as renderTemplate, i as createAstro, m as maybeRenderHead, h as addAttribute } from '../chunks/astro/server_CEQMrMy_.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_D1AG8OrP.mjs';
import { s as searchMembers } from '../chunks/queries_B5_YOMHP.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Fencer = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Fencer;
  const url = Astro2.url;
  const q = url.searchParams.get("q") ?? "";
  let results = [];
  if (q.length >= 2) {
    try {
      results = await searchMembers(q, 30);
    } catch {
    }
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Fencer Search" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<div class="mb-8"> <h1 class="text-3xl font-extrabold mb-1">Fencer Search</h1> <p class="text-slate-400">Find any registered fencer to view their profile and stats</p> </div> <form method="get" class="mb-8"> <div class="flex gap-3"> <input type="text" name="q"${addAttribute(q, "value")} placeholder="Search by name or CFF licence..." class="input text-base" autofocus> <button type="submit" class="btn-primary px-6">Search</button> </div> </form> ${q.length > 0 && q.length < 2 && renderTemplate`<div class="text-slate-500 text-sm">Please enter at least 2 characters.</div>`}${q.length >= 2 && results.length === 0 && renderTemplate`<div class="card p-12 text-center"> <div class="text-4xl mb-3">🔍</div> <div class="font-semibold mb-1">No fencers found</div> <div class="text-slate-500 text-sm">Try a different name or check the spelling</div> </div>`}${results.length > 0 && renderTemplate`<div> <div class="text-xs text-slate-500 uppercase tracking-wide mb-3">${results.length} result${results.length !== 1 ? "s" : ""} for "${q}"</div> <div class="grid sm:grid-cols-2 md:grid-cols-3 gap-3"> ${results.map((member) => renderTemplate`<a${addAttribute(`/fencer/${member.id}`, "href")} class="card p-4 hover:bg-white/10 transition-all group"> <div class="flex items-center gap-3"> <div class="w-10 h-10 rounded-full bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-300 text-sm shrink-0"> ${member.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("")} </div> <div class="min-w-0"> <div class="font-semibold group-hover:text-brand-300 transition-colors truncate">${member.fullName}</div> <div class="text-xs text-slate-500 truncate">${member.club ?? "No club"}</div> </div> </div> </a>`)} </div> </div>`}${!q && renderTemplate`<div class="card p-10 text-center text-slate-500"> <div class="text-5xl mb-4">⚔️</div> <p class="text-base">Start typing to search for a fencer</p> </div>`}` })}`;
}, "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/fencer.astro", void 0);

const $$file = "C:/Users/Milos/Documents/GitHub/fencing-analytics/fencing-analytics/src/pages/fencer.astro";
const $$url = "/fencer";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Fencer,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
