# 🐧 FrostOS

An Arctic-themed pixel hub featuring an unblocked mini-browser powered by **Ultraviolet**, a native movie player, and sleek desktop customization.

---

## 🛠️ Project Structure

```text
frostos/
├── index.html     # Core OS dashboard markup
├── style.css      # CSS styles and glassmorphism interface
├── script.js      # Main OS application logic
├── penguin.svg    # Custom vector graphic asset
├── sw.js          # Root Service Worker handing off /service/* requests to Ultraviolet
└── uv/            # Ultraviolet client bundle files:
    ├── uv.bundle.js, uv.handler.js, uv.client.js
    └── uv.sw.js, uv.config.js
```

---

## 📋 Requirements & Setup Constraints

Because Ultraviolet relies heavily on browser Service Workers, your deployment environment **must** meet the following three rules:

1. **HTTPS Connection Required:** Service Workers will strictly fail to register over unencrypted `http://` protocols (except on `localhost`).
2. **Root Level Deployment:** Paths within `uv/uv.config.js` and `sw.js` expect to be served from the absolute site root (`/`). 
   * *⚠️ GitHub Pages Warning:* If you host this as a project subpath (e.g., `username.github.io/frostos/`), UV will break. You must deploy it to a User/Org site root (`username.github.io`), link a **Custom Domain**, or manually rewrite all paths inside your configuration files.
3. **A Active Bare Server:** Ultraviolet handles front-end rewriting but requires a backend "Bare Server" (TompHTTP) to forward actual web traffic.

---

## 🌐 Configuring Your Bare Server (Backend)

The default backend URL defined inside `uv/uv.config.js` points to a placeholder address (`https://tomp.io/bare-server/`). Because public bare servers cycle frequently, you should run your own backend instance.

### Deployment Options:
* **Cloudflare Workers:** Utilize `@tomphttp/bare-server-cloudflare`
* **Node.js (Render / Fly.io / VPS):** Utilize `@tomphttp/bare-server-node`
* **Deno Deploy:** Utilize `bare-server-deno`

### Connecting it to FrostOS:
Once you have your live Bare Server URL ready, you can activate it in one of two ways:
* Hardcode your link directly into the `bare:` attribute field inside `uv/uv.config.js`.
* Or go to **FrostOS UI → Settings → Proxy → Custom (BYOB)**, paste your link, and reload the application!

---

## 💻 Local Testing & Development

You can test Ultraviolet locally without an HTTPS certificate because modern web browsers relax security restrictions on localhost.

1. Open your terminal in the project directory.
2. Spin up a quick local web server:
   ```bash
   npx serve .
   ```
3. Open the printed `http://localhost:PORT` address in your browser.
