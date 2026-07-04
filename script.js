/* ── FrostOS script.js ───────────────────────────────────── */

/* ── Ultraviolet service worker ──────────────────────────── */
const proxyStatusSub = document.getElementById('proxy-status-sub');
function setProxyStatus(txt) { if (proxyStatusSub) proxyStatusSub.textContent = txt; }

async function registerUV() {
  if (!('serviceWorker' in navigator)) { setProxyStatus('SW unsupported'); return; }
  if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
    setProxyStatus('HTTPS required'); return;
  }
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/service/' });
    await navigator.serviceWorker.ready;
    setProxyStatus('Connected');
  } catch (err) {
    console.error('[FrostOS] SW register failed:', err);
    setProxyStatus('Offline');
  }
}
registerUV();

function proxify(rawUrl) {
  try {
    if (typeof __uv$config === 'undefined') return rawUrl;
    return __uv$config.prefix + __uv$config.encodeUrl(rawUrl);
  } catch (e) { return rawUrl; }
}

/* ── Boot ────────────────────────────────────────────────── */
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
        restoreSettings();
      }, 500);
    }, 300);
  }
}, 210);

/* ── Snow ────────────────────────────────────────────────── */
function spawnSnow() {
  const container = document.getElementById('snow-container');
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.className = 'snowflake';
    el.innerHTML = '❄';
    el.style.cssText = `left:${(i * 7.3) % 100}%;font-size:${8 + (i % 3) * 4}px;animation-duration:${14 + (i % 5) * 3}s;animation-delay:${i * 1.3}s;`;
    container.appendChild(el);
  }
}

/* ── Nav ─────────────────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const page = document.getElementById('page-' + id);
  const btn  = document.querySelector(`.nav-btn[data-page="${id}"]`);
  if (page) page.classList.add('active');
  if (btn)  btn.classList.add('active');
  if (id === 'movies') loadMoviePlayer();
}

document.querySelectorAll('.nav-btn').forEach(btn => btn.addEventListener('click', () => showPage(btn.dataset.page)));
document.querySelectorAll('.pill[data-page]').forEach(pill => pill.addEventListener('click', () => showPage(pill.dataset.page)));

/* ── Movies ──────────────────────────────────────────────── */
function loadMoviePlayer() {
  const src = localStorage.getItem('frostos-movie-src') || 'https://toustream.xyz';
  const ph  = document.getElementById('movies-placeholder');
  const ifr = document.getElementById('movies-iframe');
  if (!ifr || !ph) return;
  ph.classList.add('hidden');
  ifr.classList.remove('hidden');
  if (!ifr.dataset.loaded) {
    ifr.src = proxify(src);
    ifr.dataset.loaded = '1';
  }
}

/* ── Home search ─────────────────────────────────────────── */
const homeInput     = document.getElementById('home-search-input');
const homeSearchBtn = document.getElementById('home-search-btn');

function searchEngineUrl(q) {
  const engine = localStorage.getItem('frostos-engine') || 'google';
  return { google:'https://www.google.com/search?q=', bing:'https://www.bing.com/search?q=', duckduckgo:'https://duckduckgo.com/?q=' }[engine] + encodeURIComponent(q);
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

function loadBrowserUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = searchEngineUrl(url);
  browserAddr.value = url;
  browserPH.classList.add('hidden');
  browserIframe.classList.remove('hidden');
  browserIframe.src = proxify(url);
}

document.getElementById('go-btn').addEventListener('click', () => loadBrowserUrl(browserAddr.value));
browserAddr.addEventListener('keydown', e => { if (e.key === 'Enter') loadBrowserUrl(browserAddr.value); });
document.getElementById('back-btn').addEventListener('click', () => { try { browserIframe.contentWindow.history.back(); } catch(e){} });
document.getElementById('fwd-btn').addEventListener('click', () => { try { browserIframe.contentWindow.history.forward(); } catch(e){} });
document.getElementById('reload-btn').addEventListener('click', () => { browserIframe.src = browserIframe.src; });

/* Browser tabs */
let tabCount = 1;
const tabStrip  = document.getElementById('browser-tabs');
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
    if (tabStrip.querySelectorAll('.b-tab').length <= 1) return;
    const wasActive = tab.classList.contains('active');
    tab.remove();
    const remaining = tabStrip.querySelectorAll('.b-tab');
    if (wasActive && remaining.length) setActiveTab(remaining[remaining.length - 1]);
  } else if (tab) {
    setActiveTab(tab);
  }
});
addTabBtn.addEventListener('click', addTab);

/* ── Settings ────────────────────────────────────────────── */

/* Tab cloaking */
const cloakToggle  = document.getElementById('tab-cloak-toggle');
const cloakOptions = document.getElementById('cloak-options');
const cloakSelect  = document.getElementById('cloak-select');

const cloakData = {
  none:      { title:'FrostOS',           icon:'penguin.svg' },
  google:    { title:'Google',            icon:'https://www.google.com/favicon.ico' },
  drive:     { title:'Google Drive',      icon:'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png' },
  classroom: { title:'Google Classroom',  icon:'https://ssl.gstatic.com/classroom/favicon.png' },
  canvas:    { title:'Canvas',            icon:'https://du11hjcvx0ubn.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
  gmail:     { title:'Gmail',             icon:'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
};

function applyCloak(value) {
  const d = cloakData[value] || cloakData.none;
  document.title = d.title;
  let link = document.querySelector("link[rel='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = d.icon;
}

cloakToggle.addEventListener('change', () => {
  const on = cloakToggle.checked;
  cloakOptions.classList.toggle('hidden', !on);
  localStorage.setItem('frostos-cloak-on', on ? '1' : '');
  applyCloak(on ? cloakSelect.value : 'none');
});
cloakSelect.addEventListener('change', () => {
  localStorage.setItem('frostos-cloak', cloakSelect.value);
  applyCloak(cloakSelect.value);
});

/* Search engine */
const engineSelect = document.getElementById('engine-select');
engineSelect.addEventListener('change', () => localStorage.setItem('frostos-engine', engineSelect.value));

/* Proxy / BYOB */
const proxySelect = document.getElementById('proxy-select');
const byopRow     = document.getElementById('byop-row');
const byopInput   = document.getElementById('byop-input');

proxySelect.addEventListener('change', () => {
  const isByop = proxySelect.value === 'byop';
  byopRow.classList.toggle('hidden', !isByop);
  if (!isByop) { localStorage.removeItem('frostos-bare'); setProxyStatus('Reload to apply'); }
});
byopInput.addEventListener('change', () => {
  const v = byopInput.value.trim();
  if (v) { localStorage.setItem('frostos-bare', v); setProxyStatus('Reload to apply'); }
});

/* ── Restore all settings on load ────────────────────────── */
function restoreSettings() {
  /* engine */
  const savedEngine = localStorage.getItem('frostos-engine');
  if (savedEngine && engineSelect) engineSelect.value = savedEngine;

  /* cloak */
  const savedCloakOn  = localStorage.getItem('frostos-cloak-on');
  const savedCloakVal = localStorage.getItem('frostos-cloak') || 'none';
  if (savedCloakOn && cloakToggle) {
    cloakToggle.checked = true;
    cloakSelect.value   = savedCloakVal;
    cloakOptions.classList.remove('hidden');
    applyCloak(savedCloakVal);
  }

  /* proxy */
  const savedBare = localStorage.getItem('frostos-bare');
  if (savedBare && proxySelect) {
    proxySelect.value = 'byop';
    byopRow.classList.remove('hidden');
    byopInput.value = savedBare;
  }
}
