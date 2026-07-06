/* ── FrostOS ───────────────────────────────────────────────── */

/* Proxy registry — URL-prefix templates. Iframe src = prefix + encodeURIComponent(target).
   "direct" means load the target URL as-is (works for movie/game embed hosts). */
const PROXIES = [
  { id: "direct",   name: "Direct (no proxy)",  prefix: "",                                           ping: "https://www.google.com/generate_204" },
  { id: "duckduck", name: "DuckDuckGo Lite",    prefix: "https://duckduckgo.com/?q=!+",               ping: "https://duckduckgo.com/favicon.ico" },
  { id: "wayback",  name: "Wayback Machine",    prefix: "https://web.archive.org/web/2*/",            ping: "https://web.archive.org/favicon.ico" },
  { id: "googletr", name: "Google Translate",   prefix: "https://translate.google.com/translate?sl=auto&tl=en&u=", ping: "https://translate.google.com/favicon.ico" },
  { id: "12ft",     name: "12ft Reader",        prefix: "https://12ft.io/",                           ping: "https://12ft.io/favicon.ico" },
  { id: "croxy",    name: "CroxyProxy",         prefix: "https://www.croxyproxy.com/_public/servlet/direct?url=", ping: "https://www.croxyproxy.com/favicon.ico" },
];

let currentProxyId = localStorage.getItem("frostos-proxy") || "direct";
let byopPrefix     = localStorage.getItem("frostos-byop") || "";

function currentPrefix() {
  if (currentProxyId === "byop") return byopPrefix;
  const p = PROXIES.find(p => p.id === currentProxyId);
  return p ? p.prefix : "";
}
function proxify(target) {
  const pfx = currentPrefix();
  if (!pfx) return target;
  return pfx + encodeURIComponent(target);
}
function updateProxyStatus() {
  const label = document.getElementById("proxy-status-label");
  const sub   = document.getElementById("proxy-status-sub");
  if (currentProxyId === "byop") {
    label.textContent = "Proxy: Custom";
    sub.textContent = byopPrefix ? "Configured" : "Set URL below";
  } else {
    const p = PROXIES.find(p => p.id === currentProxyId);
    label.textContent = "Proxy: " + (p ? p.name : "Direct");
    sub.textContent = p && p.prefix ? "Active" : "Direct";
  }
}

/* ── Boot ─────────────────────────────────────────────────── */
const bootScreen = document.getElementById("boot-screen");
const bootBar    = document.getElementById("boot-bar");
const bootMsg    = document.getElementById("boot-msg");
const app        = document.getElementById("app");

const bootMessages = [
  "Loading FrostOS...",
  "Preparing Glacier Systems...",
  "Connecting to Arctic Network...",
  "Calibrating Aurora Display...",
];
let msgIdx = 0;
const msgInt = setInterval(() => { msgIdx = (msgIdx+1)%bootMessages.length; bootMsg.textContent = bootMessages[msgIdx]; }, 900);
let progress = 0;
const barInt = setInterval(() => {
  progress = Math.min(progress + Math.random()*15 + 6, 100);
  bootBar.style.width = progress + "%";
  if (progress >= 100) {
    clearInterval(barInt); clearInterval(msgInt);
    setTimeout(() => {
      bootScreen.classList.add("fade-out");
      setTimeout(() => { bootScreen.classList.add("hidden"); app.classList.remove("hidden"); spawnSnow(); }, 500);
    }, 300);
  }
}, 210);

function spawnSnow() {
  const c = document.getElementById("snow-container");
  for (let i=0;i<14;i++){
    const el = document.createElement("div");
    el.className = "snowflake"; el.textContent = "❄";
    const size = 8 + (i%3)*4;
    el.style.cssText = `left:${(i*7.3)%100}%;font-size:${size}px;animation-duration:${14+(i%5)*3}s;animation-delay:${i*1.3}s`;
    c.appendChild(el);
  }
}

/* ── Pages ────────────────────────────────────────────────── */
function showPage(id) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  const page = document.getElementById("page-"+id);
  const btn  = document.querySelector(`.nav-btn[data-page="${id}"]`);
  if (page) page.classList.add("active");
  if (btn)  btn.classList.add("active");
  if (id === "movies") loadMovies();
  if (id === "games")  ensureGames();
}
document.querySelectorAll(".nav-btn").forEach(b => b.addEventListener("click", () => showPage(b.dataset.page)));
document.querySelectorAll(".pixel-pill[data-page]").forEach(p => p.addEventListener("click", () => showPage(p.dataset.page)));

/* ── Movies ───────────────────────────────────────────────── */
const MOVIES_TARGET = "https://toustream.xyz";
function loadMovies() {
  const f = document.getElementById("movies-iframe");
  if (!f) return;
  const desired = proxify(MOVIES_TARGET);
  if (f.dataset.loadedFor !== desired) {
    f.src = desired;
    f.dataset.loadedFor = desired;
  }
}

