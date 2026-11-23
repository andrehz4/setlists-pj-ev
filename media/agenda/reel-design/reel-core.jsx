// Núcleo do reel "Agenda da semana" (@smufdpj): dados, tempos, mapa, peças comuns.
// Toda cor é variável CSS (--hl, --bg, --alert, --paper, --paper2 e as versões -rgb).
(() => {
const CW = 1080, CH = 1920;
const clamp01 = v => Math.max(0, Math.min(1, v));
const lerp = (a, b, t) => a + (b - a) * t;
// Os três únicos helpers de movimento (todos os layouts).
const MOTION = {
  enter: (T, s, d) => Easing.easeOutCubic(clamp01((T - s) / d)),
  pop: (T, s, d) => Easing.easeOutBack(clamp01((T - s) / d)),
  move: (T, s, d) => Easing.easeInOutCubic(clamp01((T - s) / d)),
};
const V = { hl: 'var(--hl)', bg: 'var(--bg)', alert: 'var(--alert)', paper: 'var(--paper)', paper2: 'var(--paper2)' };
const A = (k, a) => 'rgba(var(--' + k + '-rgb),' + a + ')';
const HALF = (color, size, dot = 1.3) => ({ backgroundImage: 'radial-gradient(' + color + ' ' + dot + 'px, transparent ' + (dot + 0.5) + 'px)', backgroundSize: size + 'px ' + size + 'px' });

const PALETTES = {
  amarelo: { hl: '#FFCC1A', bg: '#14110F', alert: '#E0361C', paper: '#f3efe6', paper2: '#E9E1CF' },
  laranja: { hl: '#FF7A1A', bg: '#140C07', alert: '#D7263D', paper: '#FFF1D6', paper2: '#F3DFC0' },
  azul: { hl: '#4FC3F7', bg: '#08111A', alert: '#FF4F79', paper: '#EAF2F8', paper2: '#D5E4EF' },
};
const rgbOf = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',');
function paletteVars(name) {
  const p = PALETTES[name] || PALETTES.amarelo, o = {};
  Object.keys(p).forEach(k => { o['--' + k] = p[k]; o['--' + k + '-rgb'] = rgbOf(p[k]); });
  return o;
}

// Pseudoaleatório com semente fixa: calculado uma vez, idêntico em todo quadro.
function rng(seed) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
// Borda rasgada: polígono com semente fixa.
function torn(seed, amp = 1.4, steps = 16) {
  const r = rng(seed), pts = [];
  for (let i = 0; i <= steps; i++) pts.push((i / steps * 100).toFixed(1) + '% ' + (r() * amp).toFixed(2) + '%');
  for (let i = 1; i <= steps; i++) pts.push((100 - r() * amp * 0.6).toFixed(2) + '% ' + (i / steps * 100).toFixed(1) + '%');
  for (let i = steps - 1; i >= 0; i--) pts.push((i / steps * 100).toFixed(1) + '% ' + (100 - r() * amp).toFixed(2) + '%');
  for (let i = steps - 1; i >= 1; i--) pts.push((r() * amp * 0.6).toFixed(2) + '% ' + (i / steps * 100).toFixed(1) + '%');
  return 'polygon(' + pts.join(',') + ')';
}

// ── Dados ──────────────────────────────────────────────────────────────────
const REAL_WEEK = {"semana":"2026-11-24 a 2026-11-29","shows":[
{"data":"2026-11-26","cidade":"São Paulo","uf":"SP","banda":"Lost Dogs","arrobaBanda":"@pearljamsp","casa":"Blues Beer","arrobaCasa":null,"hora":"20:00"},
{"data":"2026-11-27","cidade":"Santo André","uf":"SP","banda":"Blaymorphed","arrobaBanda":"@blaymorphed","casa":null,"arrobaCasa":"@santorockbar","hora":null},
{"data":"2026-11-27","cidade":"Osasco","uf":"SP","banda":"Lost Dogs","arrobaBanda":"@pearljamsp","casa":"Lata Velha","arrobaCasa":null,"hora":"23:00"},
{"data":"2026-11-27","cidade":"Osasco","uf":"SP","banda":"PJ 90","arrobaBanda":"@pjnoventa","casa":null,"arrobaCasa":"@rockeribscontinental","hora":"20:00"},
{"data":"2026-11-27","cidade":"Mauá","uf":"SP","banda":"PJ 90","arrobaBanda":"@pjnoventa","casa":null,"arrobaCasa":"@livemusicbar","hora":"23:00"},
{"data":"2026-11-28","cidade":"Campinas","uf":"SP","banda":"Blaymorphed","arrobaBanda":"@blaymorphed","casa":null,"arrobaCasa":"@santorockbarcampinas","hora":null},
{"data":"2026-11-28","cidade":"Barueri","uf":"SP","banda":"Lost Dogs","arrobaBanda":"@pearljamsp","casa":"Rocknspeto","arrobaCasa":null,"hora":"21:00"},
{"data":"2026-11-28","cidade":"Guarulhos","uf":"SP","banda":"PJ 90","arrobaBanda":"@pjnoventa","casa":null,"arrobaCasa":"@strongwash","hora":"22:00"},
{"data":"2026-11-28","cidade":"Belo Horizonte","uf":"MG","banda":"The Homer","arrobaBanda":"@thehomerpj","casa":"Iron Rock","arrobaCasa":null,"hora":null}]};
const S_ = (data, cidade, uf, banda, arrobaBanda, casa, hora) => ({ data, cidade, uf, banda, arrobaBanda, casa, arrobaCasa: null, hora });
const MIN_WEEK = { semana: '2026-11-24 a 2026-11-29', shows: [S_('2026-11-28', 'Belo Horizonte', 'MG', 'The Homer', '@thehomerpj', 'Iron Rock', '21:00')] };
const FULL_WEEK = { semana: '2026-11-24 a 2026-11-29', shows: [
  S_('2026-11-24', 'Curitiba', 'PR', 'PJ 90', '@pjnoventa', 'Bar Teste', '21:00'),
  S_('2026-11-25', 'Rio de Janeiro', 'RJ', 'Lost Dogs', '@pearljamsp', 'Casa Teste', '22:00'),
  S_('2026-11-26', 'São Paulo', 'SP', 'Lost Dogs', '@pearljamsp', 'Blues Beer', '20:00'),
  S_('2026-11-26', 'Salvador', 'BA', 'The Homer', '@thehomerpj', 'Casa Teste', '21:00'),
  S_('2026-11-27', 'Porto Alegre', 'RS', 'Blaymorphed', '@blaymorphed', 'Bar Teste', '22:00'),
  S_('2026-11-27', 'Santos', 'SP', 'PJ 90', '@pjnoventa', 'Bar Teste', '23:00'),
  S_('2026-11-27', 'Juiz de Fora', 'MG', 'The Homer', '@thehomerpj', 'Casa Teste', null),
  S_('2026-11-28', 'Osasco', 'SP', 'Lost Dogs', '@pearljamsp', 'Lata Velha', '23:00'),
  S_('2026-11-28', 'Barueri', 'SP', 'PJ 90', '@pjnoventa', 'Rocknspeto', '21:00'),
  S_('2026-11-28', 'Santo André', 'SP', 'Blaymorphed', '@blaymorphed', '@santorockbar', null),
  S_('2026-11-28', 'Mauá', 'SP', 'PJ 90', '@pjnoventa', '@livemusicbar', '23:00'),
  S_('2026-11-28', 'Guarulhos', 'SP', 'Lost Dogs', '@pearljamsp', '@strongwash', '22:00'),
  S_('2026-11-28', 'Campinas', 'SP', 'Blaymorphed', '@blaymorphed', '@santorockbarcampinas', '20:00'),
  S_('2026-11-29', 'Belo Horizonte', 'MG', 'The Homer', '@thehomerpj', 'Iron Rock', '19:00'),
  S_('2026-11-29', 'Niterói', 'RJ', 'Lost Dogs', '@pearljamsp', 'Casa Teste', '20:00')] };
const COORDS = {
  'São Paulo': [-23.55, -46.63], 'Santo André': [-23.66, -46.53], 'Osasco': [-23.53, -46.79], 'Mauá': [-23.67, -46.46],
  'Campinas': [-22.91, -47.06], 'Barueri': [-23.51, -46.88], 'Guarulhos': [-23.46, -46.53], 'Belo Horizonte': [-19.92, -43.94],
  'Rio de Janeiro': [-22.91, -43.17], 'Niterói': [-22.88, -43.10], 'Curitiba': [-25.43, -49.27], 'Porto Alegre': [-30.03, -51.23],
  'Salvador': [-12.97, -38.50], 'Juiz de Fora': [-21.76, -43.35], 'Santos': [-23.96, -46.33],
};
const projX = lon => 25.4 + (lon + 73.99) * 24.215;
const projY = lat => 12.5 + (5.27 - lat) * 24.99;
const LOGOS = { '@pearljamsp': 'assets/foto-pearljamsp.jpg', '@blaymorphed': 'assets/foto-blaymorphed.jpg', '@pjnoventa': 'assets/foto-pjnoventa.jpg', '@thehomerpj': 'assets/foto-thehomerpj.jpg' };
const DIAS = ['DOMINGO', 'SEGUNDA', 'TERÇA', 'QUARTA', 'QUINTA', 'SEXTA', 'SÁBADO'];
const ddmm = iso => { const p = iso.split('-'); return p[2] + '/' + p[1]; };
const weekday = iso => { const p = iso.split('-').map(Number); return DIAS[new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay()]; };
const cap = s => s.charAt(0) + s.slice(1).toLowerCase();
const fmtHora = h => { if (!h) return null; const [a, b] = h.split(':'); return +a + 'H' + (b && b !== '00' ? b : ''); };
const casaDe = s => s.casa || s.arrobaCasa;
const weekRange = w => w.semana.split(' a ').map(ddmm);
const plural = (n, a, b) => n + ' ' + (n === 1 ? a : b);

const DAY_INTRO = 0.9, PER_SHOW = 1.8;
const dayDur = n => Math.max(3, +(DAY_INTRO + n * PER_SHOW).toFixed(2));
function buildDays(week) {
  const by = {};
  week.shows.forEach(s => { (by[s.data] = by[s.data] || []).push(s); });
  return Object.keys(by).sort().map(d => ({ date: d, word: weekday(d), dm: ddmm(d), scene: cap(weekday(d)) + ' ' + ddmm(d), shows: by[d] }));
}
function buildScenes(week) {
  return JSON.stringify([
    { name: 'Abertura', dur: 3, desc: 'Quatro cortes de clipe do Pearl Jam com a pergunta entrando por cima' },
    { name: 'Mapa', dur: 3.5, desc: 'Zoom no recorte dos shows, estados acendem e os pinos caem' },
    ...buildDays(week).map(d => ({ name: d.scene, dur: dayDur(d.shows.length), desc: d.shows.length + ' show(s); o destaque passa de show em show' })),
    { name: 'Fecho', dur: 3, desc: 'Toda terça tem, segue @smufdpj e link da agenda' },
  ]);
}

// ── Tempos comuns ───────────────────────────────────────────────────────────
function dayTiming(day, S, End) {
  const n = day.shows.length, D = End - S;
  const cue = day.shows.map((s, i) => s.voz != null ? S + s.voz : S + DAY_INTRO + i * (D - DAY_INTRO) / n);
  const sw = cue.map((c, i) => i === 0 ? S : c - 0.15);
  return { cue, sw };
}
// Pesos do destaque (somam 1): troca do show i em sw[i], move(0,35).
function dayWeights(T, day, S, End) {
  const n = day.shows.length, { sw } = dayTiming(day, S, End);
  const e = day.shows.map((_, i) => i === 0 ? 1 : MOTION.move(T, sw[i], 0.35));
  return { w: e.map((v, i) => v - (i + 1 < n ? e[i + 1] : 0)), sw };
}
// Sanfona: n linhas numa região RH; a aberta tem HX px.
function accordion(n, RH, ROW, GAP, HXmax) {
  const HX = Math.min(RH - (n - 1) * (ROW + GAP), HXmax);
  const total = HX + (n - 1) * (ROW + GAP);
  return { HX, total, off: (RH - total) / 2 };
}
const mapTiming = (S, End, n) => ({ pinStart: S + 1.5, step: Math.min(0.22, (End - S - 2.1) / n) });

// ── Geografia ───────────────────────────────────────────────────────────────
function buildGeo(week, MW, MH, lab) {
  lab = lab || { fs: 32, h: 50, cw: 18, pad: 30 };
  const cities = [], idx = {};
  week.shows.forEach(s => {
    const k = s.cidade + '|' + s.uf;
    if (idx[k] == null) {
      const ll = s.lat != null ? [s.lat, s.lon] : (COORDS[s.cidade] || [-15.8, -47.9]);
      idx[k] = cities.length;
      cities.push({ name: s.cidade.toUpperCase(), uf: s.uf, count: 0, sx: projX(ll[1]), sy: projY(ll[0]) });
    }
    cities[idx[k]].count++;
  });
  const states = [...new Set(week.shows.map(s => s.uf))];
  const xs = cities.map(c => c.sx), ys = cities.map(c => c.sy);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = Math.max(30, 0.22 * Math.max(x1 - x0, y1 - y0));
  let w = Math.max(x1 - x0 + 2 * pad, 120), h = Math.max(y1 - y0 + 2 * pad * 1.15, 120);
  const AR = MW / MH;
  if (w / h < AR) w = h * AR; else h = w / AR;
  const crop = { x: (x0 + x1) / 2 - w / 2, y: (y0 + y1) / 2 - h / 2 + pad * 0.12, w, h };
  const k = MW / w;
  cities.forEach(c => { c.ax = (c.sx - crop.x) * k; c.ay = (c.sy - crop.y) * k; });
  const L = cities.map(c => {
    const lw = c.name.length * lab.cw + lab.pad, right = c.ax < MW * 0.6;
    const px = right ? c.ax + 26 : c.ax - 26 - lw, py = c.ay - 62;
    return { w: lw, h: lab.h, x: px, y: py, px, py };
  });
  const clampL = l => { l.x = Math.max(14, Math.min(MW - 14 - l.w, l.x)); l.y = Math.max(14, Math.min(MH - 14 - l.h, l.y)); };
  for (let it = 0; it < 400; it++) {
    L.forEach(l => { l.x += (l.px - l.x) * 0.02; l.y += (l.py - l.y) * 0.02; });
    for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
      const a = L[i], b = L[j];
      const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) + 8;
      const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) + 8;
      if (ox > 0 && oy > 0) {
        if (oy < ox * 1.6) { const d = oy / 2, up = (a.y + a.h / 2) <= (b.y + b.h / 2); a.y += up ? -d : d; b.y += up ? d : -d; }
        else { const d = ox / 2, lf = (a.x + a.w / 2) <= (b.x + b.w / 2); a.x += lf ? -d : d; b.x += lf ? d : -d; }
      }
    }
    L.forEach(l => {
      cities.forEach(c => {
        const ox = Math.min(l.x + l.w, c.ax + 22) - Math.max(l.x, c.ax - 22);
        const oy = Math.min(l.y + l.h, c.ay + 4) - Math.max(l.y, c.ay - 58);
        if (ox > 0 && oy > 0) { if (oy < ox) l.y += (l.y + l.h / 2 < c.ay - 27) ? -oy : oy; else l.x += (l.x + l.w / 2 < c.ax) ? -ox : ox; }
      });
      clampL(l);
    });
  }
  cities.forEach((c, i) => {
    const l = L[i]; c.label = l;
    const hx = c.ax, hy = c.ay - 34;
    const nx = Math.max(l.x, Math.min(l.x + l.w, hx)), ny = Math.max(l.y, Math.min(l.y + l.h, hy));
    c.leader = Math.hypot(nx - hx, ny - hy) > 30 ? { x1: hx, y1: hy, x2: nx, y2: ny } : null;
  });
  const full = { x: -95, y: -20, w: 1040 * AR, h: 1040 };
  return { cities, states, crop, full, MW, MH, lab };
}

