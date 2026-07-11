/* ── FrostOS script.js ─────────────────────────────────────── */

/* ── UV service worker ───────────────────────────────────────── */
async function registerUV() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') return;
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/service/' });
    await navigator.serviceWorker.ready;
  } catch (e) { console.warn('[FrostOS] SW:', e); }
}
registerUV();

/* ── Proxy engines ───────────────────────────────────────────── */
const PROXY_ENGINES = {
  cors:        { label:'Simple CORS',  desc:'Fast fallback for many sites',        default:'https://corsproxy.io/?url=' },
  ultraviolet: { label:'Ultraviolet',  desc:'Full web proxy (needs UV backend)',    default:'https://tomp.app/' },
  rammerhead:  { label:'Rammerhead',   desc:'Session-based proxy',                 default:'https://rammerhead.org/' },
  dipnix:      { label:'Dipnix',       desc:'URL-wrap proxy service',              default:'https://api.allorigins.win/raw?url=' },
};

const THEMES = {
  arctic:{ navy:'#0A1628', navy2:'#0F2138', cyan:'#4FD1E0', green:'#54E0A8', violet:'#9B8CF2' },
  lava:  { navy:'#1a0a08', navy2:'#2a1410', cyan:'#FF6A3D', green:'#FFC93C', violet:'#FF3D68' },
  forest:{ navy:'#0a1a10', navy2:'#12261a', cyan:'#7CE577', green:'#A0F0A0', violet:'#B8F0C0' },
  night: { navy:'#050510', navy2:'#0d0d24', cyan:'#B388FF', green:'#82B1FF', violet:'#FF80AB' },
  candy: { navy:'#1a0f26', navy2:'#26143a', cyan:'#FF7ED4', green:'#7EFFD4', violet:'#FFD97E' },
};

const RADIO_STATIONS = {
  lofi:     { name:'Lofi Chill',   url:'https://usa9.fastcast4u.com/proxy/jamz?mp=/1' },
  synth:    { name:'Synthwave',    url:'https://stream.nightride.fm/nightride.m4a' },
  chillhop: { name:'Chillhop',     url:'http://stream.zeno.fm/0r0xa792kwzuv' },
  jazz:     { name:'Smooth Jazz',  url:'https://streams.calmradio.com/api/39/128/stream' },
  classic:  { name:'Classical',    url:'https://live.musopen.org:8085/streamvbr0' },
};

const CLOAK_DATA = {
  none:      { title:'FrostOS',          icon:'favicon.ico' },
  google:    { title:'Google',           icon:'https://www.google.com/favicon.ico' },
  drive:     { title:'Google Drive',     icon:'https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png' },
  classroom: { title:'Google Classroom', icon:'https://ssl.gstatic.com/classroom/favicon.png' },
  canvas:    { title:'Canvas',           icon:'https://du11hjcvx0ubn.cloudfront.net/dist/images/favicon-e10d657a73.ico' },
  gmail:     { title:'Gmail',            icon:'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico' },
};

const ENGINES = {
  duckduckgo: 'https://duckduckgo.com/?q=',
  google:     'https://www.google.com/search?q=',
  bing:       'https://www.bing.com/search?q=',
};

/* ── State ───────────────────────────────────────────────────── */
let proxyEngine  = localStorage.getItem('frostos-proxy-engine') || 'cors';
let proxyBackend = localStorage.getItem('frostos-proxy-backend') || PROXY_ENGINES.cors.default;
let currentTheme = localStorage.getItem('frostos-theme') || 'arctic';
let searchEngine = localStorage.getItem('frostos-engine') || 'duckduckgo';
let moviesLoaded = false;
let allGames     = [];
let tabCounter   = 1;
let gameCounter  = 0;

/* ── Boot ────────────────────────────────────────────────────── */
const bootMsgs = ['Loading FrostOS...','Preparing Glacier Systems...','Connecting to Arctic Network...','Calibrating Aurora Display...'];
let bootMsgIdx = 0;
const bootBar  = document.getElementById('boot-bar');
const bootMsg  = document.getElementById('boot-msg');

const msgIv = setInterval(() => { bootMsg.textContent = bootMsgs[++bootMsgIdx % bootMsgs.length]; }, 900);
let prog = 0;
const barIv = setInterval(() => {
  prog = Math.min(prog + Math.random() * 15 + 6, 100);
  bootBar.style.width = prog + '%';
  if (prog >= 100) {
    clearInterval(barIv); clearInterval(msgIv);
    setTimeout(() => {
      const bs = document.getElementById('boot-screen');
      bs.classList.add('fade-out');
      setTimeout(() => {
        bs.classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        spawnSnow();
        initAll();
      }, 500);
    }, 300);
  }
}, 210);

