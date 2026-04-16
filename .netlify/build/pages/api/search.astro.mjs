import { s as searchMembers } from '../../chunks/queries_B5_YOMHP.mjs';
export { renderers } from '../../renderers.mjs';

const GET = async ({ url }) => {
  const q = url.searchParams.get("q") ?? "";
  if (q.length < 2) {
    return new Response(JSON.stringify([]), { headers: { "Content-Type": "application/json" } });
  }
  try {
    const results = await searchMembers(q, 10);
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Search failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