// Mapa completo (estados + pinos + rótulos) dentro de uma caixa W x H.
// th: { land, lit, stroke, sea, labelBg, labelFg, leader, pinFill, pinBorder, labelFont }
function MapCanvas({ T, S, End, geo, th }) {
  const { MW, MH } = geo, D = End - S;
  const cam = MOTION.move(T, S + 0.2, 1.1), f = geo.full, c = geo.crop;
  const vw = Math.exp(lerp(Math.log(f.w), Math.log(c.w), cam)), vh = vw * MH / MW;
  const cx = lerp(f.x + f.w / 2, c.x + c.w / 2, cam), cy = lerp(f.y + f.h / 2, c.y + c.h / 2, cam);
  const drift = lerp(1, 1.04, clamp01((T - S - 1.3) / (D - 1.3)));
  const { pinStart, step } = mapTiming(S, End, geo.cities.length);
  const vb = (cx - vw / 2) + ' ' + (cy - vh / 2) + ' ' + vw + ' ' + vh;
  const ufs = Object.keys(window.BR_UF);
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: th.sea }}>
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(' + drift + ')', transformOrigin: '50% 60%' }}>
        <svg width={MW} height={MH} viewBox={vb} style={{ position: 'absolute', left: 0, top: 0 }}>
          {ufs.map(uf => <path key={uf} d={window.BR_UF[uf]} style={{ fill: th.land, stroke: th.stroke }} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />)}
          {geo.states.map((uf, j) => window.BR_UF[uf] ? <path key={'l' + uf} d={window.BR_UF[uf]} style={{ fill: th.lit, stroke: th.stroke }} opacity={MOTION.enter(T, S + 1.1 + j * 0.15, 0.3)} strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinejoin="round" /> : null)}
        </svg>
        <svg width={MW} height={MH} style={{ position: 'absolute', left: 0, top: 0 }}>
          {geo.cities.map((ct, i) => ct.leader ? <line key={i} x1={ct.leader.x1} y1={ct.leader.y1} x2={ct.leader.x2} y2={ct.leader.y2} style={{ stroke: th.leader }} strokeWidth={3} opacity={MOTION.enter(T, pinStart + i * step + 0.12, 0.2)} /> : null)}
        </svg>
        {geo.cities.map((ct, i) => {
          const s0 = pinStart + i * step, p = MOTION.pop(T, s0, 0.4), on = T >= s0 ? 1 : 0;
          const lp = MOTION.pop(T, s0 + 0.12, 0.3), lb = ct.label;
          return (
            <React.Fragment key={i}>
              <div style={{ position: 'absolute', left: ct.ax - 15, top: ct.ay - 5, width: 30, height: 10, borderRadius: '50%', background: A('bg', 0.35), transform: 'scale(' + clamp01(p) + ')', opacity: on }}></div>
              <div style={{ position: 'absolute', left: ct.ax - 18, top: ct.ay - 43.5, width: 36, height: 36, opacity: on, transform: 'translateY(' + lerp(-180, 0, p) + 'px) rotate(-45deg)', borderRadius: '50% 50% 50% 0', background: th.pinFill, border: '4px solid ' + th.pinBorder, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {ct.count > 1 ? <div style={{ transform: 'rotate(45deg)', font: '800 18px Inter, sans-serif', color: V.paper }}>{ct.count}</div> : <div style={{ width: 9, height: 9, borderRadius: 5, background: th.pinBorder }}></div>}
              </div>
              <div style={{ position: 'absolute', left: lb.x, top: lb.y, width: lb.w, height: lb.h, background: th.labelBg, color: th.labelFg, display: 'flex', alignItems: 'center', justifyContent: 'center', font: th.labelFont || ('400 ' + geo.lab.fs + 'px/1 Anton, sans-serif'), opacity: T >= s0 + 0.12 ? 1 : 0, transform: 'scale(' + lerp(0.5, 1, lp) + ') rotate(' + (th.labelRot ? th.labelRot(i) : 0) + 'deg)', transformOrigin: 'center', border: th.labelBorder || 'none', boxSizing: 'border-box' }}>{ct.name}</div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Peças comuns ────────────────────────────────────────────────────────────
function ClipPH({ label, idx = 0, zoom = 1 }) {
  if (window.AGENDA_RENDER) return null; // [smufdpj] render: clipe real entra por baixo no ffmpeg
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: V.bg }}>
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(' + zoom + ')', background: A('paper', 0.05 + (idx % 4) * 0.018),
        backgroundImage: 'repeating-linear-gradient(' + (135 + idx * 20) + 'deg, ' + A('paper', 0.035) + ' 0 40px, transparent 40px 80px)' }}>
        <div style={{ position: 'absolute', inset: 0, ...HALF(A('paper', 0.07), 9) }}></div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 700, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 120, height: 120, borderRadius: 60, border: '4px solid ' + A('paper', 0.35), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 0, height: 0, borderLeft: '40px solid ' + A('paper', 0.4), borderTop: '26px solid transparent', borderBottom: '26px solid transparent', marginLeft: 10 }}></div>
          </div>
          <div style={{ font: '700 34px Inter, sans-serif', color: A('paper', 0.55), letterSpacing: 4 }}>{label}</div>
          <div style={{ font: '500 24px Inter, sans-serif', color: A('paper', 0.4), letterSpacing: 2 }}>trecho mudo</div>
        </div>
      </div>
    </div>
  );
}
function Logo({ src, D, ring = 8, ringColor = V.bg, name }) {
  return (
    <div style={{ width: D, height: D, borderRadius: D / 2, overflow: 'hidden', border: ring + 'px solid ' + ringColor, background: V.bg, position: 'relative', flexShrink: 0, boxSizing: 'border-box' }}>
      {src ? <img src={src} alt="" style={{ position: 'absolute', width: D * 1.6, height: D * 1.2, left: (D - ring * 2 - D * 1.6) / 2, top: (D - ring * 2 - D * 1.2) / 2 }} />
        : <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', font: '400 ' + D * 0.3 + 'px Anton, sans-serif', color: V.hl }}>{name.slice(0, 2).toUpperCase()}</div>}
    </div>
  );
}
function Tape({ children, bg, color, size, rot, p, pad = '10px 26px' }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', transform: 'rotate(' + rot + 'deg)' }}>
      <div style={{ position: 'absolute', inset: 0, background: bg, transform: 'scaleX(' + p + ')', transformOrigin: 'left center' }}></div>
      <div style={{ position: 'relative', padding: pad, font: '400 ' + size + 'px/1 Anton, sans-serif', color, opacity: clamp01((p - 0.5) * 3), whiteSpace: 'nowrap' }}>{children}</div>
    </div>
  );
}
function Slam({ T, at, children, origin = 'left bottom', from = 1.4, rot = 0 }) {
  const p = MOTION.pop(T, at, 0.4);
  return <div style={{ opacity: MOTION.enter(T, at, 0.08), transform: 'scale(' + lerp(from, 1, p) + ') rotate(' + rot * (1 - clamp01(p)) + 'deg)', transformOrigin: origin }}>{children}</div>;
}
function Signature({ color }) {
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 232, textAlign: 'center', fontFamily: '"Playfair Display", serif', fontWeight: 900, fontStyle: 'italic', fontSize: 36, color, letterSpacing: 0.5 }}>
      Só Mais um Fã de PEARL JAM
    </div>
  );
}
function Guides({ T, beats, safe, showBeats }) {
  const hit = showBeats ? beats.find(b => T >= b.t && T < b.t + 0.15) : null;
  const band = { position: 'absolute', left: 0, right: 0, background: 'rgba(255,0,0,0.22)', font: '700 26px Inter, sans-serif', color: '#fff', padding: 12, boxSizing: 'border-box' };
  return (
    <>
      {safe ? <>
        <div style={{ ...band, top: 0, height: 220, borderBottom: '3px dashed #f00', display: 'flex', alignItems: 'flex-end' }}>área segura · 220 px</div>
        <div style={{ ...band, bottom: 0, height: 380, borderTop: '3px dashed #f00' }}>legenda e botões · 380 px</div>
      </> : null}
      {hit ? <div style={{ position: 'absolute', left: 40, top: 60, background: '#f00', padding: '10px 20px', font: '800 30px Inter, sans-serif', color: '#fff' }}>BATIDA · {hit.what}</div> : null}
    </>
  );
}