/* ── Home search ──────────────────────────────────────────── */
const ENGINES = {
  google:     "https://www.google.com/search?q=",
  bing:       "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
};
function getEngine() { return ENGINES[localStorage.getItem("frostos-engine") || "google"] || ENGINES.google; }
function doHomeSearch() {
  const q = document.getElementById("home-search-input").value.trim();
  if (!q) return;
  showPage("browser");
  loadBrowserUrl(getEngine() + encodeURIComponent(q));
}
document.getElementById("home-search-btn").addEventListener("click", doHomeSearch);
document.getElementById("home-search-input").addEventListener("keydown", e => { if (e.key === "Enter") doHomeSearch(); });

/* ── Browser ──────────────────────────────────────────────── */
const browserAddr   = document.getElementById("browser-addr");
const browserIframe = document.getElementById("browser-iframe");
const browserPH     = document.getElementById("browser-placeholder");

function loadBrowserUrl(raw) {
  let url = raw.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url) && !url.startsWith("about:")) {
    url = getEngine() + encodeURIComponent(url);
  }
  browserAddr.value = url;
  browserIframe.src = proxify(url);
  browserPH.classList.add("hidden");
  browserIframe.classList.remove("hidden");
}
document.getElementById("go-btn").addEventListener("click", () => loadBrowserUrl(browserAddr.value));
browserAddr.addEventListener("keydown", e => { if (e.key === "Enter") loadBrowserUrl(browserAddr.value); });
document.getElementById("back-btn").addEventListener("click",   () => { try { browserIframe.contentWindow.history.back(); } catch{} });
document.getElementById("fwd-btn").addEventListener("click",    () => { try { browserIframe.contentWindow.history.forward(); } catch{} });
document.getElementById("reload-btn").addEventListener("click", () => { browserIframe.src = browserIframe.src; });

// Tabs (visual only — one shared iframe)
let tabCount = 1;
const tabStrip  = document.getElementById("browser-tabs");
const addTabBtn = document.getElementById("add-tab-btn");
function addTab() {
  tabCount++;
  const tab = document.createElement("div");
  tab.className = "b-tab"; tab.dataset.id = tabCount;
  tab.innerHTML = `<i class="fa-solid fa-snowflake"></i><span>New Tab</span><i class="fa-solid fa-xmark tab-close"></i>`;
  tabStrip.insertBefore(tab, addTabBtn);
  setActiveTab(tab);
}
function setActiveTab(tab) {
  tabStrip.querySelectorAll(".b-tab").forEach(t => t.classList.remove("active"));
  tab.classList.add("active");
  browserIframe.src = "about:blank";
  browserIframe.classList.add("hidden");
  browserPH.classList.remove("hidden");
  browserAddr.value = "https://";
}
tabStrip.addEventListener("click", e => {
  const tab = e.target.closest(".b-tab");
  const close = e.target.closest(".tab-close");
  if (close && tab) {
    const tabs = tabStrip.querySelectorAll(".b-tab");
    if (tabs.length <= 1) return;
    const wasActive = tab.classList.contains("active");
    tab.remove();
    if (wasActive) {
      const remain = tabStrip.querySelectorAll(".b-tab");
      if (remain.length) setActiveTab(remain[remain.length-1]);
    }
  } else if (tab) setActiveTab(tab);
});
addTabBtn.addEventListener("click", addTab);

/* ── Games ────────────────────────────────────────────────── */
let GAMES = null;
async function ensureGames() {
  if (GAMES) return;
  try {
    const res = await fetch("games.json");
    GAMES = await res.json();
  } catch { GAMES = []; }
  renderGames("");
  document.getElementById("games-search").addEventListener("input", e => renderGames(e.target.value));
}
function renderGames(q) {
  const grid = document.getElementById("games-grid");
  grid.innerHTML = "";
  const ql = q.trim().toLowerCase();
  const list = ql
    ? GAMES.filter(g => (g.title+" "+g.tags).toLowerCase().includes(ql))
    : GAMES;
  const frag = document.createDocumentFragment();
  list.forEach(g => {
    const c = document.createElement("div");
    c.className = "game-card";
    c.innerHTML = `<img loading="lazy" src="${g.image}" alt=""><div class="game-card-title">${escapeHtml(g.title)}</div>`;
    c.addEventListener("click", () => openGame(g));
    frag.appendChild(c);
  });
  grid.appendChild(frag);
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:rgba(244,250,252,0.35);font-family:'VT323',monospace;font-size:20px">No games match "${escapeHtml(q)}"</div>`;
  }
}
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c])); }

const gameModal = document.getElementById("game-modal");
const gameIframe = document.getElementById("game-iframe");
const gameTitle  = document.getElementById("game-modal-title");
function openGame(g) {
  gameTitle.textContent = g.title;
  gameIframe.src = proxify(g.embed);
  gameModal.classList.remove("hidden");
}
document.getElementById("game-modal-close").addEventListener("click", () => {
  gameModal.classList.add("hidden");
  gameIframe.src = "about:blank";
});
gameModal.addEventListener("click", e => {
  if (e.target === gameModal) { gameModal.classList.add("hidden"); gameIframe.src = "about:blank"; }
});

