/* ── FrostOS script.js ───────────────────────────────────── */

/* ── Boot sequence ─────────────────────────────────────────── */
const bootScreen = document.getElementById('boot-screen');
const bootBar    = document.getElementById('boot-bar');
const bootMsg    = document.getElementById('boot-msg');
const app        = document.getElementById('app');

const bootMessages = [
  'Loading FrostOS...',
  'Preparing Glacier Systems...',
  'Connecting to Arctic Network...',
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
}

// Sidebar nav
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => showPage(btn.dataset.page));
});

// Home quick-link pills
document.querySelectorAll('.pill[data-page]').forEach(pill => {
  pill.addEventListener('click', () => showPage(pill.dataset.page));
});

/* ── Home search ──────────────────────────────────────────── */
const homeInput  = document.getElementById('home-search-input');
const homeSearchBtn = document.getElementById('home-search-btn');

function doHomeSearch() {
  const q = homeInput.value.trim();
  if (!q) return;
  const engine = localStorage.getItem('frostos-engine') || 'google';
  const engines = {
    google:    'https://www.google.com/search?q=',
    bing:      'https://www.bing.com/search?q=',
    duckduckgo:'https://duckduckgo.com/?q=',
  };
  const url = engines[engine] + encodeURIComponent(q);
  // Navigate in browser tab
  showPage('browser');
  loadBrowserUrl(url);
}
homeSearchBtn.addEventListener('click', doHomeSearch);
homeInput.addEventListener('keydown', e => { if (e.key === 'Enter') doHomeSearch(); });

/* ── Browser ──────────────────────────────────────────────── */
const browserAddr   = document.getElementById('browser-addr');
const browserIframe = document.getElementById('browser-iframe');
const browserPH     = document.getElementById('browser-placeholder');
const goBtn         = document.getElementById('go-btn');
const backBtn       = document.getElementById('back-btn');
const fwdBtn        = document.getElementById('fwd-btn');
const reloadBtn     = document.getElementById('reload-btn');

function loadBrowserUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url) && !url.startsWith('about:')) {
    const engine = localStorage.getItem('frostos-engine') || 'google';
    const engines = {
      google:    'https://www.google.com/search?q=',
      bing:      'https://www.bing.com/search?q=',
      duckduckgo:'https://duckduckgo.com/?q=',
    };
    url = engines[engine] + encodeURIComponent(url);
  }
  browserAddr.value = url;
  browserIframe.src = url;
  browserPH.classList.add('hidden');
  browserIframe.classList.remove('hidden');
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
  // reset viewport
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
  } else if (tab) {
    setActiveTab(tab);
  }
});

addTabBtn.addEventListener('click', addTab);

/* ── Settings ─────────────────────────────────────────────── */

// Tab cloaking
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
  if (cloakToggle.checked) {
    cloakOptions.classList.remove('hidden');
    applyCloak(cloakSelect.value);
  } else {
    cloakOptions.classList.add('hidden');
    applyCloak('none');
  }
});
cloakSelect.addEventListener('change', () => applyCloak(cloakSelect.value));

// Search engine
const engineSelect = document.getElementById('engine-select');
engineSelect.addEventListener('change', () => {
  localStorage.setItem('frostos-engine', engineSelect.value);
});
const savedEngine = localStorage.getItem('frostos-engine');
if (savedEngine) engineSelect.value = savedEngine;

// Proxy / BYOP
const proxySelect = document.getElementById('proxy-select');
const byopRow     = document.getElementById('byop-row');
proxySelect.addEventListener('change', () => {
  byopRow.classList.toggle('hidden', proxySelect.value !== 'byop');
});