// ── Composição ──────────────────────────────────────────────────────────────
function Piece({ t, week }) {
  const { T, CUES, time } = useComposition();
  const L = (window.LAYOUTS || {})[t.layout] || window.LAYOUTS.A;
  const days = React.useMemo(() => buildDays(week), [week]);
  const geo = React.useMemo(() => buildGeo(week, L.map.w, L.map.h, L.map.lab), [week, L]);
  const order = ['Abertura', 'Mapa', ...days.map(d => d.scene), 'Fecho'];
  const start = n => CUES[n];
  const end = n => { const i = order.indexOf(n); return i + 1 < order.length ? CUES[order[i + 1]] : CUES.Fecho + (window.AGENDA_FECHO_DUR || 3); }; // [smufdpj] fecho dura a fala
  const beats = React.useMemo(() => {
    const B = [], o = start('Abertura'), m = start('Mapa');
    [0, 1, 2, 3].forEach(i => B.push({ t: o + i * (m - o) / 4, what: 'corte clipe ' + (i + 1) }));
    B.push({ t: m, what: 'corte mapa' });
    const { pinStart, step } = mapTiming(m, end('Mapa'), geo.cities.length);
    geo.cities.forEach((c, i) => B.push({ t: +(pinStart + i * step + 0.15).toFixed(3), what: 'pino ' + c.name }));
    days.forEach(d => {
      B.push({ t: start(d.scene), what: 'corte ' + d.word });
      dayTiming(d, start(d.scene), end(d.scene)).sw.forEach((s, i) => { if (i > 0) B.push({ t: +s.toFixed(3), what: 'troca ' + d.shows[i].cidade }); });
    });
    B.push({ t: start('Fecho'), what: 'corte fecho' });
    return B;
  }, [CUES, days, geo]);
  window.REEL_BEATS = beats;
  const phase = T < start('Mapa') ? 'open' : T < start(days[0].scene) ? 'map' : T < start('Fecho') ? 'day' : 'close';
  const { Opening, MapScene, DayScene, Closing } = L;
  return (
    <div data-screen-label={'t=' + Math.floor(time) + 's'} style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: window.AGENDA_RENDER && (phase === 'open' || phase === 'day') ? 'transparent' : V.bg, ...paletteVars(t.paleta) }}>
      <Opening T={T} S={start('Abertura')} End={end('Abertura')} week={week} />
      <MapScene T={T} S={start('Mapa')} End={end('Mapa')} geo={geo} week={week} />
      {days.map((d, i) => <DayScene key={d.scene} T={T} S={start(d.scene)} End={end(d.scene)} day={d} di={i} mode={t.fundo} />)}
      <Closing T={T} S={start('Fecho')} End={end('Fecho')} week={week} />
      {L.sig[phase] ? <Signature color={L.sig[phase]} /> : null}
      <Guides T={T} beats={beats} safe={t.areasSeguras} showBeats={t.batidas} />
    </div>
  );
}

