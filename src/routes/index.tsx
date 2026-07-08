import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";

export const Route = createFileRoute("/")({
  component: FrostOS,
});

type PageId = "home" | "movies" | "games" | "browser" | "settings";
type Tab = { id: number; title: string };

const ENGINES: Record<string, string> = {
  google: "https://www.google.com/search?q=",
  bing: "https://www.bing.com/search?q=",
  duckduckgo: "https://duckduckgo.com/?q=",
};

const CLOAK_DATA: Record<string, { title: string; icon: string }> = {
  none: { title: "FrostOS", icon: "/favicon.ico" },
  google: { title: "Google", icon: "https://www.google.com/favicon.ico" },
  drive: { title: "Google Drive", icon: "https://ssl.gstatic.com/docs/doclist/images/drive_2022q3_32dp.png" },
  classroom: { title: "Google Classroom", icon: "https://ssl.gstatic.com/classroom/favicon.png" },
  canvas: { title: "Canvas", icon: "https://du11hjcvx0ubn.cloudfront.net/dist/images/favicon-e10d657a73.ico" },
  gmail: { title: "Gmail", icon: "https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico" },
};

/* ── Proxy engines ─────────────────────────── */
type ProxyEngine = "cors" | "ultraviolet" | "rammerhead" | "wisp" | "dipnix";

const PROXY_ENGINES: { id: ProxyEngine; label: string; defaultBackend: string; desc: string }[] = [
  { id: "cors", label: "Simple CORS Wrapper", defaultBackend: "https://corsproxy.io/?url=", desc: "Fast fallback for many sites" },
  { id: "ultraviolet", label: "Ultraviolet", defaultBackend: "https://tomp.app/", desc: "Full web proxy (needs UV/TOMP backend)" },
  { id: "rammerhead", label: "Rammerhead", defaultBackend: "https://rammerhead.org/", desc: "Session-based proxy" },
  { id: "wisp", label: "Wisp-Proxy", defaultBackend: "https://tomp.app/", desc: "Wisp protocol gateway" },
  { id: "dipnix", label: "Dipnix", defaultBackend: "https://api.allorigins.win/raw?url=", desc: "URL-wrap proxy service" },
];

function buildProxyUrl(engine: ProxyEngine, backend: string, target: string): string {
  const b = backend.trim();
  const t = target.trim();
  switch (engine) {
    case "ultraviolet": {
      const base = b.endsWith("/") ? b : b + "/";
      // Basic XOR-ish encode (fallback if UV codec absent): reversible via same fn
      const enc = encodeURIComponent(t);
      return base + "uv/service/" + enc;
    }
    case "rammerhead":
    case "cors":
    case "wisp":
    case "dipnix":
    default: {
      const sep = b.includes("?") || b.endsWith("=") || b.endsWith("?") || b.endsWith("/") ? "" : "";
      return b + sep + encodeURIComponent(t);
    }
  }
}

/* ── Themes ─────────────────────────── */
const THEMES: Record<string, { navy: string; navy2: string; cyan: string; green: string; violet: string; ice: string }> = {
  arctic: { navy: "#0A1628", navy2: "#0F2138", cyan: "#4FD1E0", green: "#54E0A8", violet: "#9B8CF2", ice: "#BFE3F0" },
  lava:   { navy: "#1a0a08", navy2: "#2a1410", cyan: "#FF6A3D", green: "#FFC93C", violet: "#FF3D68", ice: "#FFD7B5" },
  forest: { navy: "#0a1a10", navy2: "#12261a", cyan: "#7CE577", green: "#A0F0A0", violet: "#B8F0C0", ice: "#DFF7DF" },
  night:  { navy: "#050510", navy2: "#0d0d24", cyan: "#B388FF", green: "#82B1FF", violet: "#FF80AB", ice: "#E1BEE7" },
  candy:  { navy: "#1a0f26", navy2: "#26143a", cyan: "#FF7ED4", green: "#7EFFD4", violet: "#FFD97E", ice: "#FFE0F5" },
};

