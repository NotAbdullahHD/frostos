/* ── FrostOS script.js ───────────────────────────────────── */

/* ── Bare server registry ────────────────────────────────── */
/* Public Ultraviolet Bare servers. These come and go — the health check
   in Settings → Proxy will show which ones are live right now.
   Add your own via "Custom (BYOB)" or by hosting your own (see README). */
const BARE_SERVERS = [
  { id: 'tomp',      name: 'TOMP.io',        url: 'https://tomp.io/bare-server/' },
  { id: 'holyub',    name: 'HolyUnblocker',  url: 'https://uv.holyubofficial.net/' },
  { id: 'nebula',    name: 'Nebula',         url: 'https://nebulaproxy.io/bare/' },
  { id: 'incog',     name: 'Incognito',      url: 'https://incog.works/bare/' },
  { id: 'arc',       name: 'Arc',            url: 'https://arc.gointerstellar.app/bare/' },
];
const DEFAULT_BARE = BARE_SERVERS[0].url;

/* ── Ultraviolet service worker registration ─────────────── */
const proxyStatusSub = document.getElementById('proxy-status-sub');
function setProxyStatus(txt) { if (proxyStatusSub) proxyStatusSub.textContent = txt; }

function getActiveBare() {
  return localStorage.getItem('frostos-bare') || DEFAULT_BARE;
}

let swRegistration = null;
async function registerUV() {
  if (!('serviceWorker' in navigator)) { setProxyStatus('SW unsupported'); return; }
  if (location.protocol !== 'https:' &&
      location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    setProxyStatus('HTTPS required');
    console.warn('[FrostOS] Ultraviolet requires HTTPS (or localhost).');
    return;
  }
  const bare = getActiveBare();
  const swUrl = '/sw.js?bare=' + encodeURIComponent(bare);
  try {
    // Unregister anything old so the new ?bare= takes effect
    const existing = await navigator.serviceWorker.getRegistrations();
    for (const r of existing) {
      if (r.active && r.active.scriptURL.indexOf('/sw.js') !== -1 &&
          r.active.scriptURL.indexOf('bare=' + encodeURIComponent(bare)) === -1) {
        await r.unregister();
      }
    }
    swRegistration = await navigator.serviceWorker.register(swUrl, { scope: '/service/' });
    await navigator.serviceWorker.ready;
    setProxyStatus('Connected · ' + hostOf(bare));
  } catch (err) {
    console.error('[FrostOS] SW register failed:', err);
    setProxyStatus('Offline');
  }
}
function hostOf(u) { try { return new URL(u).host; } catch { return u; } }

/* Build a proxied URL for an absolute http(s) target. */
function proxify(rawUrl) {
  try {
    if (typeof __uv$config === 'undefined') return rawUrl;
    return __uv$config.prefix + __uv$config.encodeUrl(rawUrl);
  } catch { return rawUrl; }
}

/* ── Bare server health check ────────────────────────────── */
/* A live Bare server returns JSON at its root with a "versions" array. */
async function pingBare(url, timeoutMs = 4000) {
  const started = performance.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal, cache: 'no-store' });
    clearTimeout(t);
    if (!res.ok) return { ok: false, ms: null, reason: 'HTTP ' + res.status };
    const body = await res.json().catch(() => null);
    const looksBare = body && (Array.isArray(body.versions) || body.language === 'NodeJS' || body.project);
    return { ok: !!looksBare, ms: Math.round(performance.now() - started),
             reason: looksBare ? 'OK' : 'not a Bare server' };
  } catch (e) {
    clearTimeout(t);
    return { ok: false, ms: null, reason: e.name === 'AbortError' ? 'timeout' : 'unreachable' };
  }
}

async function healthCheckAll(onResult) {
  const results = [];
  await Promise.all(BARE_SERVERS.map(async (s) => {
    const r = await pingBare(s.url);
    const row = { ...s, ...r };
    results.push(row);
    if (onResult) onResult(row);
  }));
  return results;
}

async function pickBestBare() {
  const results = await healthCheckAll();
  const ok = results.filter(r => r.ok).sort((a, b) => a.ms - b.ms);
  return ok[0] || null;
}