function ReelApp() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  window.__reelSet = setTweak;
  const week = window.AGENDA_WEEK || (t.semana === 'minima' ? MIN_WEEK : t.semana === 'cheia' ? FULL_WEEK : REAL_WEEK);
  const scenes = window.AGENDA_WEEK || t.semana === 'real' ? window.OM_SCENES : buildScenes(week);
  return (
    <>
      <CompositionStage key={t.semana} width={CW} height={CH} scenes={scenes} playback={window.OM_PLAYBACK} bg={PALETTES[t.paleta] ? PALETTES[t.paleta].bg : '#14110F'}>
        <Piece t={t} week={week} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Reel" />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={v => setTweak('motionEditor', v)} />
        <TweakSelect label="Layout" value={t.layout} options={[{ value: 'A', label: 'A · Cartaz' }, { value: 'B', label: 'B · Ingresso' }, { value: 'C', label: 'C · Lambe-lambe' }, { value: 'D', label: 'D · Tipográfico' }]} onChange={v => setTweak('layout', v)} />
        <TweakRadio label="Paleta" value={t.paleta} options={['amarelo', 'laranja', 'azul']} onChange={v => setTweak('paleta', v)} />
        <TweakRadio label="Fundo dos dias" value={t.fundo} options={[{ value: 'clipe', label: 'Clipe' }, { value: 'logo', label: 'Logo' }]} onChange={v => setTweak('fundo', v)} />
        <TweakSelect label="Semana de teste" value={t.semana} options={[{ value: 'real', label: 'Real · 9 shows' }, { value: 'minima', label: 'Mínima · 1 show' }, { value: 'cheia', label: 'Cheia · 15 shows, 6 dias' }]} onChange={v => setTweak('semana', v)} />
        <TweakSection label="Guias (desligar pra exportar)" />
        <TweakToggle label="Áreas seguras" value={t.areasSeguras} onChange={v => setTweak('areasSeguras', v)} />
        <TweakToggle label="Marcar batidas" value={t.batidas} onChange={v => setTweak('batidas', v)} />
      </TweaksPanel>
    </>
  );
}

window.LAYOUTS = window.LAYOUTS || {};
window.RC = { CW, CH, clamp01, lerp, MOTION, V, A, HALF, rng, torn, LOGOS, fmtHora, casaDe, weekRange, plural, dayWeights, dayTiming, accordion, MapCanvas, ClipPH, Logo, Tape, Slam };
window.ReelApp = ReelApp;
})();
