# FrostOS

Arctic pixel hub with movies, a mini browser, and an Ultraviolet-powered proxy.

## Files

- `index.html`, `style.css`, `script.js`, `penguin.svg` — the app
- `sw.js` — root service worker that hands off `/service/*` requests to Ultraviolet
- `uv/` — Ultraviolet client bundle (`uv.bundle.js`, `uv.handler.js`, `uv.client.js`, `uv.sw.js`, `uv.config.js`)

## Requirements

Ultraviolet needs three things to actually browse the web:

1. **HTTPS** (or `localhost`) — service workers won't register on plain `http://`.
2. **Files served from the site root.** Paths in `uv/uv.config.js` and `sw.js` start with `/`. If you host under a subpath (e.g. GitHub project pages at `user.github.io/frostos/`), either use a **user/org site** (`user.github.io`) or a **custom domain**, or edit those paths.
3. **A Bare server.** Ultraviolet is only the client half — it needs a backend "Bare server" (TompHTTP) to forward the actual traffic.

## Bare server (backend)

The default bare URL in `uv/uv.config.js` is a placeholder (`https://tomp.io/bare-server/`). Public bare servers come and go — expect to run your own.

Easy options:

- **Cloudflare Workers:** `@tomphttp/bare-server-cloudflare`
- **Node (Vercel/Render/Fly/VPS):** `@tomphttp/bare-server-node`
- **Deno Deploy:** `bare-server-deno`

Once you have a bare URL, either:

- Edit the `bare:` field in `uv/uv.config.js`, or
- Open FrostOS → Settings → Proxy → **Custom (BYOB)** and paste it, then reload.

## Local test

```
npx serve .    # then open the printed http://localhost:PORT
```

Chrome allows service workers on `localhost` even without HTTPS.
