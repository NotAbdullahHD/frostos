/* FrostOS root service worker — hands off /service/* to Ultraviolet */

// Read the chosen Bare server from the registration URL (?bare=<encoded>).
// This is how the page tells the SW which backend to use, since SWs have no
// access to localStorage.
try {
  const params = new URL(location).searchParams;
  const bare = params.get('bare');
  if (bare) self.__frostBare = bare;
} catch (e) { /* ignore */ }

importScripts('/uv/uv.bundle.js');
importScripts('/uv/uv.config.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');

const uv = new UVServiceWorker();

self.addEventListener('install',  (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      if (event.request.url.startsWith(location.origin + __uv$config.prefix)) {
        try {
          return await uv.fetch(event);
        } catch (err) {
          return new Response(
            'FrostOS proxy error: ' + (err && err.message ? err.message : err) +
            '\n\nTry switching to a different Bare server in Settings → Proxy.',
            { status: 502, headers: { 'content-type': 'text/plain' } }
          );
        }
      }
      return fetch(event.request);
    })()
  );
});
