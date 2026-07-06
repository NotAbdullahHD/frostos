# FrostOS

Pixel/Minecraft-themed arctic hub with movies, a mini web browser, and
settings — powered by [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)
so browsing works from inside the app.

---

## Requirements

Ultraviolet uses a Service Worker, so the site MUST be served over:

- **HTTPS**, OR
- **`localhost` / `127.0.0.1`** for local testing.

Opening `index.html` directly with a `file://` URL will not work.

---

## Deploy the static frontend

Any static host works: **GitHub Pages, Cloudflare Pages, Netlify, Vercel**.

The bundle must be served from the site root so that `/sw.js`, `/uv/…`,
and `/service/…` resolve. Just upload every file in this repo as-is.

Local dev:

```bash
npx serve .
# then open http://localhost:3000
```

---

## Backend: Bare server

Ultraviolet is a client-side proxy — the actual HTTP fetching happens on
a small backend called a **Bare server**. FrostOS ships with a list of
known public Bare servers, and Settings → Proxy has:

- **Health check** — pings every server, shows latency + status.
- **Pick best** — auto-selects the fastest live server.
- **Custom (BYOB)** — paste your own Bare server URL.

Public servers come and go. For a reliable experience, run your own.

### Option A — Cloudflare Workers (recommended, free)

Deploy [`@tomphttp/bare-server-cloudflare`](https://www.npmjs.com/package/@tomphttp/bare-server-cloudflare):

```bash
npm create cloudflare@latest frostos-bare -- \
  --type=hello-world --ts=false --git=false --deploy=false
cd frostos-bare
npm install @tomphttp/bare-server-cloudflare
```

Replace `src/index.js` with:

```js
import { createBareServer } from '@tomphttp/bare-server-cloudflare';
const bare = createBareServer('/');
export default {
  fetch(request, env, ctx) {
    if (bare.shouldRoute(request)) return bare.routeRequest(request);
    return new Response('FrostOS bare server', { status: 200 });
  },
};
```

Then:

```bash
npx wrangler deploy
```

Wrangler prints a URL like `https://frostos-bare.yourname.workers.dev`.
Open FrostOS → Settings → Proxy → **Custom (BYOB)** and paste it
(trailing slash required: `https://frostos-bare.yourname.workers.dev/`).

### Option B — Node.js host (Render, Railway, Fly, VPS)

```bash
npm install @tomphttp/bare-server-node
```

```js
import http from 'node:http';
import { createBareServer } from '@tomphttp/bare-server-node';
const bare = createBareServer('/');
http.createServer((req, res) => {
  if (bare.shouldRoute(req)) return bare.routeRequest(req, res);
  res.writeHead(200); res.end('FrostOS bare server');
}).listen(process.env.PORT || 8080);
```

Deploy, then paste the HTTPS URL into Settings → Proxy → Custom (BYOB).

---

## How the pieces fit

```
Page (script.js) ──▶ /sw.js?bare=<url>            (registration)
Iframe /service/<enc>  ──▶ Service Worker /sw.js
                          └▶ UVServiceWorker
                                └▶ fetch → <Bare server> → real site
```

The service worker can't read `localStorage`, so the chosen Bare URL is
passed to it via `?bare=` on registration; changing the proxy in
Settings unregisters the old worker and registers a new one.

---

## Files

```
index.html         UI
style.css          Pixel/Minecraft theme
script.js          App logic, boot, proxy health checks
sw.js              Root service worker (routes /service/* to UV)
penguin.svg        Pixel penguin
uv/                Ultraviolet runtime (bundle/handler/client/sw/config)
README.md          This file
```
