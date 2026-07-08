import { createFileRoute } from "@tanstack/react-router";

/**
 * Simple iframe-friendly proxy.
 * GET /api/proxy?url=<encoded absolute URL>
 *
 * - Strips X-Frame-Options / frame-ancestors CSP so pages can render in an iframe
 * - Injects a <base> tag so relative links keep working
 * - Rewrites <a href> and <form action> to route back through /api/proxy
 */
export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const reqUrl = new URL(request.url);
        const target = reqUrl.searchParams.get("url");
        if (!target) {
          return new Response("Missing ?url", { status: 400 });
        }

        let targetUrl: URL;
        try {
          targetUrl = new URL(target);
          if (!/^https?:$/.test(targetUrl.protocol)) throw new Error("bad proto");
        } catch {
          return new Response("Invalid url", { status: 400 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(targetUrl.toString(), {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
              Accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
              "Accept-Language": "en-US,en;q=0.9",
            },
            redirect: "follow",
          });
        } catch (e) {
          return new Response(`Fetch failed: ${(e as Error).message}`, { status: 502 });
        }

        // Strip headers that would prevent iframing
        const headers = new Headers(upstream.headers);
        headers.delete("x-frame-options");
        headers.delete("content-security-policy");
        headers.delete("content-security-policy-report-only");
        headers.delete("cross-origin-opener-policy");
        headers.delete("cross-origin-embedder-policy");
        headers.delete("cross-origin-resource-policy");
        headers.delete("permissions-policy");
        headers.set("access-control-allow-origin", "*");

        const contentType = (upstream.headers.get("content-type") || "").toLowerCase();

        // Only HTML gets rewritten
        if (!contentType.includes("text/html")) {
          return new Response(upstream.body, { status: upstream.status, headers });
        }

        let html = await upstream.text();
        const baseHref = targetUrl.origin + targetUrl.pathname.replace(/[^/]*$/, "");
        const proxyPrefix = "/api/proxy?url=";

        const injection = `
<base href="${baseHref}">
<script>
(function(){
  function abs(u){ try { return new URL(u, document.baseURI).toString(); } catch(e){ return null; } }
  function proxify(u){ var a = abs(u); return a ? '${proxyPrefix}' + encodeURIComponent(a) : u; }
  // rewrite existing anchors + forms
  function rewrite(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var h=a.getAttribute('href'); if(!h||h.startsWith('javascript:')||h.startsWith('#')) return;
      a.setAttribute('href', proxify(h)); a.removeAttribute('target');
    });
    document.querySelectorAll('form[action]').forEach(function(f){
      f.setAttribute('action', proxify(f.getAttribute('action')));
    });
  }
  document.addEventListener('DOMContentLoaded', rewrite);
  // intercept link clicks (covers dynamically added)
  document.addEventListener('click', function(e){
    var a = e.target && e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    var h = a.getAttribute('href');
    if(!h || h.startsWith('javascript:') || h.startsWith('#') || h.startsWith('${proxyPrefix}')) return;
    e.preventDefault();
    var target = abs(h); if(!target) return;
    window.top.postMessage({ __frost: 'nav', url: target }, '*');
    window.location.href = proxify(h);
  }, true);
})();
</script>
`;

        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head([^>]*)>/i, `<head$1>${injection}`);
        } else {
          html = injection + html;
        }

        headers.set("content-type", "text/html; charset=utf-8");
        headers.delete("content-length");
        headers.delete("content-encoding");

        return new Response(html, { status: upstream.status, headers });
      },
    },
  },
});
