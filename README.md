# FrostOS

Arctic-themed pixel/Minecraft-style browser hub: Home, Movies, Games, Browser and Settings — all static, no build step.

## Run locally

Any static file server works. Two quick options:

```bash
# Python
python3 -m http.server 8000

# Node
npx serve .
```

Then open http://localhost:8000

## Deploy

Drop the whole folder on any static host: GitHub Pages, Netlify, Vercel, Cloudflare Pages, itch.io, etc. No backend required.

## Files

| File          | Purpose                                             |
|---------------|-----------------------------------------------------|
| `index.html`  | App shell (sidebar + pages)                         |
| `style.css`   | Pixel/arctic theme                                  |
| `script.js`   | Boot, navigation, browser, games, proxy engine      |
| `games.json`  | 260 in-browser games (title, embed, image, tags)    |
| `penguin.svg` | Mascot / favicon                                    |

## Proxies

The Settings → Proxy panel lists several free proxy sources plus **Direct** and **Custom (BYOP)**. `Health check` pings each one; `Pick best` auto-selects the fastest working option. Choose Direct if you don't need a proxy (movies and games load fine directly).

For a private high-quality proxy, host [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet) or [Rammerhead](https://github.com/binary-person/rammerhead) on Cloudflare Workers / a VPS and paste its URL prefix into the **Custom (BYOP)** field, e.g.:

```
https://your-proxy.example.workers.dev/?url=
```

The app appends `encodeURIComponent(target)` to that prefix.