/* ── Boot sequence ─────────────────────────────────────────── */
const bootScreen = document.getElementById('boot-screen');
const bootBar    = document.getElementById('boot-bar');
const bootMsg    = document.getElementById('boot-msg');
const app        = document.getElementById('app');

const bootMessages = [
  'Loading FrostOS...',
  'Preparing Glacier Systems...',
  'Connecting to Arctic Network...',
  'Warming Ultraviolet proxy...',
  'Calibrating Aurora Display...',
];
let msgIdx = 0;
const msgInterval = setInterval(() => {
  msgIdx = (msgIdx + 1) % bootMessages.length;
  bootMsg.textContent = bootMessages[msgIdx];
}, 900);

let progress = 0;
const barInterval = setInterval(() => {
  progress = Math.min(progress + Math.random() * 15 + 6, 100);
  bootBar.style.width = progress + '%';
  if (progress >= 100) {
    clearInterval(barInterval);
    clearInterval(msgInterval);
    setTimeout(() => {
      bootScreen.classList.add('fade-out');
      setTimeout(() => {
        bootScreen.classList.add('hidden');
        app.classList.remove('hidden');
        spawnSnow();
        // Register SW after boot so the initial network is quiet
        registerUV();
      }, 500);
    }, 300);
  }
}, 210);

/* ── Snow ─────────────────────────────────────────────────── */
function spawnSnow() {
  const container = document.getElementById('snow-container');
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.className = 'snowflake';
    el.innerHTML = '❄';
    const size = 8 + (i % 3) * 4;
    el.style.cssText = `
      left: ${(i * 7.3) % 100}%;
      font-size: ${size}px;
      animation-duration: ${14 + (i % 5) * 3}s;
      animation-delay: ${i * 1.3}s;
    `;
    container.appendChild(el);
  }
}

/* ── Page navigation ──────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  const btn  = document.querySelector(`.nav-btn[data-page="${id}"]`);
  if (page) page.classList.add('active');
  if (btn)  btn.classList.add('active');
  if (id === 'movies') loadMoviePlayer();
}
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});
document.querySelectorAll('.pill[data-page]').forEach(pill => {
  pill.addEventListener('click', () => showPage(pill.dataset.page));
});

/* ── Movies ──────────────────────────────────────────────── */
function loadMoviePlayer() {
  const TARGET_SITE = localStorage.getItem('frostos-movie-src') || 'https://toustream.xyz';
  const moviesPlaceholder = document.getElementById('movies-placeholder');
  const moviesIframe = document.getElementById('movies-iframe');
  if (!moviesIframe || !moviesPlaceholder) return;
  moviesPlaceholder.classList.add('hidden');
  moviesIframe.classList.remove('hidden');
  if (moviesIframe.src === 'about:blank' || moviesIframe.src === '') {
    moviesIframe.src = proxify(TARGET_SITE);
  }
}

/* ── Home search ─────────────────────────────────────────── */
const homeInput  = document.getElementById('home-search-input');
const homeSearchBtn = document.getElementById('home-search-btn');
function searchEngineUrl(q) {
  const engine = localStorage.getItem('frostos-engine') || 'google';
  const engines = {
    google:    'https://www.google.com/search?q=',
    bing:      'https://www.bing.com/search?q=',
    duckduckgo:'https://duckduckgo.com/?q=',
  };
  return engines[engine] + encodeURIComponent(q);
}
function doHomeSearch() {
  const q = homeInput.value.trim();
  if (!q) return;
  showPage('browser');
  loadBrowserUrl(searchEngineUrl(q));
}
homeSearchBtn.addEventListener('click', doHomeSearch);
homeInput.addEventListener('keydown', e => { if (e.key === 'Enter') doHomeSearch(); });

/* ── Browser ─────────────────────────────────────────────── */
const browserAddr   = document.getElementById('browser-addr');
const browserIframe = document.getElementById('browser-iframe');
const browserPH     = document.getElementById('browser-placeholder');
const goBtn         = document.getElementById('go-btn');
const backBtn       = document.getElementById('back-btn');
const fwdBtn        = document.getElementById('fwd-btn');
const reloadBtn     = document.getElementById('reload-btn');