/* ── Snow ────────────────────────────────────────────────────── */
function spawnSnow() {
  const c = document.getElementById('snow-container');
  for (let i = 0; i < 14; i++) {
    const el = document.createElement('div');
    el.className = 'snowflake'; el.innerHTML = '❄';
    el.style.cssText = `left:${(i*7.3)%100}%;font-size:${8+(i%3)*4}px;animation-duration:${14+(i%5)*3}s;animation-delay:${i*1.3}s;`;
    c.appendChild(el);
  }
}

/* ── Init ────────────────────────────────────────────────────── */
function initAll() {
  applyTheme(currentTheme);
  buildThemeGrid();
  restoreSettings();
  loadGames();
  initNav();
  initHomeSearch();
  initBrowser();
  initMovies();
  initSettings();
  initJukebox();
  updateProxyLabel();
  initWelcomeModal();
  initPanicKey();
}

/* ── Theme ───────────────────────────────────────────────────── */
function applyTheme(key) {
  const t = THEMES[key] || THEMES.arctic;
  const r = document.documentElement.style;
  r.setProperty('--navy',   t.navy);
  r.setProperty('--navy2',  t.navy2);
  r.setProperty('--cyan',   t.cyan);
  r.setProperty('--green',  t.green);
  r.setProperty('--violet', t.violet);
  r.setProperty('--pixel-border', t.cyan + '80');
}

function buildThemeGrid() {
  const grid = document.getElementById('theme-grid');
  grid.innerHTML = '';
  Object.entries(THEMES).forEach(([key, t]) => {
    const btn = document.createElement('button');
    btn.className = 'theme-swatch' + (key === currentTheme ? ' active' : '');
    btn.innerHTML = `<div class="theme-preview" style="background:${t.navy}">
      <span style="background:${t.cyan}"></span>
      <span style="background:${t.green}"></span>
      <span style="background:${t.violet}"></span>
    </div><div class="theme-name">${key}</div>`;
    btn.addEventListener('click', () => {
      currentTheme = key;
      localStorage.setItem('frostos-theme', key);
      applyTheme(key);
      grid.querySelectorAll('.theme-swatch').forEach(s => s.classList.remove('active'));
      btn.classList.add('active');
    });
    grid.appendChild(btn);
  });
}

/* ── Nav ─────────────────────────────────────────────────────── */
function initNav() {
  document.querySelectorAll('.nav-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => showPage(btn.dataset.page));
  });
  document.querySelectorAll('.pixel-pill[data-page]').forEach(pill => {
    pill.addEventListener('click', () => showPage(pill.dataset.page));
  });
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id)?.classList.add('active');
  document.querySelector(`.nav-btn[data-page="${id}"]`)?.classList.add('active');
  if (id === 'movies' && !moviesLoaded) { /* wait for button click */ }
}

/* ── Proxy ───────────────────────────────────────────────────── */
function proxify(url) {
  const b = proxyBackend.trim();
  if (proxyEngine === 'ultraviolet') {
    try {
      if (typeof __uv$config !== 'undefined')
        return __uv$config.prefix + __uv$config.encodeUrl(url);
    } catch(e) {}
    const base = b.endsWith('/') ? b : b + '/';
    return base + 'uv/service/' + encodeURIComponent(url);
  }
  return b + encodeURIComponent(url);
}

function updateProxyLabel() {
  const label = PROXY_ENGINES[proxyEngine]?.label || proxyEngine;
  document.getElementById('proxy-status-label').textContent = 'Proxy: ' + label;
}

/* ── Home search ─────────────────────────────────────────────── */
function initHomeSearch() {
  const input = document.getElementById('home-search-input');
  const btn   = document.getElementById('home-search-btn');
  function go() {
    const q = input.value.trim(); if (!q) return;
    showPage('browser');
    loadBrowserUrl(normalizeInput(q));
  }
  btn.addEventListener('click', go);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}

function normalizeInput(s) {
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return 'https://' + s;
  return (ENGINES[searchEngine] || ENGINES.duckduckgo) + encodeURIComponent(s);
}

/* ── Movies ──────────────────────────────────────────────────── */
function initMovies() {
  document.getElementById('load-movies-btn').addEventListener('click', () => {
    moviesLoaded = true;
    document.getElementById('movies-placeholder').classList.add('hidden');
    const ifr = document.getElementById('movies-iframe');
    ifr.classList.remove('hidden');
    ifr.src = proxify('https://toustream.xyz');
  });
}

