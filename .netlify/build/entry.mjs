import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_Db1QjP0D.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/search.astro.mjs');
const _page2 = () => import('./pages/clubs.astro.mjs');
const _page3 = () => import('./pages/elo.astro.mjs');
const _page4 = () => import('./pages/fencer/_id_.astro.mjs');
const _page5 = () => import('./pages/fencer.astro.mjs');
const _page6 = () => import('./pages/h2h.astro.mjs');
const _page7 = () => import('./pages/rankings.astro.mjs');
const _page8 = () => import('./pages/tournaments/_id_.astro.mjs');
const _page9 = () => import('./pages/tournaments.astro.mjs');
const _page10 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/search.ts", _page1],
    ["src/pages/clubs.astro", _page2],
    ["src/pages/elo.astro", _page3],
    ["src/pages/fencer/[id].astro", _page4],
    ["src/pages/fencer.astro", _page5],
    ["src/pages/h2h.astro", _page6],
    ["src/pages/rankings.astro", _page7],
    ["src/pages/tournaments/[id].astro", _page8],
    ["src/pages/tournaments.astro", _page9],
    ["src/pages/index.astro", _page10]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "62a8b1e0-2453-4ebc-ace7-c2d95cf7afef"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (_start in serverEntrypointModule) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