/* ── Settings ─────────────────────────────────────────────── */
// Cloak
const cloakToggle = document.getElementById("tab-cloak-toggle");
const cloakOpts   = document.getElementById("cloak-options");
const cloakSelect = document.getElementById("cloak-select");
const cloakData = {
  none:      { title: "FrostOS",          icon: "penguin.svg" },
  google:    { title: "Google",           icon: "https://www.google.com/favicon.ico" },
  drive:     { title: "Google Drive",     icon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png" },
  classroom: { title: "Google Classroom", icon: "https://ssl.gstatic.com/classroom/favicon.png" },
  canvas:    { title: "Canvas",           icon: "https://du11hjcvx0ubn.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
  gmail:     { title: "Gmail",            icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
};
function applyCloak(v){
  const d = cloakData[v] || cloakData.none;
  document.title = d.title;
  let link = document.querySelector("link[rel='icon']");
  if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
  link.href = d.icon;
}
cloakToggle.addEventListener("change", () => {
  if (cloakToggle.checked) { cloakOpts.classList.remove("hidden"); applyCloak(cloakSelect.value); }
  else { cloakOpts.classList.add("hidden"); applyCloak("none"); }
});
cloakSelect.addEventListener("change", () => applyCloak(cloakSelect.value));

// Engine
const engineSelect = document.getElementById("engine-select");
engineSelect.value = localStorage.getItem("frostos-engine") || "google";
engineSelect.addEventListener("change", () => localStorage.setItem("frostos-engine", engineSelect.value));

// Proxy select
const proxySelect = document.getElementById("proxy-select");
const byopRow     = document.getElementById("byop-row");
const byopInput   = document.getElementById("byop-input");
function populateProxySelect() {
  proxySelect.innerHTML = "";
  PROXIES.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id; o.textContent = p.name;
    proxySelect.appendChild(o);
  });
  const custom = document.createElement("option");
  custom.value = "byop"; custom.textContent = "Custom (BYOP)";
  proxySelect.appendChild(custom);
  proxySelect.value = currentProxyId;
  byopRow.classList.toggle("hidden", currentProxyId !== "byop");
  byopInput.value = byopPrefix;
}
populateProxySelect();
updateProxyStatus();

proxySelect.addEventListener("change", () => {
  currentProxyId = proxySelect.value;
  localStorage.setItem("frostos-proxy", currentProxyId);
  byopRow.classList.toggle("hidden", currentProxyId !== "byop");
  updateProxyStatus();
});
byopInput.addEventListener("change", () => {
  byopPrefix = byopInput.value.trim();
  localStorage.setItem("frostos-byop", byopPrefix);
  updateProxyStatus();
});

// Health check + pick best
const healthList = document.getElementById("proxy-health-list");
function pingProxy(p) {
  return new Promise(resolve => {
    if (!p.ping) return resolve({ id: p.id, name: p.name, ok: true, ms: 0 });
    const img = new Image();
    const start = performance.now();
    const done = ok => { clearTimeout(t); resolve({ id: p.id, name: p.name, ok, ms: Math.round(performance.now()-start) }); };
    const t = setTimeout(() => done(false), 5000);
    img.onload = () => done(true);
    img.onerror = () => done(true); // opaque cross-origin still means "reachable"
    img.src = p.ping + (p.ping.includes("?") ? "&" : "?") + "_=" + Date.now();
  });
}
async function healthCheck() {
  healthList.innerHTML = `<div class="proxy-health-row"><span class="name">Checking...</span></div>`;
  const results = await Promise.all(PROXIES.map(pingProxy));
  healthList.innerHTML = "";
  results.forEach(r => {
    const row = document.createElement("div");
    row.className = "proxy-health-row";
    const cls = !r.ok ? "fail" : r.ms > 1500 ? "slow" : "ok";
    const label = !r.ok ? "offline" : r.ms + " ms";
    row.innerHTML = `<span class="name">${escapeHtml(r.name)}</span><span class="ping ${cls}">${label}</span>`;
    healthList.appendChild(row);
  });
  return results;
}
async function pickBest() {
  const results = await healthCheck();
  const best = results.filter(r => r.ok && r.id !== "direct").sort((a,b) => a.ms - b.ms)[0];
  if (best) {
    currentProxyId = best.id;
    localStorage.setItem("frostos-proxy", currentProxyId);
    proxySelect.value = currentProxyId;
    byopRow.classList.add("hidden");
    updateProxyStatus();
  }
}
document.getElementById("proxy-health-btn").addEventListener("click", healthCheck);
document.getElementById("proxy-best-btn").addEventListener("click", pickBest);