/* ── Games ───────────────────────────────────────────────────── */
function loadGames() {
  fetch('/games.json')
    .then(r => r.json())
    .then(data => {
      allGames = data.map(g => ({ title: g.title, url: g.embed, img: g.image }));
      renderGames(allGames);
    })
    .catch(() => {
      document.getElementById('games-grid').innerHTML = '<div class="games-loading">Could not load games.</div>';
    });

  document.getElementById('game-search-input').addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderGames(q ? allGames.filter(g => g.title.toLowerCase().includes(q)) : allGames);
  });
}

function renderGames(list) {
  const grid = document.getElementById('games-grid');
  if (!list.length) { grid.innerHTML = '<div class="games-loading">No games found.</div>'; return; }
  grid.innerHTML = '';
  list.forEach(g => {
    const card = document.createElement('button');
    card.className = 'game-card';
    card.innerHTML = `<div class="game-thumb">
      <img src="${g.img}" alt="${g.title}" loading="lazy" onerror="this.style.display='none'">
      <div class="game-fallback">${g.title.charAt(0)}</div>
    </div>
    <div class="game-title">${g.title}</div>`;
    card.addEventListener('click', () => openGameWindow(g));
    grid.appendChild(card);
  });
}

/* ── Game windows ────────────────────────────────────────────── */
function openGameWindow(game) {
  const layer = document.getElementById('game-windows-layer');
  const existing = layer.querySelector(`[data-url="${CSS.escape(game.url)}"]`);
  if (existing) { existing.querySelector('.gw-body').style.display = ''; existing.classList.remove('minimized'); return; }

  gameCounter++;
  const id = gameCounter;
  const win = document.createElement('div');
  win.className = 'game-window';
  win.dataset.url = game.url;
  win.style.top  = (60 + (id % 5) * 30) + 'px';
  win.style.left = (120 + (id % 5) * 40) + 'px';
  win.innerHTML = `
    <div class="gw-header">
      <div class="gw-title"><i class="fa-solid fa-gamepad"></i> ${game.title}</div>
      <div class="gw-actions">
        <button class="fr-icon-btn gw-min"><i class="fa-solid fa-chevron-down"></i></button>
        <button class="fr-icon-btn gw-close"><i class="fa-solid fa-xmark"></i></button>
      </div>
    </div>
    <div class="gw-body">
      <iframe src="${game.url}" allow="autoplay; fullscreen; gamepad"
        sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-pointer-lock"></iframe>
    </div>`;
  win.querySelector('.gw-close').addEventListener('click', () => win.remove());
  win.querySelector('.gw-min').addEventListener('click', () => {
    const minimized = win.classList.toggle('minimized');
    win.querySelector('.gw-min i').className = minimized ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
  });
  // drag
  const header = win.querySelector('.gw-header');
  let dx=0, dy=0, mx=0, my=0;
  header.addEventListener('mousedown', e => {
    mx=e.clientX; my=e.clientY;
    document.onmousemove = e2 => { dx=mx-e2.clientX; dy=my-e2.clientY; mx=e2.clientX; my=e2.clientY; win.style.top=(win.offsetTop-dy)+'px'; win.style.left=(win.offsetLeft-dx)+'px'; };
    document.onmouseup = () => { document.onmousemove=null; document.onmouseup=null; };
  });
  layer.appendChild(win);
}