async function ensureSWReady() {
  if (!('serviceWorker' in navigator)) return false;
  if (!swRegistration) await registerUV();
  try { await navigator.serviceWorker.ready; return true; } catch { return false; }
}

async function loadBrowserUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = searchEngineUrl(url);
  browserAddr.value = url;
  browserPH.classList.add('hidden');
  browserIframe.classList.remove('hidden');
  const ready = await ensureSWReady();
  if (!ready) {
    browserPH.classList.remove('hidden');
    browserIframe.classList.add('hidden');
    setProxyStatus('SW not ready — see Settings → Proxy');
    return;
  }
  browserIframe.src = proxify(url);
}

goBtn.addEventListener('click', () => loadBrowserUrl(browserAddr.value));
browserAddr.addEventListener('keydown', e => { if (e.key === 'Enter') loadBrowserUrl(browserAddr.value); });
backBtn.addEventListener('click',   () => { try { browserIframe.contentWindow.history.back();    } catch(e){} });
fwdBtn.addEventListener('click',    () => { try { browserIframe.contentWindow.history.forward(); } catch(e){} });
reloadBtn.addEventListener('click', () => { browserIframe.src = browserIframe.src; });

// Browser tabs (basic)
let tabCount = 1;
const tabStrip = document.getElementById('browser-tabs');
const addTabBtn = document.getElementById('add-tab-btn');
function addTab() {
  tabCount++;
  const tab = document.createElement('div');
  tab.className = 'b-tab';
  tab.dataset.id = tabCount;
  tab.innerHTML = `<i class="fa-solid fa-snowflake"></i><span>New Tab</span><i class="fa-solid fa-xmark tab-close"></i>`;
  tabStrip.insertBefore(tab, addTabBtn);
  setActiveTab(tab);
}
function setActiveTab(tab) {
  tabStrip.querySelectorAll('.b-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  browserIframe.src = 'about:blank';
  browserIframe.classList.add('hidden');
  browserPH.classList.remove('hidden');
  browserAddr.value = 'https://';
}
tabStrip.addEventListener('click', e => {
  const tab   = e.target.closest('.b-tab');
  const close = e.target.closest('.tab-close');
  if (close && tab) {
    const tabs = tabStrip.querySelectorAll('.b-tab');
    if (tabs.length <= 1) return;
    tab.remove();
    const remaining = tabStrip.querySelectorAll('.b-tab');
    if (!tabStrip.querySelector('.b-tab.active') && remaining.length) {
      setActiveTab(remaining[remaining.length - 1]);
    }
  } else if (tab) setActiveTab(tab);
});
addTabBtn.addEventListener('click', addTab);

/* ── Settings: cloak ─────────────────────────────────────── */
const cloakToggle  = document.getElementById('tab-cloak-toggle');
const cloakOptions = document.getElementById('cloak-options');
const cloakSelect  = document.getElementById('cloak-select');
const cloakData = {
  none:      { title: 'FrostOS',          icon: 'penguin.svg' },
  google:    { title: 'Google',           icon: 'https://www.google.com/favicon.ico' },
  drive:     { title: 'Google Drive',     icon: 'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png' },
  classroom: { title: 'Google Classroom', icon: 'https://ssl.gstatic.com/classroom/favicon.png' },
  canvas:    { title: 'Canvas',           icon: 'https://du11hjcvx0ubn.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
  gmail:     { title: 'Gmail',            icon: 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
};
function applyCloak(value) {
  const d = cloakData[value] || cloakData.none;
  document.title = d.title;
  let link = document.querySelector("link[rel='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = d.icon;
}
cloakToggle.addEventListener('change', () => {
  if (cloakToggle.checked) { cloakOptions.classList.remove('hidden'); applyCloak(cloakSelect.value); }
  else { cloakOptions.classList.add('hidden'); applyCloak('none'); }
});
cloakSelect.addEventListener('change', () => applyCloak(cloakSelect.value));

/* ── Settings: search engine ─────────────────────────────── */
const engineSelect = document.getElementById('engine-select');
engineSelect.addEventListener('change', () => {
  localStorage.setItem('frostos-engine', engineSelect.value);
});
const savedEngine = localStorage.getItem('frostos-engine');
if (savedEngine) engineSelect.value = savedEngine;

/* ── Settings: Proxy / Bare ──────────────────────────────── */
const proxySelect  = document.getElementById('proxy-select');
const byopRow      = document.getElementById('byop-row');
const byopInput    = document.getElementById('byop-input');
const bareStatusEl = document.getElementById('bare-status');
const checkBtn     = document.getElementById('bare-check-btn');
const bestBtn      = document.getElementById('bare-best-btn');
const activeBareEl = document.getElementById('active-bare');

/* Populate proxy dropdown from BARE_SERVERS */
function initProxyDropdown() {
  proxySelect.innerHTML = '';
  BARE_SERVERS.forEach(s => {
    const o = document.createElement('option');
    o.value = s.url; o.textContent = s.name + ' — ' + hostOf(s.url);
    proxySelect.appendChild(o);
  });
  const byop = document.createElement('option');
  byop.value = 'byop'; byop.textContent = 'Custom (BYOB)…';
  proxySelect.appendChild(byop);

  const saved = localStorage.getItem('frostos-bare');
  if (saved && !BARE_SERVERS.some(s => s.url === saved)) {
    proxySelect.value = 'byop';
    byopRow.classList.remove('hidden');
    byopInput.value = saved;
  } else {
    proxySelect.value = saved || DEFAULT_BARE;
  }
  updateActiveBare();
}
function updateActiveBare() {
  if (activeBareEl) activeBareEl.textContent = getActiveBare();
}

async function setBare(url) {
  localStorage.setItem('frostos-bare', url);
  updateActiveBare();
  setProxyStatus('Reconnecting…');
  await registerUV();
}

proxySelect.addEventListener('change', async () => {
  const v = proxySelect.value;
  if (v === 'byop') { byopRow.classList.remove('hidden'); return; }
  byopRow.classList.add('hidden');
  await setBare(v);
});
byopInput.addEventListener('change', async () => {
  const v = byopInput.value.trim();
  if (v) await setBare(v);
});

/* Health-check UI */
function renderRow(row) {
  const cls = row.ok ? 'ok' : 'bad';
  const ms  = row.ms != null ? row.ms + 'ms' : '—';
  return `<div class="bare-row ${cls}">
    <span class="bare-dot"></span>
    <span class="bare-name">${row.name}</span>
    <span class="bare-host">${hostOf(row.url)}</span>
    <span class="bare-ms">${ms}</span>
    <span class="bare-reason">${row.reason}</span>
    <button class="pixel-btn bare-use" data-url="${row.url}" ${row.ok ? '' : 'disabled'}>Use</button>
  </div>`;
}

async function runHealthCheck() {
  if (!bareStatusEl) return;
  bareStatusEl.innerHTML = BARE_SERVERS.map(s =>
    renderRow({ ...s, ok: false, ms: null, reason: 'checking…' })
  ).join('');
  const rows = await healthCheckAll();
  rows.sort((a, b) => (b.ok - a.ok) || ((a.ms ?? 9e9) - (b.ms ?? 9e9)));
  bareStatusEl.innerHTML = rows.map(renderRow).join('');
  bareStatusEl.querySelectorAll('.bare-use').forEach(btn => {
    btn.addEventListener('click', async () => {
      const url = btn.dataset.url;
      proxySelect.value = url;
      byopRow.classList.add('hidden');
      await setBare(url);
    });
  });
}

if (checkBtn) checkBtn.addEventListener('click', runHealthCheck);
if (bestBtn)  bestBtn.addEventListener('click', async () => {
  setProxyStatus('Finding best proxy…');
  const best = await pickBestBare();
  if (!best) { setProxyStatus('No live proxies — try BYOB'); return; }
  proxySelect.value = best.url;
  byopRow.classList.add('hidden');
  await setBare(best.url);
  runHealthCheck();
});

initProxyDropdown();