/* ── Radio stations ─────────────────────────── */
const RADIO_STATIONS = [
  { id: "lofi",     name: "Lofi Chill",   url: "https://usa9.fastcast4u.com/proxy/jamz?mp=/1" },
  { id: "synth",    name: "Synthwave",    url: "https://stream.nightride.fm/nightride.m4a" },
  { id: "chillhop", name: "Chillhop",     url: "http://stream.zeno.fm/0r0xa792kwzuv" },
  { id: "jazz",     name: "Smooth Jazz",  url: "https://streams.calmradio.com/api/39/128/stream" },
  { id: "classic",  name: "Classical",    url: "https://live.musopen.org:8085/streamvbr0" },
];

/* ── Games loaded from public/games.json (OnlineGames.io library) ─────────────────────────── */
type Game = { title: string; url: string; img: string };

function PixelPenguin({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" shapeRendering="crispEdges">
      <rect x="16" y="20" width="32" height="40" fill="#0F2138" />
      <rect x="20" y="28" width="24" height="28" fill="#F4FAFC" />
      <rect x="18" y="4" width="28" height="22" fill="#0F2138" />
      <rect x="22" y="8" width="20" height="14" fill="#F4FAFC" />
      <rect x="22" y="10" width="6" height="6" fill="#0A1628" />
      <rect x="36" y="10" width="6" height="6" fill="#0A1628" />
      <rect x="26" y="18" width="12" height="6" fill="#F5A623" />
      <rect x="10" y="24" width="6" height="20" fill="#0F2138" />
      <rect x="48" y="24" width="6" height="20" fill="#0F2138" />
      <rect x="20" y="58" width="10" height="6" fill="#F5A623" />
      <rect x="34" y="58" width="10" height="6" fill="#F5A623" />
    </svg>
  );
}

/* Fallback pixel tile if a game image fails */
function GameFallback({ title }: { title: string }) {
  const letter = title.charAt(0).toUpperCase();
  return (
    <div className="game-fallback">
      <span>{letter}</span>
    </div>
  );
}