/* ── Browser ─────────────────────────────────────────────────── */
function initBrowser() {
  const addr   = document.getElementById('browser-addr');
  const iframe = document.getElementById('browser-iframe');
  const ph     = document.getElementById('browser-placeholder');

  function loadUrl(raw) {
    const url = normalizeInput(raw); if (!url) return;
    addr.value = url;
    ph.classList.add('hidden');
    iframe.classList.remove('hidden');
    iframe.src = proxify(url);
  }

  document.getElementById('go-btn').addEventListener('click', () => loadUrl(addr.value));
  addr.addEventListener('keydown', e => { if (e.key === 'Enter') loadUrl(addr.value); });
  document.getElementById('back-btn').addEventListener('click', () => { try { iframe.contentWindow.history.back(); } catch(e){} });
  document.getElementById('fwd-btn').addEventListener('click', () => { try { iframe.contentWindow.history.forward(); } catch(e){} });
  document.getElementById('reload-btn').addEventListener('click', () => { iframe.src = iframe.src; });

  // tabs
  const strip = document.getElementById('browser-tabs');
  document.getElementById('add-tab-btn').addEventListener('click', () => {
    tabCounter++;
    const tab = document.createElement('div');
    tab.className = 'b-tab'; tab.dataset.id = tabCounter;
    tab.innerHTML = `<i class="fa-solid fa-snowflake"></i><span>New Tab</span><i class="fa-solid fa-xmark tab-close"></i>`;
    strip.insertBefore(tab, document.getElementById('add-tab-btn'));
    activateTab(tab, iframe, ph, addr);
  });
  strip.addEventListener('click', e => {
    const tab   = e.target.closest('.b-tab');
    const close = e.target.closest('.tab-close');
    if (close && tab) {
      if (strip.querySelectorAll('.b-tab').length <= 1) return;
      const wasActive = tab.classList.contains('active');
      tab.remove();
      if (wasActive) {
        const rem = strip.querySelectorAll('.b-tab');
        if (rem.length) activateTab(rem[rem.length-1], iframe, ph, addr);
      }
    } else if (tab) { activateTab(tab, iframe, ph, addr); }
  });

  // expose loadUrl globally for home search
  window._loadBrowserUrl = loadUrl;
}

function loadBrowserUrl(url) { window._loadBrowserUrl?.(url); }

