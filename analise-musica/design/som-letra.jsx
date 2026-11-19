// som-letra.jsx — modelo de reel "SOM x LETRA". Tudo é função de T (1 s de vídeo = 1 s de música).
// Todos os textos vêm do JSON (rotulos, marca, cta, anotacoes). Os valores abaixo são só fallback se faltar campo.
const SL_DADOS = (function () {
  try {
    const q = new URLSearchParams(location.search).get('json');
    if (q) { const x = new XMLHttpRequest(); x.open('GET', q, false); x.send(); if (x.status < 400) return JSON.parse(x.responseText); }
  } catch (e) { console.warn('som-letra: json inválido', e); }
  return window.SOM_LETRA_DADOS;
})();

const MOTION = { enter: Easing.easeOutCubic, draw: Easing.easeInOutCubic, pop: Easing.easeOutBack };
const cl = (v) => Math.max(0, Math.min(1, v));
const C = {
  bg: '#110F0D', paper: '#F3EFE6', som: '#FFCC1A', letra: '#E0361C', letraTxt: '#FF6B4A',
  mute: 'rgba(243,239,230,0.7)', dim: 'rgba(243,239,230,0.45)', line: 'rgba(243,239,230,0.14)',
};
const F = { sans: "'Archivo', system-ui, sans-serif", mono: "'Martian Mono', ui-monospace, monospace" };
const G = { W: 1080, H: 1920, L: 60, R: 1020, X0: 112, X1: 860, CT: 790, CB: 1150 };
const STEP = 0.45;