function FrostOS() {
  const [booting, setBooting] = useState(true);
  const [bootProgress, setBootProgress] = useState(0);
  const [bootMsgIdx, setBootMsgIdx] = useState(0);
  const [fadeBoot, setFadeBoot] = useState(false);

  const [page, setPage] = useState<PageId>("home");

  const [homeQuery, setHomeQuery] = useState("");
  const [engine, setEngine] = useState<string>("duckduckgo");

  const [moviesLoaded, setMoviesLoaded] = useState(false);

  // Browser
  const [tabs, setTabs] = useState<Tab[]>([{ id: 1, title: "New Tab" }]);
  const [activeTab, setActiveTab] = useState(1);
  const [addr, setAddr] = useState("https://");
  const [browserUrl, setBrowserUrl] = useState<string | null>(null);
  const browserIframeRef = useRef<HTMLIFrameElement | null>(null);
  const tabCounterRef = useRef(1);

  // Settings — cloak
  const [cloak, setCloak] = useState(false);
  const [cloakValue, setCloakValue] = useState("none");

  // Settings — proxy
  const [proxyEngine, setProxyEngine] = useState<ProxyEngine>("cors");
  const [proxyBackend, setProxyBackend] = useState<string>(PROXY_ENGINES[0].defaultBackend);

  // Settings — theme
  const [theme, setTheme] = useState<string>("arctic");

  // Games (loaded from /games.json)
  const [games, setGames] = useState<Game[]>([]);
  const [gameQuery, setGameQuery] = useState("");
  const filteredGames = useMemo(
    () => games.filter((g) => g.title.toLowerCase().includes(gameQuery.toLowerCase())),
    [games, gameQuery],
  );

  // FrostRadio
  const [radioOpen, setRadioOpen] = useState(false);
  const [radioMinimized, setRadioMinimized] = useState(false);
  const [radioStation, setRadioStation] = useState(RADIO_STATIONS[0].id);
  const [radioPlaying, setRadioPlaying] = useState(false);
  const [radioVolume, setRadioVolume] = useState(0.6);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const BOOT_MSGS = [
    "Loading FrostOS...",
    "Preparing Glacier Systems...",
    "Connecting to Arctic Network...",
    "Calibrating Aurora Display...",
  ];

  /* boot */
  useEffect(() => {
    if (!booting) return;
    const msg = setInterval(() => setBootMsgIdx((i) => (i + 1) % BOOT_MSGS.length), 900);
    const bar = setInterval(() => {
      setBootProgress((p) => {
        const next = Math.min(p + Math.random() * 15 + 6, 100);
        if (next >= 100) {
          clearInterval(bar);
          clearInterval(msg);
          setTimeout(() => setFadeBoot(true), 300);
          setTimeout(() => setBooting(false), 800);
        }
        return next;
      });
    }, 210);
    return () => { clearInterval(msg); clearInterval(bar); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* load prefs */
  useEffect(() => {
    try {
      const e = localStorage.getItem("frostos-engine"); if (e) setEngine(e);
      const pe = localStorage.getItem("frostos-proxy-engine") as ProxyEngine | null;
      const pb = localStorage.getItem("frostos-proxy-backend");
      if (pe) setProxyEngine(pe);
      if (pb) setProxyBackend(pb);
      const th = localStorage.getItem("frostos-theme"); if (th) setTheme(th);
    } catch {}
  }, []);

  /* load games from public/games.json */
  useEffect(() => {
    fetch("/games.json")
      .then((r) => r.json())
      .then((data: Array<{ title: string; embed: string; image: string }>) => {
        setGames(data.map((g) => ({ title: g.title, url: g.embed, img: g.image })));
      })
      .catch(() => setGames([]));
  }, []);

  /* persist prefs */
  useEffect(() => { try { localStorage.setItem("frostos-proxy-engine", proxyEngine); } catch {} }, [proxyEngine]);
  useEffect(() => { try { localStorage.setItem("frostos-proxy-backend", proxyBackend); } catch {} }, [proxyBackend]);
  useEffect(() => { try { localStorage.setItem("frostos-theme", theme); } catch {} }, [theme]);

  /* apply theme */
  useEffect(() => {
    const t = THEMES[theme] || THEMES.arctic;
    const root = document.documentElement.style;
    root.setProperty("--navy", t.navy);
    root.setProperty("--navy2", t.navy2);
    root.setProperty("--cyan", t.cyan);
    root.setProperty("--green", t.green);
    root.setProperty("--violet", t.violet);
    root.setProperty("--ice", t.ice);
    root.setProperty("--pixel-border", t.cyan + "80");
  }, [theme]);

  /* cloak */
  useEffect(() => {
    const d = CLOAK_DATA[cloak ? cloakValue : "none"];
    if (typeof document === "undefined") return;
    document.title = d.title;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) { link = document.createElement("link"); link.rel = "icon"; document.head.appendChild(link); }
    link.href = d.icon;
  }, [cloak, cloakValue]);

  /* radio control */
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = radioVolume;
  }, [radioVolume]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    const st = RADIO_STATIONS.find((s) => s.id === radioStation);
    if (!st) return;
    audioRef.current.src = st.url;
    if (radioPlaying) audioRef.current.play().catch(() => setRadioPlaying(false));
  }, [radioStation]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (radioPlaying) audioRef.current.play().catch(() => setRadioPlaying(false));
    else audioRef.current.pause();
  }, [radioPlaying]);

  /* snow */
  const snowflakes = Array.from({ length: 14 }, (_, i) => {
    const size = 8 + (i % 3) * 4;
    return (
      <div key={i} className="snowflake" style={{
        left: `${(i * 7.3) % 100}%`, fontSize: `${size}px`,
        animationDuration: `${14 + (i % 5) * 3}s`, animationDelay: `${i * 1.3}s`,
      }}>❄</div>
    );
  });

  function goPage(id: PageId) {
    setPage(id);
    if (id === "movies") setMoviesLoaded(true);
  }

  function proxify(url: string): string {
    return buildProxyUrl(proxyEngine, proxyBackend, url);
  }

  function normalizeInput(input: string): string {
    const s = input.trim();
    if (!s) return "";
    if (/^https?:\/\//i.test(s)) return s;
    if (/^[a-z0-9-]+\.[a-z]{2,}(\/.*)?$/i.test(s)) return "https://" + s;
    return ENGINES[engine] + encodeURIComponent(s);
  }

  function doHomeSearch() {
    const url = normalizeInput(homeQuery);
    if (!url) return;
    setPage("browser");
    loadBrowserUrl(url);
  }

  function loadBrowserUrl(rawUrl: string) {
    const url = normalizeInput(rawUrl);
    if (!url) return;
    setAddr(url);
    setBrowserUrl(proxify(url));
  }

  function addTab() {
    tabCounterRef.current += 1;
    const id = tabCounterRef.current;
    setTabs((t) => [...t, { id, title: "New Tab" }]);
    setActiveTab(id);
    setBrowserUrl(null);
    setAddr("https://");
  }
  function selectTab(id: number) { setActiveTab(id); setBrowserUrl(null); setAddr("https://"); }
  function closeTab(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setTabs((t) => {
      if (t.length <= 1) return t;
      const next = t.filter((x) => x.id !== id);
      if (id === activeTab) {
        const last = next[next.length - 1];
        setActiveTab(last.id); setBrowserUrl(null); setAddr("https://");
      }
      return next;
    });
  }

  // Game windows (multi-tasking overlays; independent of browser)
  type GameWindow = { id: number; title: string; url: string; minimized: boolean };
  const [gameWindows, setGameWindows] = useState<GameWindow[]>([]);
  const gameCounterRef = useRef(0);

  function playGame(game: { title: string; url: string }) {
    // Prevent duplicates: focus existing window if same URL already open
    const existing = gameWindows.find((w) => w.url === game.url);
    if (existing) {
      setGameWindows((ws) => ws.map((w) => (w.id === existing.id ? { ...w, minimized: false } : w)));
      return;
    }
    gameCounterRef.current += 1;
    const id = gameCounterRef.current;
    setGameWindows((ws) => [...ws, { id, title: game.title, url: game.url, minimized: false }]);
  }
  function closeGameWindow(id: number) {
    setGameWindows((ws) => ws.filter((w) => w.id !== id));
  }
  function toggleMinimizeGame(id: number) {
    setGameWindows((ws) => ws.map((w) => (w.id === id ? { ...w, minimized: !w.minimized } : w)));
  }

  const moviesTarget = "https://toustream.xyz";
  const moviesSrc = proxify(moviesTarget);

  return (
    <>
      {booting && (
        <div id="boot-screen" className={fadeBoot ? "fade-out" : ""}>
          <div id="boot-penguin"><PixelPenguin size={80} /></div>
          <h1 id="boot-title">FROST<span>OS</span></h1>
          <div id="boot-bar-wrap"><div id="boot-bar" style={{ width: `${bootProgress}%` }} /></div>
          <p id="boot-msg">{BOOT_MSGS[bootMsgIdx]}</p>
        </div>
      )}

      <div id="snow-container">{!booting && snowflakes}</div>

      <div id="app" className={booting ? "hidden" : ""}>
        <aside id="sidebar">
          <div className="sidebar-brand">
            <PixelPenguin size={28} />
            <span className="brand-name">Frost<span className="accent">OS</span></span>
          </div>
          <nav className="sidebar-nav">
            {(
              [
                ["home", "fa-house", "Home"],
                ["movies", "fa-film", "Movies"],
                ["games", "fa-gamepad", "Games"],
                ["browser", "fa-globe", "Browser"],
                ["settings", "fa-gear", "Settings"],
              ] as [PageId, string, string][]
            ).map(([id, icon, label]) => (
              <button key={id} className={`nav-btn ${page === id ? "active" : ""}`} onClick={() => goPage(id)}>
                <i className={`fa-solid ${icon}`}></i><span>{label}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar-footer">
            <button className="nav-btn" onClick={() => { setRadioOpen(true); setRadioMinimized(false); }}>
              <i className="fa-solid fa-radio"></i><span>FrostRadio</span>
            </button>
            <div className="pixel-card status-pill">
              <span className="status-dot"></span>
              <div>
                <div className="status-label">Proxy: {PROXY_ENGINES.find(p => p.id === proxyEngine)?.label}</div>
                <div className="status-sub">Connected</div>
              </div>
            </div>
          </div>
        </aside>

        <div id="main">
          <header id="topbar">
            <div className="topbar-status">
              <span className="status-dot"></span>
              Arctic Network Active
            </div>
          </header>

          <main id="viewport">
            {/* HOME */}
            <section id="page-home" className={`page ${page === "home" ? "active" : ""}`}>
              <div className="home-center">
                <div className="home-logo penguin-bob">
                  <PixelPenguin size={72} />
                  <h1 className="home-title">Frost<span>OS</span></h1>
                </div>
                <div className="pixel-search-wrap">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" placeholder="Search the web" value={homeQuery}
                    onChange={(e) => setHomeQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && doHomeSearch()} />
                  <button id="home-search-btn" onClick={doHomeSearch}><i className="fa-solid fa-arrow-right"></i></button>
                </div>
                <div className="home-pills">
                  <button className="pixel-pill" onClick={() => goPage("movies")}><i className="fa-solid fa-film"></i> Movies</button>
                  <button className="pixel-pill" onClick={() => goPage("games")}><i className="fa-solid fa-gamepad"></i> Games</button>
                  <button className="pixel-pill" onClick={() => goPage("browser")}><i className="fa-solid fa-globe"></i> Browser</button>
                  <button className="pixel-pill" onClick={() => goPage("settings")}><i className="fa-solid fa-gear"></i> Settings</button>
                </div>
                <div className="pixel-card home-bulletin">
                  <div className="bulletin-col">
                    <div className="bulletin-label cyan">Frost Bulletin</div>
                    <p>Arctic Network active.<br />Enjoy the site! 🐧</p>
                  </div>
                  <div className="bulletin-divider"></div>
                  <div className="bulletin-col">
                    <div className="bulletin-label green">Status</div>
                    <p><span className="status-dot inline"></span> All systems online</p>
                  </div>
                </div>
              </div>
            </section>

            {/* MOVIES */}
            <section id="page-movies" className={`page ${page === "movies" ? "active" : ""}`}>
              <div className="page-header">
                <div className="eyebrow purple">Movies</div>
                <h2>Browse &amp; Watch</h2>
              </div>
              <div className="pixel-card iframe-shell">
                {!moviesLoaded ? (
                  <div className="iframe-placeholder">
                    <i className="fa-solid fa-film"></i>
                    <p>Movie player goes here.</p>
                    <small>Configure a source in Settings → Proxy</small>
                  </div>
                ) : (<iframe src={moviesSrc} allowFullScreen title="Movies" />)}
              </div>
            </section>

            {/* GAMES */}
            <section id="page-games" className={`page ${page === "games" ? "active" : ""}`}>
              <div className="page-header">
                <div className="eyebrow green">Games</div>
                <h2>Frost Arcade</h2>
              </div>
              <div className="games-toolbar">
                <div className="pixel-search-wrap games-search">
                  <i className="fa-solid fa-magnifying-glass"></i>
                  <input type="text" placeholder="Search games..." value={gameQuery}
                    onChange={(e) => setGameQuery(e.target.value)} />
                </div>
              </div>
              <div className="games-grid">
                {filteredGames.map((g) => (
                  <button key={g.title} className="game-card pixel-card" onClick={() => playGame(g)}>
                    <div className="game-thumb">
                      <img src={g.img} alt={g.title} loading="lazy"
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      <GameFallback title={g.title} />
                    </div>
                    <div className="game-title">{g.title}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* BROWSER */}
            <section id="page-browser" className={`page ${page === "browser" ? "active" : ""}`}>
              <div className="page-header">
                <div className="eyebrow cyan">Browser</div>
                <h2>Frost Browser</h2>
              </div>
              <div className="pixel-card browser-shell">
                <iframe
                  id="browser-iframe"
                  ref={browserIframeRef}
                  src="/gust.html"
                  title="Frost Browser (GUST)"
                  allow="clipboard-read; clipboard-write; fullscreen"
                  style={{ width: "100%", height: "100%", border: 0, background: "var(--navy)" }}
                />
              </div>
            </section>

            {/* SETTINGS */}
            <section id="page-settings" className={`page ${page === "settings" ? "active" : ""}`}>
              <div className="page-header">
                <div className="eyebrow green">Preferences</div>
                <h2>Settings</h2>
              </div>
              <div className="settings-grid">
                <div className="pixel-card settings-card">
                  <div className="settings-card-title"><i className="fa-solid fa-sliders"></i> General</div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <div className="setting-name">Tab Cloaking</div>
                      <div className="setting-desc">Disguise the browser tab</div>
                    </div>
                    <label className="toggle">
                      <input type="checkbox" checked={cloak} onChange={(e) => setCloak(e.target.checked)} />
                      <span className="slider"></span>
                    </label>
                  </div>
                  {cloak && (
                    <div className="setting-row">
                      <select className="frost-select" value={cloakValue} onChange={(e) => setCloakValue(e.target.value)}>
                        <option value="none">Disabled</option>
                        <option value="google">Google Search</option>
                        <option value="drive">Google Drive</option>
                        <option value="classroom">Google Classroom</option>
                        <option value="canvas">Canvas LMS</option>
                        <option value="gmail">Gmail</option>
                      </select>
                    </div>
                  )}
                  <div className="setting-row">
                    <div className="setting-info">
                      <div className="setting-name">Search Engine</div>
                      <div className="setting-desc">Default for home search</div>
                    </div>
                    <select className="frost-select" value={engine}
                      onChange={(e) => { setEngine(e.target.value); try { localStorage.setItem("frostos-engine", e.target.value); } catch {} }}>
                      <option value="duckduckgo">DuckDuckGo</option>
                      <option value="google">Google</option>
                      <option value="bing">Bing</option>
                    </select>
                  </div>
                </div>

                {/* Proxy */}
                <div className="pixel-card settings-card">
                  <div className="settings-card-title"><i className="fa-solid fa-network-wired"></i> Proxy Engine</div>
                  <div className="setting-row">
                    <div className="setting-info">
                      <div className="setting-name">Engine</div>
                      <div className="setting-desc">{PROXY_ENGINES.find(p => p.id === proxyEngine)?.desc}</div>
                    </div>
                    <select className="frost-select" value={proxyEngine}
                      onChange={(e) => {
                        const ne = e.target.value as ProxyEngine;
                        setProxyEngine(ne);
                        const def = PROXY_ENGINES.find(p => p.id === ne)?.defaultBackend || "";
                        setProxyBackend(def);
                      }}>
                      {PROXY_ENGINES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                  </div>
                  <div className="setting-row" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                    <div className="setting-info">
                      <div className="setting-name">Proxy Backend URL</div>
                      <div className="setting-desc">Public gateway or your own server</div>
                    </div>
                    <input type="text" className="frost-input" placeholder="https://corsproxy.io/?url="
                      value={proxyBackend} onChange={(e) => setProxyBackend(e.target.value)} />
                    <div className="setting-desc" style={{ fontSize: 13, opacity: 0.75 }}>
                      Tip: try free open-source bare servers like <code>https://tomp.app</code> or{" "}
                      <code>https://api.allorigins.win/raw?url=</code> for Ultraviolet/Wisp modes.
                    </div>
                    <button className="pixel-btn" style={{ alignSelf: "flex-start" }} onClick={() => {
                      const def = PROXY_ENGINES.find(p => p.id === proxyEngine)?.defaultBackend || "";
                      setProxyBackend(def);
                    }}>Reset to Default</button>
                  </div>
                </div>

                {/* Theme */}
                <div className="pixel-card settings-card">
                  <div className="settings-card-title"><i className="fa-solid fa-palette"></i> Theme</div>
                  <div className="theme-grid">
                    {Object.entries(THEMES).map(([key, t]) => (
                      <button key={key} className={`theme-swatch ${theme === key ? "active" : ""}`}
                        onClick={() => setTheme(key)}>
                        <div className="theme-preview" style={{ background: t.navy }}>
                          <span style={{ background: t.cyan }} />
                          <span style={{ background: t.green }} />
                          <span style={{ background: t.violet }} />
                        </div>
                        <div className="theme-name">{key}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Account */}
                <div className="pixel-card settings-card">
                  <div className="settings-card-title"><i className="fa-solid fa-user"></i> Account</div>
                  <div className="account-block">
                    <div className="account-avatar"><PixelPenguin size={32} /></div>
                    <div>
                      <div className="account-name">Guest Penguin</div>
                      <div className="account-sub">Not signed in</div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>

      {/* FrostRadio player */}
      {/* Game Windows — floating multi-tasking overlays */}
      {gameWindows.length > 0 && (
        <div className="game-windows-layer">
          {gameWindows.map((gw, idx) => (
            <div key={gw.id} className={`game-window ${gw.minimized ? "minimized" : ""}`}
              style={{ top: `${60 + idx * 30}px`, left: `${120 + idx * 40}px` }}>
              <div className="gw-header">
                <div className="gw-title"><i className="fa-solid fa-gamepad"></i> {gw.title}</div>
                <div className="gw-actions">
                  <button className="fr-icon-btn" title="Minimize" onClick={() => toggleMinimizeGame(gw.id)}>
                    <i className={`fa-solid ${gw.minimized ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                  </button>
                  <button className="fr-icon-btn" title="Close" onClick={() => closeGameWindow(gw.id)}>
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              {!gw.minimized && (
                <div className="gw-body">
                  <iframe src={gw.url} title={gw.title} allow="autoplay; fullscreen; gamepad"
                    sandbox="allow-forms allow-scripts allow-same-origin allow-popups allow-modals allow-pointer-lock" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {radioOpen && (
        <div className={`frost-radio ${radioMinimized ? "minimized" : ""}`}>
          <audio ref={audioRef} preload="none" />
          <div className="fr-header">
            <div className="fr-title">
              <i className="fa-solid fa-radio"></i>
              <span>FrostRadio</span>
              {radioPlaying && <span className="fr-live">● LIVE</span>}
            </div>
            <div className="fr-header-actions">
              <button className="fr-icon-btn" onClick={() => setRadioMinimized(m => !m)} title="Minimize">
                <i className={`fa-solid ${radioMinimized ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
              </button>
              <button className="fr-icon-btn" onClick={() => { setRadioPlaying(false); setRadioOpen(false); }} title="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          {!radioMinimized && (
            <div className="fr-body">
              <select className="frost-select" value={radioStation}
                onChange={(e) => setRadioStation(e.target.value)}>
                {RADIO_STATIONS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <div className="fr-controls">
                <button className="pixel-btn" onClick={() => setRadioPlaying(p => !p)}>
                  <i className={`fa-solid ${radioPlaying ? "fa-pause" : "fa-play"}`}></i>
                  {" "}{radioPlaying ? "Pause" : "Play"}
                </button>
                <div className="fr-vol">
                  <i className="fa-solid fa-volume-low"></i>
                  <input type="range" min={0} max={1} step={0.05} value={radioVolume}
                    onChange={(e) => setRadioVolume(parseFloat(e.target.value))} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