function activateTab(tab, iframe, ph, addr) {
  document.querySelectorAll('.b-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  iframe.src = 'about:blank';
  iframe.classList.add('hidden');
  ph.classList.remove('hidden');
  addr.value = 'https://';
}

/* ── Settings ────────────────────────────────────────────────── */
function initSettings() {
  // cloak
  const cloakToggle  = document.getElementById('cloak-toggle');
  const cloakOptions = document.getElementById('cloak-options');
  const cloakSelect  = document.getElementById('cloak-select');
  cloakToggle.addEventListener('change', () => {
    cloakOptions.classList.toggle('hidden', !cloakToggle.checked);
    localStorage.setItem('frostos-cloak-on', cloakToggle.checked ? '1' : '');
    applyCloak(cloakToggle.checked ? cloakSelect.value : 'none');
  });
  cloakSelect.addEventListener('change', () => {
    localStorage.setItem('frostos-cloak', cloakSelect.value);
    applyCloak(cloakSelect.value);
  });

  // engine
  const engineSel = document.getElementById('engine-select');
  engineSel.addEventListener('change', () => {
    searchEngine = engineSel.value;
    localStorage.setItem('frostos-engine', engineSel.value);
  });

  // proxy engine
  const proxyEngineSel  = document.getElementById('proxy-engine-select');
  const proxyBackendInp = document.getElementById('proxy-backend-input');
  const proxyDescEl     = document.getElementById('proxy-desc');
  proxyEngineSel.addEventListener('change', () => {
    proxyEngine  = proxyEngineSel.value;
    proxyBackend = PROXY_ENGINES[proxyEngine].default;
    proxyBackendInp.value = proxyBackend;
    proxyDescEl.textContent = PROXY_ENGINES[proxyEngine].desc;
    localStorage.setItem('frostos-proxy-engine', proxyEngine);
    localStorage.setItem('frostos-proxy-backend', proxyBackend);
    updateProxyLabel();
  });
  proxyBackendInp.addEventListener('change', () => {
    proxyBackend = proxyBackendInp.value;
    localStorage.setItem('frostos-proxy-backend', proxyBackend);
  });
  document.getElementById('reset-proxy-btn').addEventListener('click', () => {
    proxyBackend = PROXY_ENGINES[proxyEngine].default;
    proxyBackendInp.value = proxyBackend;
    localStorage.setItem('frostos-proxy-backend', proxyBackend);
  });
}

function applyCloak(value) {
  const d = CLOAK_DATA[value] || CLOAK_DATA.none;
  document.title = d.title;
  let link = document.querySelector("link[rel='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = d.icon;
}

function restoreSettings() {
  // engine
  const eng = localStorage.getItem('frostos-engine');
  if (eng) { searchEngine = eng; const el = document.getElementById('engine-select'); if(el) el.value = eng; }

  // cloak
  if (localStorage.getItem('frostos-cloak-on')) {
    const val = localStorage.getItem('frostos-cloak') || 'none';
    const tog = document.getElementById('cloak-toggle');
    const sel = document.getElementById('cloak-select');
    const opt = document.getElementById('cloak-options');
    if (tog) { tog.checked = true; }
    if (sel) sel.value = val;
    if (opt) opt.classList.remove('hidden');
    applyCloak(val);
  }

  // proxy
  const savedEngine  = localStorage.getItem('frostos-proxy-engine');
  const savedBackend = localStorage.getItem('frostos-proxy-backend');
  if (savedEngine) {
    proxyEngine = savedEngine;
    const el = document.getElementById('proxy-engine-select'); if(el) el.value = savedEngine;
    const desc = document.getElementById('proxy-desc');
    if(desc) desc.textContent = PROXY_ENGINES[savedEngine]?.desc || '';
  }
  if (savedBackend) {
    proxyBackend = savedBackend;
    const el = document.getElementById('proxy-backend-input'); if(el) el.value = savedBackend;
  } else {
    const el = document.getElementById('proxy-backend-input');
    if(el) el.value = PROXY_ENGINES[proxyEngine]?.default || '';
  }
}

/* ── Jukebox (home disc player) ─────────────────────────────── */
function initJukebox() {
  const audio     = document.getElementById('jukebox-audio');
  const playBtn   = document.getElementById('jukebox-play-btn');
  const stSel     = document.getElementById('jukebox-station-select');
  const stName    = document.getElementById('jukebox-station-name');
  const disc      = document.getElementById('jukebox-disc');
  const radioOpen = document.getElementById('radio-open-btn');
  if (!audio || !playBtn) return;

  const STATIONS = {
    lofi:     { name:'Lofi Chill',  url:'https://usa9.fastcast4u.com/proxy/jamz?mp=/1' },
    synth:    { name:'Synthwave',   url:'https://stream.nightride.fm/nightride.m4a' },
    chillhop: { name:'Chillhop',    url:'http://stream.zeno.fm/0r0xa792kwzuv' },
    jazz:     { name:'Smooth Jazz', url:'https://streams.calmradio.com/api/39/128/stream' },
    classic:  { name:'Classical',   url:'https://live.musopen.org:8085/streamvbr0' },
  };

  let playing = false;

  function loadStation() {
    const st = STATIONS[stSel.value];
    if (!st) return;
    if (stName) stName.textContent = st.name;
    audio.pause();
    audio.src = st.url;
    if (playing) audio.play().catch(() => {});
  }

  stSel.addEventListener('change', loadStation);

  playBtn.addEventListener('click', () => {
    if (!playing) {
      if (!audio.src || audio.src === location.href) loadStation();
      audio.play().then(() => {
        playing = true;
        playBtn.textContent = '⏸ Pause';
        if (disc) disc.classList.add('spinning');
      }).catch(() => {});
    } else {
      audio.pause();
      playing = false;
      playBtn.textContent = '▶ Play';
      if (disc) disc.classList.remove('spinning');
    }
  });

  // Remove old sidebar radio open btn if exists
  if (radioOpen) radioOpen.remove();
}

/* ── Welcome Modal ─────────────────────────────────────────── */
function initWelcomeModal() {
  const overlay  = document.getElementById('welcome-modal');
  const closeBtn = document.getElementById('welcome-close-btn');
  const tabs     = document.querySelectorAll('.modal-tab');
  const contents = document.querySelectorAll('.modal-tab-content');
  if (!overlay || !closeBtn) return;

  overlay.classList.remove('hidden');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('mtab-' + tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
  });

  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.add('hidden');
  });
}

/* ── Panic Key ─────────────────────────────────────────────── */
function initPanicKey() {
  const keySelect = document.getElementById('panic-key-select');
  const urlInput  = document.getElementById('panic-url-input');
  const testBtn   = document.getElementById('panic-test-btn');
  if (!keySelect || !urlInput) return;

  const savedKey = localStorage.getItem('frostos-panic-key') || 'Escape';
  const savedUrl = localStorage.getItem('frostos-panic-url') || 'https://www.google.com';
  keySelect.value = savedKey;
  urlInput.value  = savedUrl;

  keySelect.addEventListener('change', () => {
    localStorage.setItem('frostos-panic-key', keySelect.value);
  });
  urlInput.addEventListener('change', () => {
    localStorage.setItem('frostos-panic-url', urlInput.value || 'https://www.google.com');
  });
  if (testBtn) testBtn.addEventListener('click', triggerPanic);

  document.addEventListener('keydown', e => {
    const key = localStorage.getItem('frostos-panic-key') || 'Escape';
    if (e.key === key) triggerPanic();
  });
}

function triggerPanic() {
  const url = localStorage.getItem('frostos-panic-url') || 'https://www.google.com';
  window.location.replace(url);
}