const fmt = (v, d = 2) => (v >= 0.005 ? '+' : v <= -0.005 ? '−' : '') + Math.abs(v).toFixed(d).replace('.', ',');
const fmtAbs = (v, d = 1) => Math.abs(v).toFixed(d).replace('.', ',');
const clock = (s) => { s = Math.max(0, Math.floor(s + 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const rise = (p, dy = 24) => ({ opacity: p, transform: `translateY(${((1 - p) * dy).toFixed(2)}px)` });

function monotone(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0]);
  const n = pts.length, xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  if (n === 1) return () => ys[0];
  const d = [], m = [];
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]);
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = 0; m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b;
    if (s > 9) { const t = 3 / Math.sqrt(s); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

function buildModel(D) {
  const R = Object.assign({
    titulo_chamada: 'SOM × LETRA', pergunta: D.musica || '', explicacao: '', mais_claro: 'MAIS CLARO', mais_escuro: 'MAIS ESCURO',
    media: 'média do disco', maior_distancia: 'MAIOR DISTÂNCIA', legenda_som: 'como soa', legenda_letra: 'o que a letra diz',
    legenda_incerteza_som: 'incerteza do modelo', legenda_incerteza_letra: 'variação entre leitores',
    legenda_secao: 'cada seção inteira (traço grosso)', legenda_linha: 'letra verso a verso · som em janelas de 30 s',
    legenda_vol_agu: '', veredito: '', veredito_sub: '',
    metodo: D.metodo || 'Som: MERT (m-a-p) + modelos treinados em notas de ouvintes (DEAM) · Letra: 5 leitores de IA (Claude) · Volume EBU R128 e agudos (centroide espectral), janelas de 8 s · Tempo da letra: LRCLIB',
  }, D.rotulos || {});
  const marca = Object.assign({ assinatura: D.assinatura || '', logo: '' }, D.marca || {});
  const ini = +D.trecho.ini_s, fim = +D.trecho.fim_s, dur = fim - ini;
  const [ymin, ymax] = D.eixo_sd || [-2.5, 2.5];
  const X = (m) => G.X0 + ((Math.max(ini, Math.min(fim, m)) - ini) / dur) * (G.X1 - G.X0);
  const Y = (v) => G.CT + ((ymax - Math.max(ymin, Math.min(ymax, v))) / (ymax - ymin)) * (G.CB - G.CT);
  const som = monotone(D.som.curva_30s);
  const vol = D.volume && D.volume.curva && D.volume.curva.length ? monotone(D.volume.curva) : null;
  const ag = D.agudos && D.agudos.curva && D.agudos.curva.length ? monotone(D.agudos.curva) : null;
  let vs = (D.letra.versos || []).slice();
  const va = D.letra.verso_anterior;
  if (va && va.sd != null) vs.push({ ...va, t: Math.min(+va.t, ini - 0.01), anterior: true });
  vs = vs.sort((a, b) => a.t - b.t);
  const emoKey = (v) => v.emocao_pt || v.emocao;
  const lastIdx = (m) => { let k = -1; for (let i = 0; i < vs.length; i++) if (vs[i].t <= m) k = i; return k; };
  const letraAt = (m) => {
    const k = lastIdx(m); if (k < 0) return null;
    const prev = k > 0 ? vs[k - 1].sd : vs[k].sd;
    return prev + (vs[k].sd - prev) * MOTION.draw(cl((m - vs[k].t) / STEP));
  };
  const letraFixa = (m) => { const k = lastIdx(m); return k < 0 ? null : vs[k].sd; };
  const streak = vs.map((v, i) => { let j = i; while (j > 0 && emoKey(vs[j - 1]) === emoKey(v)) j--; return j; });
  const marcos = vs.map((v, i) => i).filter(i => streak[i] === i);
  let md = D.maior_divergencia && D.maior_divergencia.t != null ? { t: +D.maior_divergencia.t } : null;
  if (!md && vs.length) {
    let best = -1, bt = ini;
    for (let m = ini; m <= fim; m += 0.1) { const g = Math.abs(som(m) - letraFixa(m)); if (g > best) { best = g; bt = m; } }
    md = { t: bt };
  }
  if (md) {
    md.rotulo = (D.maior_divergencia && D.maior_divergencia.rotulo) || R.maior_distancia;
    md.tx = Math.min(fim, md.t + STEP);
    md.som = som(md.tx); md.letra = letraFixa(md.tx);
    md.dist = Math.abs(md.som - md.letra);
  }
  const secoes = (D.secoes && D.secoes.length ? D.secoes : [{ nome: 'TRECHO', ini, fim }]).map(s => ({ ...s, ini: Math.max(ini, +s.ini), fim: Math.min(fim, +s.fim) }));
  const anot = (D.anotacoes || []).filter(a => a.tipo === 'variacao_som').map(a => {
    const de = +a.de_t, ate = +a.ate_t;
    const i = secoes.findIndex(s => de >= s.ini - 0.01 && de < s.fim);
    if (i < 1 || secoes[i].som_sd == null || secoes[i - 1].som_sd == null) return null;
    const diff = secoes[i].som_sd - secoes[i - 1].som_sd;
    const texto = String(a.texto || 'som {sinal}{valor} SD').replace('{sinal}', diff >= 0 ? '+' : '−').replace('{valor}', fmtAbs(diff, 2));
    return { de, ate, de0: secoes[i - 1].som_sd, para: secoes[i].som_sd, diff, texto, minimo: a.minimo != null ? +a.minimo : 0.2 };
  }).filter(Boolean);
  const leituras = (D.leituras || []).map(l => ({ t: +l.t, texto: l.texto })).sort((a, b) => a.t - b.t);
  const ticks = []; for (let s = Math.ceil(ini / 5) * 5; s <= fim + 1e-6; s += 5) ticks.push(s);
  const yt = []; for (let v = Math.ceil(ymin); v <= Math.floor(ymax); v++) yt.push(v);
  return { D, R, marca, ini, fim, dur, ymin, ymax, X, Y, som, vol, ag, vs, emoKey, lastIdx, letraAt, letraFixa, streak, marcos, md, secoes, anot, leituras, ticks, yt };
}

function pathOf(M, fn, a, b, st) {
  if (b <= a) return '';
  let d = '';
  for (let m = a; ; m += st) {
    const mm = Math.min(m, b), v = fn(mm);
    if (v != null) d += (d ? 'L' : 'M') + M.X(mm).toFixed(1) + ' ' + M.Y(v).toFixed(1);
    if (mm >= b) break;
  }
  return d;
}
function areaOf(M, top, bot, a, b, st) {
  if (b <= a) return '';
  const up = [], lo = [];
  for (let m = a; ; m += st) {
    const mm = Math.min(m, b), t = top(mm), u = bot(mm);
    if (t != null && u != null) { up.push(M.X(mm).toFixed(1) + ' ' + M.Y(t).toFixed(1)); lo.push(M.X(mm).toFixed(1) + ' ' + M.Y(u).toFixed(1)); }
    if (mm >= b) break;
  }
  if (!up.length) return '';
  return 'M' + up.join('L') + 'L' + lo.reverse().join('L') + 'Z';
}
function spread(items, minY, maxY) {
  const s = items.slice().sort((a, b) => a.y0 - b.y0);
  s.forEach(it => { it.y = it.y0; });
  for (let i = 1; i < s.length; i++) { const g = (s[i - 1].h + s[i].h) / 2 + 6; if (s[i].y - s[i - 1].y < g) s[i].y = s[i - 1].y + g; }
  if (s.length && s[s.length - 1].y > maxY) s[s.length - 1].y = maxY;
  for (let i = s.length - 2; i >= 0; i--) { const g = (s[i + 1].h + s[i].h) / 2 + 6; if (s[i + 1].y - s[i].y < g) s[i].y = s[i + 1].y - g; }
  if (s.length && s[0].y < minY) { const k = minY - s[0].y; s.forEach(it => { it.y += k; }); }
  return items;
}

// Fundo: vídeo mudo, pausado, com currentTime = inicio_s + T (determinístico). Sem vídeo: gradiente animado por T.
function Fundo({ M, T, tw }) {
  const fv = M.D.fundo_video || {};
  const src = tw.video === false ? '' : fv.src || '';
  const ref = React.useRef(null);
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => { setOk(false); }, [src]);
  React.useEffect(() => {
    const v = ref.current; if (!v || !ok) return;
    const d = v.duration || 0, base = (+fv.inicio_s || 0) + Math.max(0, T);
    const tgt = d > 0 ? (fv.loop === false ? Math.min(base, d - 0.05) : base % d) : base;
    if (Math.abs(v.currentTime - tgt) > 0.02) v.currentTime = tgt;
  });
  const a = T * 0.21, b = T * 0.13;
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', inset: 0, background: C.bg, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 540 - 650 + Math.sin(a) * 160, top: 520 - 650 + Math.cos(a * 0.8) * 220, width: 1300, height: 1300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,184,40,0.30), rgba(255,184,40,0) 62%)' }}></div>
        <div style={{ position: 'absolute', left: 620 - 700 + Math.cos(b) * 200, top: 1250 - 700 + Math.sin(b * 1.3) * 180, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,54,28,0.32), rgba(224,54,28,0) 62%)' }}></div>
        <div style={{ position: 'absolute', left: 200 - 500 + Math.sin(b * 1.7) * 120, top: 1500 - 500, width: 1000, height: 1000, borderRadius: '50%', background: 'radial-gradient(circle, rgba(70,90,120,0.30), rgba(70,90,120,0) 62%)' }}></div>
      </div>
      {src && (
        <video ref={ref} src={src} muted playsInline preload="auto" onLoadedMetadata={() => setOk(true)} onError={() => setOk(false)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: ok ? 1 : 0, filter: 'saturate(0.75) contrast(1.05)' }}></video>
      )}
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(14,12,10,${0.93 * tw.veu}) 0%, rgba(14,12,10,${0.84 * tw.veu}) 22%, rgba(14,12,10,${0.8 * tw.veu}) 40%, rgba(14,12,10,${0.84 * tw.veu}) 62%, rgba(14,12,10,${0.94 * tw.veu}) 78%, rgba(14,12,10,${0.98 * tw.veu}) 100%)` }}></div>
    </React.Fragment>
  );
}

function Selo({ src, size, style }) {
  if (!src) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flex: 'none', boxShadow: '0 0 0 2px rgba(243,239,230,0.85), 0 6px 18px rgba(0,0,0,0.45)', background: '#F3EFE6', ...style }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)', display: 'block' }}></img>
    </div>
  );
}

function Explicacao({ texto }) {
  const parts = String(texto).split(/(\((?:amarel|vermelh)\w*\))/i);
  return (
    <React.Fragment>
      {parts.map((p, i) => {
        const mt = p.match(/^\((amarel|vermelh)(\w*)\)$/i);
        if (!mt) return <span key={i}>{p}</span>;
        const s = /amarel/i.test(mt[1]), cor = s ? C.som : C.letraTxt;
        return (
          <span key={i} style={{ color: cor, fontWeight: 700, whiteSpace: 'nowrap' }}>
            <span style={{ display: 'inline-block', width: 30, height: 5, borderRadius: 3, background: s ? C.som : C.letra, verticalAlign: 'middle', margin: '0 8px 4px 6px' }}></span>{p.slice(1, -1)}
          </span>
        );
      })}
    </React.Fragment>
  );
}

function Header({ M, T, m }) {
  const D = M.D, R = M.R;
  const pq = String(R.pergunta).split(' ');
  const p = (d) => MOTION.enter(cl((T - d) / 0.7));
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 232, height: 60, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 20, ...rise(p(0), 12) }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.mono, fontSize: 21, fontWeight: 700, letterSpacing: '0.1em', color: C.som }}>
          <span style={{ width: 12, height: 12, borderRadius: 6, background: C.som, flex: 'none' }}></span>
          <span>{R.titulo_chamada}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: F.mono, fontSize: 21, color: C.paper }}>{M.marca.assinatura}</span>
          <Selo src={M.marca.logo} size={60}></Selo>
        </div>
      </div>
      <div style={{ position: 'absolute', left: G.L - 3, right: 1080 - G.R, top: 316, display: 'flex', flexWrap: 'wrap', columnGap: 20, fontFamily: F.sans, fontWeight: 800, fontStretch: '75%', fontSize: 82, lineHeight: 0.98, letterSpacing: '-0.012em', color: C.paper }}>
        {pq.map((w, i) => (
          <span key={i} style={{ display: 'inline-block', ...rise(p(0.1 + i * 0.07), 44) }}>{w}</span>
        ))}
      </div>
      {R.explicacao && (
        <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 486, fontFamily: F.sans, fontSize: 26, lineHeight: 1.34, fontWeight: 450, color: C.mute, textWrap: 'pretty', ...rise(p(0.55), 14) }}>
          <Explicacao texto={R.explicacao}></Explicacao>
        </div>
      )}
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 614, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 16, borderTop: '1.5px solid rgba(243,239,230,0.16)', ...rise(p(0.75), 12) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: F.sans, minWidth: 0 }}>
          <span style={{ fontSize: 44, fontWeight: 800, fontStretch: '85%', color: C.paper }}>{D.musica}</span>
          <span style={{ fontSize: 28, fontWeight: 500, color: C.mute }}>{D.banda} · {D.disco} ({D.ano})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, fontFamily: F.mono, fontVariantNumeric: 'tabular-nums' }}>
          <span style={{ fontSize: 34, fontWeight: 700, color: C.som }}>{clock(m)}</span>
          <span style={{ fontSize: 20, color: C.dim }}>/ {D.trecho.fim_rotulo || clock(M.fim)}</span>
        </div>
      </div>
    </React.Fragment>
  );
}

function Legend({ M, T }) {
  const D = M.D, R = M.R, p = MOTION.enter(cl((T - 0.5) / 0.7));
  const item = (cor, banda, op, nome, sub, unc, step) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <svg width="40" height="16" style={{ flex: 'none' }}><path d={step ? 'M2 4 H20 V12 H38' : 'M2 12 C14 12 20 4 38 4'} stroke={cor} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round"></path></svg>
        <span style={{ fontFamily: F.sans, fontSize: 28, fontWeight: 750, color: C.paper }}>{nome}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 40, height: 14, borderRadius: 3, background: banda, opacity: op, flex: 'none' }}></span>
        <span style={{ fontFamily: F.sans, fontSize: 20, color: C.mute }}>{sub} <span style={{ fontFamily: F.mono, fontSize: 18, color: C.paper }}>±{fmtAbs(unc, 2)} SD</span></span>
      </div>
    </div>
  );
  return (
    <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 690, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, ...rise(p, 14) }}>
      {item(C.som, C.som, 0.3, R.legenda_som, R.legenda_incerteza_som, D.som.incerteza_sd || 0, false)}
      {item(C.letra, C.letra, 0.5, R.legenda_letra, R.legenda_incerteza_letra, D.letra.incerteza_sd || 0, true)}
    </div>
  );
}

function Chart({ M, T, m, EX, tw }) {
  const { X, Y, ini, fim, md } = M;
  const g = MOTION.draw(cl((T - 0.2) / 1.3));
  const gx = G.X0 + (G.X1 - G.X0) * g;
  const uS = M.D.som.incerteza_sd || 0, uL = M.D.letra.incerteza_sd || 0;
  const somP = pathOf(M, M.som, ini, m, 0.2);
  const somB = areaOf(M, (t) => M.som(t) + uS, (t) => M.som(t) - uS, ini, m, 0.25);
  const letP = pathOf(M, M.letraAt, ini, m, 0.04);
  const letB = areaOf(M, (t) => { const v = M.letraAt(t); return v == null ? null : v + uL; }, (t) => { const v = M.letraAt(t); return v == null ? null : v - uL; }, ini, m, 0.04);
  const gap = areaOf(M, M.som, M.letraAt, ini, m, 0.1);
  const pe = cl((T - EX) / 1.6), pd = MOTION.draw(pe), xe = ini + pd * (m - ini);
  const volP = M.vol && pe > 0 ? pathOf(M, M.vol, ini, xe, 0.25) : '';
  const agP = M.ag && pe > 0 ? pathOf(M, M.ag, ini, xe, 0.25) : '';
  const cx = X(m), pulse = 0.5 + 0.5 * Math.sin(T * Math.PI * 2 * 0.8);
  const sv = M.som(m), lv = M.letraAt(m);
  const mdP = md ? MOTION.draw(cl((m - md.tx) / 0.7)) : 0;
  const lab = { fontFamily: F.mono, fontSize: 17, letterSpacing: '0.1em' };
  return (
    <svg width={G.W} height={G.H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <defs>
        <linearGradient id="sl-gap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.som} stopOpacity="0.14"></stop>
          <stop offset="1" stopColor={C.letra} stopOpacity="0.2"></stop>
        </linearGradient>
        <clipPath id="sl-clip"><rect x={G.X0} y={G.CT - 2} width={G.X1 - G.X0} height={G.CB - G.CT + 4}></rect></clipPath>
      </defs>
      {M.yt.map(v => (
        <g key={v} opacity={g}>
          <line x1={G.X0} x2={v === 0 ? G.R : gx} y1={Y(v)} y2={Y(v)} stroke={v === 0 ? C.mute : C.line} strokeWidth={v === 0 ? 2 : 1.5} strokeDasharray={v === 0 ? '10 10' : ''}></line>
          <text x={G.X0 - 14} y={Y(v) + 7} textAnchor="end" style={{ fontFamily: F.mono, fontSize: 19, fill: v === 0 ? C.paper : C.dim }}>{v === 0 ? '0' : fmt(v, 0)}</text>
        </g>
      ))}
      <g opacity={g}>
        <line x1={G.X0} x2={G.X0} y1={G.CT} y2={G.CB} stroke={C.line} strokeWidth="1.5"></line>
        <text x={G.X0 + 14} y={G.CT + 26} style={{ ...lab, fill: C.mute }}>↑ {M.R.mais_claro}</text>
        <text x={G.X0 + 14} y={G.CB - 14} style={{ ...lab, fill: C.mute }}>↓ {M.R.mais_escuro}</text>
        <text x={G.X1 + 18} y={Y(0) - 12} style={{ fontFamily: F.sans, fontSize: 19, fill: C.mute }}>{M.R.media}</text>
        <text x={G.X0 - 14} y={G.CT - 16} textAnchor="end" style={{ ...lab, fill: C.dim }}>SD</text>
        {M.secoes.slice(1).map((s, i) => (
          <line key={i} x1={X(s.ini)} x2={X(s.ini)} y1={G.CT} y2={G.CB} stroke={C.dim} strokeWidth="1.5" strokeDasharray="3 7"></line>
        ))}
        {M.ticks.map(s => (
          <text key={s} x={X(s)} y={G.CB + 32} textAnchor="middle" style={{ fontFamily: F.mono, fontSize: 19, fill: C.dim }}>{clock(s)}</text>
        ))}
      </g>
      {md && mdP > 0 && <line x1={X(md.tx)} x2={X(md.tx)} y1={G.CT} y2={G.CT + (G.CB - G.CT) * mdP} stroke={C.paper} strokeOpacity="0.5" strokeWidth="2" strokeDasharray="2 7" strokeLinecap="round"></line>}
      <g clipPath="url(#sl-clip)">
        <path d={gap} fill="url(#sl-gap)"></path>
        <path d={somB} fill={C.som} opacity="0.14"></path>
        <path d={letB} fill={C.letra} opacity="0.34"></path>
        {M.secoes.filter(s => s.ini < m && s.som_sd != null).map((s, i) => {
          const x1 = X(s.ini) + 4, x2 = X(Math.min(m, s.fim)) - 4;
          return x2 > x1 ? (
            <g key={i}>
              <line x1={x1} x2={x2} y1={Y(s.som_sd)} y2={Y(s.som_sd)} stroke={C.som} strokeOpacity="0.5" strokeWidth="16" strokeLinecap="round"></line>
              <line x1={x1} x2={x2} y1={Y(s.letra_sd)} y2={Y(s.letra_sd)} stroke={C.letra} strokeOpacity="0.55" strokeWidth="16" strokeLinecap="round"></line>
            </g>
          ) : null;
        })}
        {volP && <path d={volP} fill="none" stroke="#9FC6E8" strokeWidth="3" strokeLinejoin="round"></path>}
        {agP && <path d={agP} fill="none" stroke="#9FC6E8" strokeWidth="3.5" strokeDasharray="1 9" strokeLinecap="round"></path>}
        <path d={somP} fill="none" stroke={C.som} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d={letP} fill="none" stroke={C.letraTxt} strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </g>
      {M.anot.map((a, i) => {
        if (Math.abs(a.diff) < a.minimo && !tw.anotacoes) return null;
        const t0 = a.de + (a.ate - a.de) * 0.45, p = MOTION.draw(cl((m - t0) / 1.4));
        if (p <= 0) return null;
        const bx = X(a.de + (a.ate - a.de) * 0.6), y0 = Y(a.de0), y1 = Y(a.para);
        return (
          <g key={i} opacity={cl(p * 2)}>
            <line x1={X(a.de) + 4} x2={X(a.de) + 4 + (bx + 14 - X(a.de) - 4) * p} y1={y0} y2={y0} stroke={C.som} strokeWidth="2.5" strokeDasharray="2 7" strokeLinecap="round"></line>
            <path d={`M${bx + 14} ${y0} H${bx} V${y0 + (y1 - y0) * p} H${bx + 14}`} fill="none" stroke={C.som} strokeWidth="2.5" strokeLinejoin="round"></path>
          </g>
        );
      })}
      {md && mdP > 0 && (() => {
        const bx = X(md.tx), y1 = Y(md.som), y2 = Y(md.letra);
        return (
          <g>
            <line x1={bx} x2={bx} y1={y1} y2={y1 + (y2 - y1) * mdP} stroke={C.paper} strokeWidth="3"></line>
            <line x1={bx - 12} x2={bx + 12} y1={y1} y2={y1} stroke={C.paper} strokeWidth="3"></line>
            <line x1={bx - 12} x2={bx + 12} y1={y2} y2={y2} stroke={C.paper} strokeWidth="3" opacity={cl(mdP * 4 - 3)}></line>
          </g>
        );
      })()}
      <line x1={cx} x2={cx} y1={G.CT} y2={G.CB} stroke={C.paper} strokeOpacity="0.3" strokeWidth="2"></line>
      <circle cx={cx} cy={Y(sv)} r={16 + 8 * pulse} fill={C.som} opacity="0.2"></circle>
      <circle cx={cx} cy={Y(sv)} r="10" fill={C.som} stroke={C.bg} strokeWidth="4"></circle>
      {lv != null && <circle cx={cx} cy={Y(lv)} r={16 + 8 * (1 - pulse)} fill={C.letra} opacity="0.28"></circle>}
      {lv != null && <circle cx={cx} cy={Y(lv)} r="10" fill={C.letraTxt} stroke={C.bg} strokeWidth="4"></circle>}
      {pe > 0.98 && M.vol && <circle cx={cx} cy={Y(M.vol(m))} r="6" fill="#9FC6E8"></circle>}
      {pe > 0.98 && M.ag && <circle cx={cx} cy={Y(M.ag(m))} r="6" fill="#9FC6E8"></circle>}
    </svg>
  );
}

function ChartLabels({ M, T, m, EX, tw }) {
  const { X, Y, md, vs } = M;
  const cx = X(m);
  const sv = M.som(m), lv = M.letraAt(m), lf = M.letraFixa(m);
  const pv = MOTION.enter(cl((T - EX - 1.3) / 0.6));
  const items = [{ k: 'som', y0: Y(sv), h: 36 }];
  if (lv != null) items.push({ k: 'letra', y0: Y(lv), h: 36 });
  if (pv > 0 && M.vol) items.push({ k: 'vol', y0: Y(M.vol(m)), h: 26 });
  if (pv > 0 && M.ag) items.push({ k: 'ag', y0: Y(M.ag(m)), h: 26 });
  spread(items, G.CT + 18, G.CB - 18);
  const by = Object.fromEntries(items.map(i => [i.k, i.y]));
  const k = M.lastIdx(m);
  const emoTxt = (v) => tw.emocoes === 'EN' ? v.emocao : M.emoKey(v);
  const curStart = k >= 0 ? M.streak[k] : -1;
  const pp = k >= 0 ? (vs[curStart].t < M.ini ? 1 : MOTION.pop(cl((m - vs[curStart].t) / 0.55))) : 0;
  const slide = cl((cx - 700) / 160);
  const lx = cx + 24;
  const val = (cor, sz) => ({ position: 'absolute', left: lx, fontFamily: F.mono, fontWeight: 700, fontSize: sz, color: cor, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.6)' });
  const mdP = md ? MOTION.enter(cl((m - md.tx - 0.2) / 0.7)) : 0;
  const shown = M.anot.filter(a => Math.abs(a.diff) >= a.minimo || tw.anotacoes);
  return (
    <React.Fragment>
      <div style={{ ...val(C.som, 28), top: by.som - 14 }}>{fmt(sv)}</div>
      {lv != null && <div style={{ ...val(C.letraTxt, 28), top: by.letra - 14 }}>{fmt(lf)}</div>}
      {by.vol != null && <div style={{ ...val('#9FC6E8', 17), top: by.vol - 9, opacity: pv, fontWeight: 500 }}>vol {fmt(M.vol(m))}</div>}
      {by.ag != null && <div style={{ ...val('#9FC6E8', 17), top: by.ag - 9, opacity: pv, fontWeight: 500 }}>agu {fmt(M.ag(m))}</div>}
      {M.marcos.filter(i => vs[i].t <= m && i !== curStart && !(vs[i].t < M.ini && M.marcos.some(j => j > i && vs[j].t - M.ini < 3))).map(i => {
        const nxt = M.marcos.find(j => j > i), tc = nxt != null ? vs[nxt].t : m;
        const a = MOTION.enter(cl((m - tc) / 0.6));
        const x = X(vs[i].t);
        return (
          <div key={i} style={{ position: 'absolute', left: x + 6, top: Y(vs[i].sd) + 20, transformOrigin: '0 0', transform: `scale(${(1 - 0.4 * a).toFixed(3)})`, opacity: 1 - 0.35 * a, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.08em', color: C.letraTxt, padding: '6px 14px', borderRadius: 999, border: '2px solid rgba(255,107,74,0.6)', background: 'rgba(17,15,13,0.7)', whiteSpace: 'nowrap' }}>{emoTxt(vs[i])}</div>
        );
      })}
      {k >= 0 && (
        <div style={{ position: 'absolute', left: lx - 14, top: (by.letra != null ? by.letra : Y(lv)) + 30, transform: `translateX(${(-slide * 100).toFixed(2)}%) translateX(${(slide * -20).toFixed(1)}px)` }}>
          <div style={{ transform: `scale(${(0.55 + 0.45 * pp).toFixed(3)})`, transformOrigin: `${slide * 100}% 0%`, opacity: cl(pp * 1.6), background: C.letra, color: '#FFFFFF', fontFamily: F.mono, fontWeight: 700, fontSize: 27, letterSpacing: '0.1em', padding: '11px 20px 10px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(224,54,28,0.35)' }}>{emoTxt(vs[k])}</div>
        </div>
      )}
      {md && mdP > 0 && (
        <div style={{ position: 'absolute', right: G.W - X(md.tx) + 24, top: G.CT + 10, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, padding: '8px 12px', background: 'rgba(17,15,13,0.82)', borderRadius: 12, ...rise(mdP, 12) }}>
          <span style={{ fontFamily: F.mono, fontSize: 18, fontWeight: 700, letterSpacing: '0.12em', color: C.paper }}>{md.rotulo}</span>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontStretch: '75%', fontSize: 64, lineHeight: 0.95, color: C.paper, fontVariantNumeric: 'tabular-nums' }}>{fmtAbs(md.dist * mdP, 2)}<span style={{ fontSize: 30, color: C.mute }}> SD</span></span>
        </div>
      )}
      {shown.map((a, i) => {
        const t0 = a.de + (a.ate - a.de) * 0.45, p = MOTION.enter(cl((m - t0 - 0.6) / 0.7));
        if (p <= 0) return null;
        const bx = X(a.de + (a.ate - a.de) * 0.6);
        return <div key={i} style={{ position: 'absolute', left: bx - 8, top: Math.min(M.Y(a.de0), M.Y(a.para)) - 40, transform: 'translateX(-100%)', fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: C.som, whiteSpace: 'nowrap', textShadow: '0 2px 10px rgba(0,0,0,0.7)', ...rise(p, 10) }}>{a.texto}</div>;
      })}
    </React.Fragment>
  );
}

function BottomLegend({ M, T, EX }) {
  const R = M.R, p = MOTION.enter(cl((T - 0.8) / 0.7)), q = MOTION.enter(cl((T - EX - 0.4) / 0.8));
  const txt = { fontFamily: F.sans, fontSize: 20, color: C.mute };
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1206, display: 'flex', flexWrap: 'wrap', columnGap: 28, rowGap: 6, alignItems: 'center', opacity: p }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, ...txt }}>
          <svg width="36" height="16" style={{ flex: 'none' }}><line x1="7" x2="29" y1="8" y2="8" stroke={C.paper} strokeOpacity="0.55" strokeWidth="14" strokeLinecap="round"></line></svg>{R.legenda_secao}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, ...txt }}>
          <svg width="36" height="16" style={{ flex: 'none' }}><line x1="3" x2="33" y1="8" y2="8" stroke={C.paper} strokeWidth="4" strokeLinecap="round"></line></svg>{R.legenda_linha}
        </span>
      </div>
      {(M.vol || M.ag) && (
        <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1240, display: 'flex', alignItems: 'flex-start', gap: 12, ...txt, color: '#BFD8EE', ...rise(q, 8) }}>
          <svg width="36" height="22" style={{ flex: 'none' }}><line x1="3" x2="33" y1="7" y2="7" stroke="#9FC6E8" strokeWidth="3"></line><line x1="4" x2="33" y1="17" y2="17" stroke="#9FC6E8" strokeWidth="3.5" strokeDasharray="1 8" strokeLinecap="round"></line></svg>
          <span style={{ textWrap: 'pretty' }}>{R.legenda_vol_agu}</span>
        </div>
      )}
    </React.Fragment>
  );
}

function SectionBar({ M, T, m }) {
  const { X, R } = M, g = MOTION.enter(cl((T - 0.9) / 0.7));
  const top = 1360;
  return (
    <React.Fragment>
      {R.veredito && (
        <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1298, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 20, ...rise(g, 12) }}>
          <span style={{ fontFamily: F.sans, fontWeight: 800, fontStretch: '80%', fontSize: 42, lineHeight: 1, color: C.som }}>{R.veredito}</span>
          <span style={{ fontFamily: F.sans, fontSize: 19, color: C.mute, textAlign: 'right' }}>{R.veredito_sub}</span>
        </div>
      )}
      {M.secoes.map((s, i) => {
        const x1 = (i ? X(s.ini) : G.L) + (i ? 5 : 0), x2 = (i === M.secoes.length - 1 ? G.R : X(s.fim) - 5);
        const f = cl((m - s.ini) / (s.fim - s.ini)), on = m >= s.ini && (m < s.fim || i === M.secoes.length - 1);
        const v = MOTION.enter(cl((m - s.ini) / 1.2));
        const dif = s.som_sd != null && s.letra_sd != null ? s.som_sd - s.letra_sd : null;
        return (
          <div key={i} style={{ position: 'absolute', left: x1, width: x2 - x1, top, height: 76, borderRadius: 14, overflow: 'hidden', background: 'rgba(17,15,13,0.55)', boxShadow: on ? 'inset 0 0 0 2px rgba(243,239,230,0.5)' : 'inset 0 0 0 1.5px rgba(243,239,230,0.14)', opacity: g }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (f * 100).toFixed(2) + '%', background: 'linear-gradient(90deg, rgba(243,239,230,0.05), rgba(243,239,230,0.16))' }}></div>
            <div style={{ position: 'absolute', inset: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ fontFamily: F.mono, fontSize: 21, fontWeight: 700, letterSpacing: '0.1em', color: f > 0 ? C.paper : C.dim }}>{s.nome}</span>
              {dif != null && (
                <div style={{ display: 'flex', gap: 14, opacity: v, fontFamily: F.mono, fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.som }}><span style={{ width: 18, height: 9, borderRadius: 3, background: C.som }}></span>{fmt(s.som_sd * v)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, color: C.letraTxt }}><span style={{ width: 18, height: 9, borderRadius: 3, background: C.letra }}></span>{fmt(s.letra_sd * v)}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </React.Fragment>
  );
}

function Rodape({ M, T, m }) {
  const R = M.R, D = M.D, cta = D.cta || {};
  const c0 = cta.inicio_s != null ? +cta.inicio_s : null;
  const pc = c0 != null && (cta.linha1 || cta.linha2 || cta.linha3) ? cl((T - c0) / 1) : 0;
  const pm = MOTION.enter(cl((T - 1.1) / 0.8)) * (1 - MOTION.enter(cl(pc * 1.6)));
  const L = M.leituras;
  let k = -1; for (let i = 0; i < L.length; i++) if (L[i].t <= m) k = i;
  const line = MOTION.draw(cl((T - c0) / 0.8));
  const p1 = MOTION.enter(cl((T - c0 - 0.3) / 0.7)), p2 = MOTION.enter(cl((T - c0 - 0.65) / 0.7)), p3 = MOTION.enter(cl((T - c0 - 1.0) / 0.7));
  const ps = MOTION.pop(cl((T - c0 - 0.5) / 0.8));
  const arroba = M.marca.assinatura;
  const l3 = String(cta.linha3 || '');
  const l3parts = arroba && l3.includes(arroba) ? l3.split(arroba) : [l3];
  return (
    <React.Fragment>
      {k >= 0 && pc === 0 && (
        <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1458, fontFamily: F.sans, fontWeight: 650, fontSize: 34, lineHeight: 1.15, color: C.paper, textWrap: 'pretty', ...rise(MOTION.enter(cl((m - L[k].t) / 0.6)), 16) }}>{L[k].texto}</div>
      )}
      {k < 0 && pm > 0.01 && (
        <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1460, opacity: pm }}>
          <div style={{ fontFamily: F.sans, fontSize: 18, lineHeight: 1.4, color: C.dim, textWrap: 'pretty' }}>{R.metodo}</div>
          {D.status_numeros && <div style={{ marginTop: 6, fontFamily: F.mono, fontSize: 15, color: C.dim }}>números {String(D.status_numeros).split(':')[0]}</div>}
        </div>
      )}
      {pc > 0 && (
        <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1456 }}>
          <div style={{ height: 2, background: C.som, transformOrigin: '0 50%', transform: `scaleX(${line.toFixed(3)})`, opacity: 0.8 }}></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 26, paddingTop: 20 }}>
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cta.linha1 && <div style={{ fontFamily: F.sans, fontWeight: 800, fontStretch: '80%', fontSize: 44, lineHeight: 1.02, color: C.paper, textWrap: 'pretty', ...rise(p1, 18) }}>{cta.linha1}</div>}
              <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 18, rowGap: 4, alignItems: 'baseline' }}>
                {cta.linha2 && <span style={{ fontFamily: F.sans, fontSize: 26, fontWeight: 600, color: C.som, ...rise(p2, 12) }}>{cta.linha2}</span>}
                {cta.linha3 && (
                  <span style={{ fontFamily: F.sans, fontSize: 26, color: C.mute, ...rise(p3, 12) }}>
                    {l3parts.length > 1 ? l3parts.map((s, i) => (
                      <React.Fragment key={i}>{s}{i < l3parts.length - 1 && <span style={{ color: C.paper, fontWeight: 700 }}>{arroba}</span>}</React.Fragment>
                    )) : l3}
                  </span>
                )}
              </div>
            </div>
            <Selo src={M.marca.logo} size={104} style={{ opacity: cl(ps * 1.5), transform: `scale(${(0.6 + 0.4 * ps).toFixed(3)}) rotate(${((1 - ps) * -20).toFixed(1)}deg)` }}></Selo>
          </div>
        </div>
      )}
    </React.Fragment>
  );
}

function Reel({ tw }) {
  const comp = useComposition();
  const M = React.useMemo(() => buildModel(SL_DADOS), []);
  const T = window.SOM_LETRA_CAPA ? comp.authoredTotal : comp.T;
  const m = Math.min(M.fim, M.ini + Math.max(0, T));
  const EX = isFinite(comp.CUES.Fechamento) ? comp.CUES.Fechamento : M.dur - 4;
  return (
    <div data-screen-label={`t=${Math.floor(T)}s (${clock(m)})`} style={{ position: 'absolute', inset: 0, background: C.bg, overflow: 'hidden', fontFamily: F.sans }}>
      <Fundo M={M} T={T} tw={tw}></Fundo>
      <Header M={M} T={T} m={m}></Header>
      <Legend M={M} T={T}></Legend>
      <Chart M={M} T={T} m={m} EX={EX} tw={tw}></Chart>
      <ChartLabels M={M} T={T} m={m} EX={EX} tw={tw}></ChartLabels>
      <BottomLegend M={M} T={T} EX={EX}></BottomLegend>
      <SectionBar M={M} T={T} m={m}></SectionBar>
      <Rodape M={M} T={T} m={m}></Rodape>
      {tw.zonas && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220, background: 'rgba(255,0,80,0.22)', borderBottom: '2px dashed #ff3d7f', display: 'flex', alignItems: 'flex-end', padding: 12, fontFamily: F.mono, fontSize: 18, color: '#ff8fb3' }}>ZONA DO IG · 220 px</div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, background: 'rgba(255,0,80,0.22)', borderTop: '2px dashed #ff3d7f', padding: 12, fontFamily: F.mono, fontSize: 18, color: '#ff8fb3' }}>ZONA DO IG · 380 px</div>
        </React.Fragment>
      )}
    </div>
  );
}

function SomLetraReel() {
  const [tw, setTweak] = useTweaks(Object.assign({ motionEditor: true, emocoes: 'PT', zonas: false, anotacoes: false, video: true, veu: 1 }, window.TWEAK_DEFAULTS || {}));
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>
      <CompositionStage width={1080} height={1920} bg={C.bg} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} autoplay={!window.SOM_LETRA_CAPA}>
        <Reel tw={tw}></Reel>
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Reel"></TweakSection>
        <TweakRadio label="Emoções" value={tw.emocoes} options={['PT', 'EN']} onChange={(v) => setTweak('emocoes', v)}></TweakRadio>
        <TweakToggle label="Vídeo de fundo" value={tw.video} onChange={(v) => setTweak('video', v)}></TweakToggle>
        <TweakSlider label="Véu escuro" value={tw.veu} min={0.6} max={1.05} step={0.05} onChange={(v) => setTweak('veu', v)}></TweakSlider>
        <TweakToggle label="Mostrar variação do som mesmo se pequena" value={tw.anotacoes} onChange={(v) => setTweak('anotacoes', v)}></TweakToggle>
        <TweakToggle label="Zonas seguras do Reels" value={tw.zonas} onChange={(v) => setTweak('zonas', v)}></TweakToggle>
        <TweakToggle label="Motion editor" value={tw.motionEditor} onChange={(v) => setTweak('motionEditor', v)}></TweakToggle>
      </TweaksPanel>
    </div>
  );
}

window.somLetraRender = function (t) {
  const el = document.querySelector('[data-om-exportable-video-with-duration-secs]');
  if (el) el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t, sync: true } }));
};
window.SomLetraReel = SomLetraReel;
