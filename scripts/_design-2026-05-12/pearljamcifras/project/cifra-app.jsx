// ===== APP PRINCIPAL =====
const { useState, useEffect, useRef, useMemo, useCallback } = React;

// Logo Pearl Jam (stickman dentro de um circulo, versao adesivo)
function PJLogo({ size = 28, color = "#f5efe3" }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-label="Pearl Jam">
      <circle cx="50" cy="50" r="44" fill="none" stroke={color} strokeWidth="3" />
      <circle cx="50" cy="32" r="7" fill={color} />
      <path d="M 50 40 L 50 65 M 32 50 L 68 50 M 50 65 L 36 88 M 50 65 L 64 88"
        stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// Icones inline (minimo)
const Ic = {
  Play:    (p) => <svg width="20" height="20" viewBox="0 0 24 24" {...p}><path d="M7 5v14l12-7z" fill="currentColor"/></svg>,
  Pause:   (p) => <svg width="20" height="20" viewBox="0 0 24 24" {...p}><path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor"/></svg>,
  Prev:    (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M6 6h2v12H6zM10 12l10-7v14z" fill="currentColor"/></svg>,
  Vol:     (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M3 10v4h4l5 5V5L7 10zM16 12a4 4 0 0 0-2-3.5v7A4 4 0 0 0 16 12z" fill="currentColor"/></svg>,
  Loop:    (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M7 7h10v3l4-4-4-4v3H5v6h2zM17 17H7v-3l-4 4 4 4v-3h12v-6h-2z" fill="currentColor"/></svg>,
  Metro:   (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M14 2H10L5 21h14L14 2zm-2 5l3 11h-6l3-11z" fill="currentColor"/></svg>,
  Board:   (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><rect x="3" y="9" width="18" height="6" fill="none" stroke="currentColor" strokeWidth="1.5"/><line x1="8" y1="9" x2="8" y2="15" stroke="currentColor" strokeWidth="1"/><line x1="13" y1="9" x2="13" y2="15" stroke="currentColor" strokeWidth="1"/><line x1="17" y1="9" x2="17" y2="15" stroke="currentColor" strokeWidth="1"/></svg>,
  Gear:    (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm9 4l-2-1 1-3-2-2-3 1-1-2h-4l-1 2-3-1-2 2 1 3-2 1v4l2 1-1 3 2 2 3-1 1 2h4l1-2 3 1 2-2-1-3 2-1z" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>,
  Search:  (p) => <svg width="16" height="16" viewBox="0 0 24 24" {...p}><circle cx="11" cy="11" r="6" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="16" y1="16" x2="21" y2="21" stroke="currentColor" strokeWidth="2"/></svg>,
  Pick:    (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><path d="M5 4 C 9 2 15 2 19 4 L 12 22 Z" fill="currentColor" opacity="0.85"/></svg>,
  Mic:     (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" fill="none"/></svg>,
  Solo:    (p) => <svg width="18" height="18" viewBox="0 0 24 24" {...p}><circle cx="12" cy="12" r="4" fill="currentColor"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.4"/></svg>,
  Star:    (p) => <svg width="14" height="14" viewBox="0 0 24 24" {...p}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z" fill="currentColor"/></svg>,
};

// =====================
// Album cover art (SVG) — versao estilizada do Ten (5 figuras em circulo + raios)
// =====================
function AlbumArt({ album, palette, size = 220 }) {
  const p = palette;
  if (album === "Ten") {
    return (
      <svg viewBox="0 0 200 200" width={size} height={size} style={{ display: "block" }}>
        <defs>
          <radialGradient id="tenSky" cx="0.5" cy="0.45" r="0.6">
            <stop offset="0" stopColor={p.glow} stopOpacity="0.95" />
            <stop offset="0.55" stopColor={p.accent} stopOpacity="0.85" />
            <stop offset="1" stopColor={p.deep} stopOpacity="1" />
          </radialGradient>
          <linearGradient id="tenFloor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={p.deep} />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" fill="url(#tenSky)" />
        <rect y="130" width="200" height="70" fill="url(#tenFloor)" opacity="0.85" />
        {/* raios de luz */}
        {[-30, -10, 10, 30].map((a, i) => (
          <polygon key={i}
            points={`100,100 ${100 + Math.cos((a-90)*Math.PI/180)*200},${100 + Math.sin((a-90)*Math.PI/180)*200} ${100 + Math.cos((a-90+4)*Math.PI/180)*200},${100 + Math.sin((a-90+4)*Math.PI/180)*200}`}
            fill={p.glow} opacity="0.18" />
        ))}
        {/* 5 figuras silhueta de maos dadas */}
        {[0, 1, 2, 3, 4].map(i => {
          const x = 30 + i * 35;
          return (
            <g key={i} fill={p.deep}>
              <circle cx={x} cy="110" r="6" />
              <rect x={x - 4} y="115" width="8" height="28" />
              {/* bracos pra cima/lados */}
              <path d={`M ${x-4} 122 L ${x-14} ${i%2 ? 115 : 108}`} stroke={p.deep} strokeWidth="4" strokeLinecap="round" />
              <path d={`M ${x+4} 122 L ${x+14} ${i%2 ? 108 : 115}`} stroke={p.deep} strokeWidth="4" strokeLinecap="round" />
              <rect x={x - 3} y="143" width="3" height="14" />
              <rect x={x} y="143" width="3" height="14" />
            </g>
          );
        })}
        <text x="100" y="185" textAnchor="middle" fontFamily="serif" fontSize="20"
              fontWeight="900" letterSpacing="6" fill={p.ink}>TEN</text>
      </svg>
    );
  }
  // Fallback genérico (ainda não temos arte específica por álbum)
  return (
    <svg viewBox="0 0 200 200" width={size} height={size}>
      <rect width="200" height="200" fill={p.deep} />
      <text x="100" y="110" textAnchor="middle" fontFamily="serif" fontSize="22"
            fontWeight="900" fill={p.ink}>{album.toUpperCase()}</text>
    </svg>
  );
}

// Vinil girando
function Vinyl({ size = 80, spinning, palette }) {
  return (
    <div style={{
      width: size, height: size, position: "relative",
      animation: spinning ? "pjVinylSpin 4s linear infinite" : "none",
    }}>
      <svg viewBox="0 0 100 100" width={size} height={size}>
        <defs>
          <radialGradient id="vinG" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0.18" stopColor={palette.accent} />
            <stop offset="0.19" stopColor="#0a0a0a" />
            <stop offset="1" stopColor="#1a1a1a" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="48" fill="url(#vinG)" />
        {[25, 30, 35, 40, 45].map(r => (
          <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="#000" strokeWidth="0.3" opacity="0.6"/>
        ))}
        <circle cx="50" cy="50" r="3" fill="#1a1410"/>
      </svg>
    </div>
  );
}

// ===== SEARCH MODAL =====
function SearchModal({ open, onClose, onSelect, songs, currentId }) {
  const [q, setQ] = useState("");
  const [albumFilter, setAlbumFilter] = useState("all");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setQ("");
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    function onKey(e) {
      if (!open) return;
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const albums = useMemo(() => {
    const s = new Set(songs.map(x => x.album));
    return ["all", ...Array.from(s)];
  }, [songs]);

  const filtered = useMemo(() => {
    const qq = q.toLowerCase();
    return songs.filter(s =>
      (albumFilter === "all" || s.album === albumFilter) &&
      (!q || s.title.toLowerCase().includes(qq) || s.album.toLowerCase().includes(qq))
    );
  }, [q, albumFilter, songs]);

  if (!open) return null;
  return (
    <div className="pj-modal-backdrop" onClick={onClose}>
      <div className="pj-modal pj-search-modal" onClick={e => e.stopPropagation()}>
        <div className="pj-search-head">
          <Ic.Search />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Buscar música, álbum ou letra..."
          />
          <kbd className="pj-kbd">esc</kbd>
        </div>
        <div className="pj-search-filters">
          {albums.map(a => (
            <button
              key={a}
              className={`pj-chip ${a === albumFilter ? "active" : ""}`}
              onClick={() => setAlbumFilter(a)}
            >
              {a === "all" ? "Todos" : a}
            </button>
          ))}
        </div>
        <div className="pj-search-results">
          {filtered.length === 0 && (
            <div className="pj-empty">Nada encontrado</div>
          )}
          {filtered.map(s => {
            const p = window.PJ_ALBUM_PALETTE[s.album] || { ink: "#f5efe3", accent: "#888", deep: "#1a1410" };
            const ready = s.status === "ready";
            return (
              <button
                key={s.id}
                className={`pj-result ${s.id === currentId ? "current" : ""} ${!ready ? "soon" : ""}`}
                onClick={() => ready && (onSelect(s.id), onClose())}
                disabled={!ready}
              >
                <span className="pj-result-strip" style={{ background: p.accent }}></span>
                <span className="pj-result-cover" style={{ background: `linear-gradient(135deg, ${p.deep}, ${p.accent})` }}>
                  <span style={{color: p.ink, fontSize: 9, fontWeight: 800, letterSpacing: 1}}>
                    {s.album.slice(0, 3).toUpperCase()}
                  </span>
                </span>
                <span className="pj-result-meta">
                  <span className="pj-result-title">{s.title}</span>
                  <span className="pj-result-sub">{s.album} · {s.year} · {s.key} · {s.bpm} BPM</span>
                </span>
                <span className="pj-result-tail">
                  {ready ? (
                    <span className="pj-result-ready"><Ic.Star /> Cifra disponível</span>
                  ) : (
                    <span className="pj-result-soon">em breve</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <div className="pj-search-foot">
          <span><kbd className="pj-kbd">↑</kbd><kbd className="pj-kbd">↓</kbd> navegar</span>
          <span><kbd className="pj-kbd">⏎</kbd> abrir</span>
          <span>Só "Black" está com cifra completa por enquanto</span>
        </div>
      </div>
    </div>
  );
}

// ===== APP ROOT =====
function CifraApp() {
  // Tweaks defaults
  const [tweaks, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "neckStyle": "rosewood",
    "stickerStyle": "stickman",
    "sheetStyle": "paper",
    "animations": "medium",
    "showAlbumBg": true,
    "showLyrics": true
  }/*EDITMODE-END*/);

  // App state
  const [songId, setSongId] = useState("black");
  const [searchOpen, setSearchOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.6);
  const [volume, setVolume] = useState(0.7);
  const [loop, setLoop] = useState(false);
  const [metroOn, setMetroOn] = useState(false);
  const [boardOn, setBoardOn] = useState(true);
  const [tab_, setTab_] = useState("pro");      // pro/note/solo/backing
  const [track, setTrack] = useState("guitar1");
  const [time, setTime] = useState(0);          // 0..N (em ticks/semicolcheias)

  const song = useMemo(() => window.PJ_SONGS.find(s => s.id === songId) || window.PJ_SONGS[0], [songId]);
  const tab = window.PJ_TAB_BLACK; // por enquanto só Black
  const palette = window.PJ_ALBUM_PALETTE[song.album] || window.PJ_ALBUM_PALETTE.Ten;

  // Playback simulado
  useEffect(() => {
    if (!playing) return;
    const totalTicks = tab.measures.length * 16;
    const tickMs = 60000 / (song.bpm * 4) / speed;
    const id = setInterval(() => {
      setTime(t => {
        const nx = t + 1;
        if (nx >= totalTicks) {
          if (loop) return 0;
          setPlaying(false);
          return totalTicks - 1;
        }
        return nx;
      });
    }, tickMs);
    return () => clearInterval(id);
  }, [playing, speed, song.bpm, loop, tab.measures.length]);

  const currentMeasureIdx = Math.floor(time / 16);
  const currentTickInMeasure = time % 16;
  const currentMeasure = tab.measures[currentMeasureIdx];
  // Encontra a nota cujo .t mais recentemente passou
  const activeNoteIdx = useMemo(() => {
    if (!currentMeasure) return -1;
    let idx = -1;
    for (let i = 0; i < currentMeasure.notes.length; i++) {
      if (currentMeasure.notes[i].t <= currentTickInMeasure) idx = i;
      else break;
    }
    return idx;
  }, [currentMeasure, currentTickInMeasure]);
  const activeNote = currentMeasure && activeNoteIdx >= 0 ? currentMeasure.notes[activeNoteIdx] : null;

  // Vibracao da corda atual (para o fretboard)
  const stringStates = useMemo(() => {
    const arr = new Array(6).fill(false);
    if (activeNote) arr[activeNote.s] = true;
    return arr;
  }, [activeNote]);

  // Atalho de teclado: Cmd/Ctrl+K abre busca, espaco play/pause
  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === " " && !searchOpen && document.activeElement.tagName !== "INPUT") {
        e.preventDefault(); setPlaying(p => !p);
      }
      if (e.key === "/" && !searchOpen) { e.preventDefault(); setSearchOpen(true); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [searchOpen]);

  // Aplicar variavel CSS dependente da paleta
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--album-ink", palette.ink);
    root.style.setProperty("--album-accent", palette.accent);
    root.style.setProperty("--album-deep", palette.deep);
    root.style.setProperty("--album-glow", palette.glow);
  }, [palette]);

  return (
    <div className="pj-app" data-screen-label="01 Cifra Black">
      {/* Background da capa (desfocado) */}
      {tweaks.showAlbumBg && (
        <div className="pj-album-bg" style={{ "--bg-accent": palette.accent, "--bg-deep": palette.deep }}>
          <div className="pj-album-bg-inner">
            <AlbumArt album={song.album} palette={palette} size={900} />
          </div>
        </div>
      )}

      {/* ============ HEADER ============ */}
      <header className="pj-header">
        <div className="pj-header-left">
          <PJLogo size={28} color="#f5efe3" />
          <div className="pj-brand">
            <span className="pj-brand-1">Setlists</span>
            <span className="pj-brand-2">·</span>
            <span className="pj-brand-3">Cifras</span>
          </div>
          <nav className="pj-nav">
            <a className="pj-nav-link active">Cifras</a>
            <a className="pj-nav-link">Timeline</a>
            <a className="pj-nav-link">Ranking</a>
            <a className="pj-nav-link">Galeria</a>
            <a className="pj-nav-link">Deep</a>
          </nav>
        </div>
        <button className="pj-search-btn" onClick={() => setSearchOpen(true)}>
          <Ic.Search />
          <span>Buscar música, álbum, letra...</span>
          <span className="pj-search-kbd"><kbd className="pj-kbd">⌘</kbd><kbd className="pj-kbd">K</kbd></span>
        </button>
        <div className="pj-header-right">
          <div className="pj-tonebar">
            <span className="pj-tone-label">28</span>
            <span className="pj-tone-sub">shows</span>
          </div>
        </div>
      </header>

      {/* ============ BANNER DA MÚSICA ============ */}
      <section className="pj-banner">
        <div className="pj-banner-art">
          <div className="pj-banner-cover">
            <AlbumArt album={song.album} palette={palette} size={200} />
          </div>
          <div className="pj-banner-vinyl">
            <Vinyl size={120} spinning={playing} palette={palette} />
          </div>
        </div>
        <div className="pj-banner-meta">
          <div className="pj-banner-crumb">
            <span>Pearl Jam</span>
            <span className="pj-banner-dot">·</span>
            <span>{song.album}</span>
            <span className="pj-banner-dot">·</span>
            <span>{song.year}</span>
          </div>
          <h1 className="pj-song-title">{song.title}</h1>
          <div className="pj-banner-stats">
            <div className="pj-stat"><span className="pj-stat-k">Afinação</span><span className="pj-stat-v">{song.tuning}</span></div>
            <div className="pj-stat"><span className="pj-stat-k">Capo</span><span className="pj-stat-v">{song.capo}</span></div>
            <div className="pj-stat"><span className="pj-stat-k">Tom</span><span className="pj-stat-v">{song.key}</span></div>
            <div className="pj-stat"><span className="pj-stat-k">BPM</span><span className="pj-stat-v">{song.bpm}</span></div>
            <div className="pj-stat"><span className="pj-stat-k">Duração</span><span className="pj-stat-v">{song.duration}</span></div>
          </div>
          <div className="pj-banner-tabs">
            {["pro", "note", "solo", "backing"].map(t => (
              <button
                key={t}
                className={`pj-banner-tab ${t === tab_ ? "active" : ""}`}
                onClick={() => setTab_(t)}
              >
                {t === "pro" ? "PRO" : t === "note" ? "NOTE" : t === "solo" ? "SOLO" : "BACKING TRACK"}
              </button>
            ))}
            <span className="pj-banner-flag">★ Cifra oficial · revisado por André</span>
          </div>
        </div>
        {tab.sections && (
          <div className="pj-section-chips">
            {tab.sections.map(sec => (
              <button key={sec.id} className="pj-section-chip" style={{ borderColor: sec.color, color: sec.color }}
                onClick={() => {
                  setTime((sec.bars[0]) * 16);
                  setPlaying(true);
                }}>
                {sec.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* ============ AREA PRINCIPAL (sidebar + tab sheet) ============ */}
      <section className="pj-main">
        <aside className="pj-rail">
          {[
            { id: "guitar1", icon: <Ic.Pick />, label: "Guitar 1", sub: "intro / clean" },
            { id: "guitar2", icon: <Ic.Pick />, label: "Guitar 2", sub: "rhythm / dist" },
            { id: "vocal",   icon: <Ic.Mic />,  label: "Vocal",    sub: "Eddie" },
            { id: "bass",    icon: <Ic.Solo />, label: "Bass",     sub: "Jeff" },
            { id: "drums",   icon: <Ic.Metro />,label: "Drums",    sub: "Matt" },
          ].map(t => (
            <button key={t.id} className={`pj-rail-track ${t.id === track ? "active" : ""}`}
              onClick={() => setTrack(t.id)} title={t.label}>
              <span className="pj-rail-ic">{t.icon}</span>
              <span className="pj-rail-text">
                <span className="pj-rail-lbl">{t.label}</span>
                <span className="pj-rail-sub">{t.sub}</span>
              </span>
              <span className="pj-rail-vu">
                <span className="pj-vu-bar" style={{ height: playing && t.id === track ? `${30 + Math.random() * 60}%` : "10%" }}></span>
                <span className="pj-vu-bar" style={{ height: playing && t.id === track ? `${30 + Math.random() * 60}%` : "10%" }}></span>
                <span className="pj-vu-bar" style={{ height: playing && t.id === track ? `${30 + Math.random() * 60}%` : "10%" }}></span>
              </span>
            </button>
          ))}
        </aside>

        <div className="pj-sheet-wrap">
          <TabSheet
            tab={tab}
            currentMeasure={playing || time > 0 ? currentMeasureIdx + 1 : -1}
            currentNoteIdx={activeNoteIdx}
            palette={palette}
            sheetStyle={tweaks.sheetStyle}
          />
          {tweaks.showLyrics && currentMeasure && (
            <div className="pj-lyric-overlay">
              {(window.PJ_BLACK_LYRICS.find(l => l.measure === currentMeasure.idx) || {}).text || ""}
            </div>
          )}
        </div>
      </section>

      {/* ============ FRETBOARD ============ */}
      {boardOn && (
        <section className="pj-fb-section">
          <Fretboard
            activeNote={activeNote}
            stringStates={stringStates}
            palette={palette}
            stickerStyle={tweaks.stickerStyle}
            neckStyle={tweaks.neckStyle}
          />
        </section>
      )}

      {/* ============ CONTROLES ============ */}
      <footer className="pj-controls">
        <div className="pj-ctrl-grp">
          <button className="pj-ctrl-ic"><Ic.Vol /></button>
          <input type="range" min="0" max="1" step="0.01" value={volume}
            onChange={e => setVolume(parseFloat(e.target.value))}
            className="pj-slider pj-slider-vol" />
        </div>
        <div className="pj-ctrl-grp pj-ctrl-grp-center">
          <button className="pj-ctrl-ic" onClick={() => setTime(0)}><Ic.Prev /></button>
          <button className="pj-ctrl-play" onClick={() => setPlaying(p => !p)}>
            {playing ? <Ic.Pause /> : <Ic.Play />}
          </button>
          <div className="pj-speed">
            <span className="pj-speed-lbl">speed</span>
            <input type="range" min="0.25" max="1.5" step="0.05" value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              className="pj-slider pj-slider-speed" />
            <span className="pj-speed-val">{speed.toFixed(2)}</span>
          </div>
        </div>
        <div className="pj-ctrl-grp pj-ctrl-grp-right">
          <button className={`pj-ctrl-toggle ${loop ? "active" : ""}`} onClick={() => setLoop(v => !v)}>
            <Ic.Loop /><span>loop</span>
          </button>
          <button className={`pj-ctrl-toggle ${metroOn ? "active" : ""}`} onClick={() => setMetroOn(v => !v)}>
            <Ic.Metro /><span>metrônomo</span>
          </button>
          <button className={`pj-ctrl-toggle ${boardOn ? "active" : ""}`} onClick={() => setBoardOn(v => !v)}>
            <Ic.Board /><span>fretboard</span>
          </button>
          <button className="pj-ctrl-toggle"><Ic.Gear /><span>ajustes</span></button>
        </div>
      </footer>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)}
        onSelect={setSongId} songs={window.PJ_SONGS} currentId={songId} />

      {/* ===== TWEAKS PANEL ===== */}
      <TweaksPanel>
        <TweakSection label="Visual do braço">
          <TweakRadio
            label="Madeira"
            value={tweaks.neckStyle}
            onChange={v => setTweak("neckStyle", v)}
            options={[
              { value: "rosewood", label: "Rosewood" },
              { value: "ebony",    label: "Ebony" },
              { value: "maple",    label: "Maple" },
            ]}
          />
          <TweakRadio
            label="Adesivos"
            value={tweaks.stickerStyle}
            onChange={v => setTweak("stickerStyle", v)}
            options={[
              { value: "stickman", label: "Stickman" },
              { value: "words",    label: "Letras" },
              { value: "off",      label: "Sem" },
            ]}
          />
        </TweakSection>
        <TweakSection label="Folha de tab">
          <TweakRadio
            label="Estilo"
            value={tweaks.sheetStyle}
            onChange={v => setTweak("sheetStyle", v)}
            options={[
              { value: "paper",  label: "Papel" },
              { value: "clean",  label: "Clean" },
              { value: "zine",   label: "Zine" },
            ]}
          />
        </TweakSection>
        <TweakSection label="Atmosfera">
          <TweakToggle label="Fundo do álbum" checked={tweaks.showAlbumBg}
            onChange={v => setTweak("showAlbumBg", v)} />
          <TweakToggle label="Letra sincronizada" checked={tweaks.showLyrics}
            onChange={v => setTweak("showLyrics", v)} />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

Object.assign(window, { CifraApp, PJLogo, AlbumArt });
