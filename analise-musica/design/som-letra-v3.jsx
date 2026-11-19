// som-letra-v3.jsx — v2 + camada técnica discreta (eixo SD, incertezas, valores, volume/agudos, médias por seção, método). Reel "SOM x LETRA" v2: abertura cinética (abertura.duracao_s) + gráfico em tempo real.
// Tudo é função de T. Gráfico: m = trecho.ini_s + (T − abertura). Textos vêm do JSON.
const SL_DADOS = (function () {
  try {
    const q = new URLSearchParams(location.search).get('json');
    if (q) { const x = new XMLHttpRequest(); x.open('GET', q, false); x.send(); if (x.status < 400) return JSON.parse(x.responseText); }
  } catch (e) { console.warn('som-letra: json inválido', e); }
  return window.SOM_LETRA_DADOS;
})();

const EZ = { out: Easing.easeOutCubic, io: Easing.easeInOutCubic, back: Easing.easeOutBack };
const cl = (v) => Math.max(0, Math.min(1, v));
const C = { bg: '#100E0C', paper: '#F6F2EA', som: '#FFCC1A', letra: '#E8391E', letraTxt: '#FF6B4A', mute: 'rgba(246,242,234,0.78)', dim: 'rgba(246,242,234,0.5)', line: 'rgba(246,242,234,0.16)' };
const F = { sans: "'Archivo', system-ui, sans-serif", mono: "'Martian Mono', ui-monospace, monospace" };
const G = { W: 1080, H: 1920, L: 60, R: 1020, X0: 108, X1: 900, CT: 700, CB: 1150 };
const STEP = 0.45;
const TEC = { fontFamily: "'Martian Mono', ui-monospace, monospace", color: 'rgba(246,242,234,0.55)', fontVariantNumeric: 'tabular-nums' };
const fmt = (v, d = 2) => (v >= 0.005 ? '+' : v <= -0.005 ? '−' : '') + Math.abs(v).toFixed(d).replace('.', ',');
const SH = '0 2px 18px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.6)';
const clock = (s) => { s = Math.max(0, Math.floor(s + 1e-6)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const fmtAbs2 = (v) => Math.abs(v).toFixed(2).replace('.', ',');
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
  const R = Object.assign({ titulo_chamada: '', pergunta: D.musica || '', mais_claro: 'mais luz', mais_escuro: 'mais sombra', media: 'média do disco', maior_distancia: 'MAIOR DISTÂNCIA', legenda_som: 'o que você ouve', legenda_letra: 'o que a letra diz' }, D.rotulos || {});
  const marca = Object.assign({ assinatura: '', logo: '' }, D.marca || {});
  const ab = Object.assign({ duracao_s: 0, frases: [], clipes: [] }, D.abertura || {});
  const A = +ab.duracao_s || 0;
  const ini = +D.trecho.ini_s, fim = +D.trecho.fim_s, dur = fim - ini;
  const [ymin, ymax] = D.eixo_sd || [-2.5, 2.5];
  const X = (m) => G.X0 + ((Math.max(ini, Math.min(fim, m)) - ini) / dur) * (G.X1 - G.X0);
  const Y = (v) => G.CT + ((ymax - Math.max(ymin, Math.min(ymax, v))) / (ymax - ymin)) * (G.CB - G.CT);
  const som = monotone(D.som.curva_30s);
  const vol = D.volume && D.volume.curva && D.volume.curva.length ? monotone(D.volume.curva) : null;
  const ag = D.agudos && D.agudos.curva && D.agudos.curva.length ? monotone(D.agudos.curva) : null;
  const volIni = D.volume && D.volume.inicio_s != null ? +D.volume.inicio_s : (D.cta && D.cta.inicio_s != null ? +D.cta.inicio_s - 4 : dur - 6);
  let vs = (D.letra.versos || []).slice();
  const va = D.letra.verso_anterior;
  if (va && va.sd != null) vs.push({ ...va, t: Math.min(+va.t, ini - 0.01), anterior: true });
  vs = vs.sort((a, b) => a.t - b.t);
  const emo = (v) => v.emocao_pt || v.emocao;
  const lastIdx = (m) => { let k = -1; for (let i = 0; i < vs.length; i++) if (vs[i].t <= m) k = i; return k; };
  const letraAt = (m) => {
    const k = lastIdx(m); if (k < 0) return null;
    const prev = k > 0 ? vs[k - 1].sd : vs[k].sd;
    return prev + (vs[k].sd - prev) * EZ.io(cl((m - vs[k].t) / STEP));
  };
  const letraFixa = (m) => { const k = lastIdx(m); return k < 0 ? null : vs[k].sd; };
  // emoções reveladas em ordem (só versos do trecho); destaque = emoção do verso mais escuro
  const reveal = [];
  vs.forEach(v => { if (!v.anterior && v.t <= fim && !reveal.find(r => r.nome === emo(v))) reveal.push({ nome: emo(v), en: v.emocao, t: v.t }); });
  const vin = vs.filter(v => !v.anterior);
  const darkest = vin.length ? vin.reduce((a, b) => (b.sd < a.sd ? b : a)) : null;
  const destaque = darkest ? emo(darkest) : null;
  const marcos = vs.map((v, i) => i).filter(i => !vs[i].anterior && (i === 0 || vs[i - 1].anterior || emo(vs[i - 1]) !== emo(vs[i])));
  let md = D.maior_divergencia && D.maior_divergencia.t != null ? { t: +D.maior_divergencia.t } : null;
  if (!md && vin.length) {
    let best = -1, bt = ini;
    for (let m = vin[0].t; m <= fim; m += 0.1) { const g = Math.abs(som(m) - letraFixa(m)); if (g > best) { best = g; bt = m; } }
    md = { t: bt };
  }
  if (md) { md.rotulo = (D.maior_divergencia && D.maior_divergencia.rotulo) || R.maior_distancia; md.tx = Math.min(fim, md.t + STEP); md.som = som(md.tx); md.letra = letraFixa(md.tx); }
  const secoes = (D.secoes || []).map(s => ({ ...s, ini: Math.max(ini, +s.ini), fim: Math.min(fim, +s.fim) }));
  const momentos = (D.momentos || []).map(x => ({ t: +x.t_musica, texto: x.texto })).sort((a, b) => a.t - b.t);
  const ticks = []; for (let s = Math.ceil(ini / 5) * 5; s <= fim + 1e-6; s += 5) ticks.push(s);
  const yt = []; for (let v = Math.ceil(ymin); v <= Math.floor(ymax); v++) yt.push(v);
  return { D, R, marca, ab, A, ini, fim, dur, ymin, ymax, X, Y, som, vol, ag, volIni, yt, vs, emo, lastIdx, letraAt, letraFixa, reveal, destaque, marcos, md, secoes, momentos, ticks };
}

function pathOf(M, fn, a, b, st) {
  if (b <= a) return '';
  let d = '';
  for (let m = a; ; m += st) { const mm = Math.min(m, b), v = fn(mm); if (v != null) d += (d ? 'L' : 'M') + M.X(mm).toFixed(1) + ' ' + M.Y(v).toFixed(1); if (mm >= b) break; }
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
  return up.length ? 'M' + up.join('L') + 'L' + lo.reverse().join('L') + 'Z' : '';
}

// Palavras-chave coloridas: letra/Eddie → vermelho; música/som → amarelo
function Colorido({ texto, wordStyle }) {
  const ws = String(texto).split(' ');
  return ws.map((w, i) => {
    const k = w.toLowerCase().replace(/[^a-zà-ú]/g, '');
    const cor = /^(letra|eddie|canta)$/.test(k) ? C.letraTxt : /^(música|musica|som|ouve)$/.test(k) ? C.som : null;
    const st = wordStyle ? wordStyle(i, ws.length) : {};
    return <span key={i} style={{ display: 'inline-block', color: cor || undefined, ...st }}>{w}</span>;
  });
}

// Vídeo mudo sincronizado ao tempo: currentTime = t (pausado). Sem arquivo: placeholder visível e determinístico.
function Clip({ src, t, hue = 30, label, style, ativo = true, dimLabel }) {
  const ref = React.useRef(null);
  const [ok, setOk] = React.useState(false);
  React.useEffect(() => { const v = ref.current; setOk(!!(v && v.readyState >= 2)); }, [src]);
  React.useEffect(() => {
    const v = ref.current; if (!v || !ok || !ativo) return;
    const d = v.duration || 0, tgt = d > 0 ? ((t % d) + d) % d : t;
    if (Math.abs(v.currentTime - tgt) > 0.02) v.currentTime = tgt;
  });
  const a = t * 0.6;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: `hsl(${hue} 30% 12%)`, ...style }}>
      {!ok && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 540 - 800 + Math.sin(a) * 180, top: 700 - 800 + Math.cos(a * 0.7) * 240, width: 1600, height: 1600, borderRadius: '50%', background: `radial-gradient(circle, hsl(${hue} 70% 48% / 0.55), transparent 60%)` }}></div>
          <div style={{ position: 'absolute', left: 600 - 700 + Math.cos(a * 0.8) * 220, top: 1300 - 700 + Math.sin(a) * 200, width: 1400, height: 1400, borderRadius: '50%', background: `radial-gradient(circle, hsl(${(hue + 40) % 360} 60% 38% / 0.5), transparent 60%)` }}></div>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 2px, transparent 2px 26px)' }}></div>
          {label && <div style={{ position: 'absolute', left: 0, right: 0, top: dimLabel ? 1575 : 960, textAlign: 'center', fontFamily: F.mono, fontSize: dimLabel ? 18 : 24, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.55)' }}>[ vídeo: {label} ]</div>}
        </React.Fragment>
      )}
      {src && <video ref={ref} src={src} muted playsInline preload="auto" onLoadedData={() => setOk(true)} onCanPlay={() => setOk(true)} onError={() => setOk(false)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: ok ? 1 : 0 }}></video>}
    </div>
  );
}

function Selo({ src, size, style }) {
  if (!src) return null;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flex: 'none', boxShadow: '0 0 0 2px rgba(246,242,234,0.9), 0 6px 20px rgba(0,0,0,0.5)', background: '#F3EFE6', ...style }}>
      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scale(1.1)', display: 'block' }}></img>
    </div>
  );
}

// ---------- ABERTURA ----------
function Abertura({ M, T }) {
  const { ab, A } = M;
  const clipes = ab.clipes && ab.clipes.length ? ab.clipes : [''];
  const cut = +ab.corte_s || 0.62;
  const ci = Math.floor(T / cut), local = T - ci * cut, idx = ci % clipes.length;
  const zin = ci % 2 === 0;
  const z = zin ? 1.16 - 0.12 * EZ.out(local / cut) : 1.02 + 0.1 * EZ.io(local / cut);
  const pan = (ci % 3 - 1) * 30 * (local / cut);
  const flash = ci > 0 ? cl(1 - local / 0.13) * 0.7 : 0;
  const out = cl((T - A + 0.25) / 0.25);
  const fr = ab.frases || [];
  let k = -1; fr.forEach((f, i) => { if (T >= f.t0 - 0.05) k = i; });
  const top = EZ.out(cl(T / 0.5));
  return (
    <div style={{ position: 'absolute', inset: 0, opacity: 1 - out }}>
      <div style={{ position: 'absolute', inset: 0, transform: `scale(${z.toFixed(4)}) translateX(${pan.toFixed(1)}px)` }}>
        {clipes.map((c, i) => (
          <Clip key={i} src={c} t={i === idx ? local + (ab.clipes_inicio_s || 0) : 0} ativo={i === idx} hue={(20 + i * 47) % 360} label={c} style={{ opacity: i === idx ? 1 : 0 }}></Clip>
        ))}
      </div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,8,7,0.7) 0%, rgba(10,8,7,0.15) 22%, rgba(10,8,7,0.2) 45%, rgba(10,8,7,0.78) 75%, rgba(10,8,7,0.9) 100%)' }}></div>
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash }}></div>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 236, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...rise(top, 12) }}>
        <span style={{ fontFamily: F.mono, fontSize: 21, fontWeight: 700, letterSpacing: '0.1em', color: C.som, textShadow: SH }}>{M.R.titulo_chamada}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: F.mono, fontSize: 21, color: C.paper, textShadow: SH }}>{M.marca.assinatura}</span>
          <Selo src={M.marca.logo} size={58}></Selo>
        </div>
      </div>
      {k >= 0 && (() => {
        const f = fr[k], ws = String(f.texto).split(' '), n = ws.length;
        const span = Math.max(0.3, (f.t1 - f.t0) * 0.8);
        const nxt = fr[k + 1];
        const leave = nxt ? cl((T - (nxt.t0 - 0.12)) / 0.12) : 0;
        const last = k === fr.length - 1;
        const size = n > 6 ? 108 : 128;
        return (
          <div key={k} style={{ position: 'absolute', left: G.L - 4, right: 1080 - G.R, bottom: 420, display: 'flex', flexWrap: 'wrap', columnGap: size * 0.24, rowGap: 0, alignItems: 'baseline', fontFamily: F.sans, fontWeight: 850, fontStretch: '72%', fontSize: size, lineHeight: 0.96, letterSpacing: '-0.015em', color: C.paper, textShadow: '0 6px 40px rgba(0,0,0,0.7)', opacity: 1 - leave, transform: `scale(${(1 + 0.04 * leave).toFixed(3)})`, transformOrigin: '0 100%' }}>
            <Colorido texto={f.texto} wordStyle={(i) => {
              const tw = f.t0 + (span * i) / Math.max(1, n);
              const e = EZ.back(cl((T - tw) / 0.3));
              return { opacity: cl(e * 2), transform: `translateY(${((1 - e) * 50).toFixed(1)}px) scale(${(0.86 + 0.14 * e).toFixed(3)})`, transformOrigin: '0 100%' };
            }}></Colorido>
          </div>
        );
      })()}
    </div>
  );
}

// ---------- GRÁFICO ----------
function Chart({ M, g, m, gIn }) {
  const { X, Y, ini, md } = M;
  const uS = M.D.som.incerteza_sd || 0, uL = M.D.letra.incerteza_sd || 0;
  const somP = pathOf(M, M.som, ini, m, 0.2);
  const somB = areaOf(M, (t) => M.som(t) + uS, (t) => M.som(t) - uS, ini, m, 0.25);
  const letP = pathOf(M, M.letraAt, ini, m, 0.04);
  const letB = areaOf(M, (t) => M.letraAt(t) + uL, (t) => M.letraAt(t) - uL, ini, m, 0.04);
  const gap = areaOf(M, M.som, M.letraAt, ini, m, 0.1);
  const pe = EZ.io(cl((g - M.volIni) / 1.6)), xe = ini + pe * (m - ini);
  const volP = M.vol && pe > 0 ? pathOf(M, M.vol, ini, xe, 0.25) : '';
  const agP = M.ag && pe > 0 ? pathOf(M, M.ag, ini, xe, 0.25) : '';
  const cx = X(m), pulse = 0.5 + 0.5 * Math.sin(g * Math.PI * 1.6);
  const sv = M.som(m), lv = M.letraAt(m);
  const dm = md ? m - md.tx : -1;
  const mdP = md ? EZ.io(cl(dm / 0.6)) : 0;
  const bump = md && dm > 0 ? Math.exp(-dm * 1.4) : 0;
  const ax = EZ.io(cl(gIn / 1));
  return (
    <svg width={G.W} height={G.H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <defs>
        <linearGradient id="v2-gap" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={C.som} stopOpacity={0.22 + 0.3 * bump}></stop>
          <stop offset="1" stopColor={C.letra} stopOpacity={0.28 + 0.35 * bump}></stop>
        </linearGradient>
        <clipPath id="v2-clip"><rect x={G.X0} y={G.CT - 30} width={G.X1 - G.X0} height={G.CB - G.CT + 60}></rect></clipPath>
        <filter id="v2-glow" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="8"></feGaussianBlur></filter>
      </defs>
      <g opacity={ax}>
        {M.yt.filter(v => v !== 0).map(v => <line key={v} x1={G.X0} x2={G.X1} y1={Y(v)} y2={Y(v)} stroke={C.paper} strokeOpacity="0.08" strokeWidth="1.5"></line>)}
        {M.yt.map(v => <text key={'t' + v} x={G.X0 - 12} y={Y(v) + 6} textAnchor="end" style={{ ...TEC, fontSize: 17, fill: v === 0 ? 'rgba(246,242,234,0.75)' : 'rgba(246,242,234,0.5)' }}>{v === 0 ? '0' : fmt(v, 0)}</text>)}
        <text x={G.X0 - 12} y={G.CT - 18} textAnchor="end" style={{ ...TEC, fontSize: 14, fill: 'rgba(246,242,234,0.45)' }}>SD</text>
        <line x1={G.X0} x2={G.X0 + (G.R - G.X0) * ax} y1={Y(0)} y2={Y(0)} stroke={C.paper} strokeOpacity="0.55" strokeWidth="2" strokeDasharray="10 10"></line>
        <text x={G.R} y={Y(0) - 14} textAnchor="end" style={{ fontFamily: F.sans, fontSize: 22, fill: C.mute }}>{M.R.media}</text>
        {M.secoes.slice(1).map((s, i) => <line key={i} x1={X(s.ini)} x2={X(s.ini)} y1={G.CT} y2={G.CB} stroke={C.dim} strokeWidth="1.5" strokeDasharray="3 8"></line>)}
        {M.ticks.map(s => <text key={s} x={X(s)} y={G.CB + 40} textAnchor="middle" style={{ ...TEC, fontSize: 16, fill: 'rgba(246,242,234,0.5)' }}>{clock(s)}</text>)}
      </g>
      <g clipPath="url(#v2-clip)">
        <path d={somB} fill={C.som} opacity="0.12"></path>
        <path d={letB} fill={C.letra} opacity="0.3"></path>
        <path d={gap} fill="url(#v2-gap)"></path>
        {M.vol && volP && <path d={volP} fill="none" stroke="#9FC6E8" strokeOpacity="0.8" strokeWidth="2.5" strokeLinejoin="round"></path>}
        {M.ag && agP && <path d={agP} fill="none" stroke="#9FC6E8" strokeOpacity="0.8" strokeWidth="3" strokeDasharray="1 8" strokeLinecap="round"></path>}
        <path d={somP} fill="none" stroke={C.som} strokeOpacity="0.5" strokeWidth="14" filter="url(#v2-glow)"></path>
        <path d={letP} fill="none" stroke={C.letra} strokeOpacity="0.55" strokeWidth="14" filter="url(#v2-glow)"></path>
        <path d={somP} fill="none" stroke={C.som} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d={letP} fill="none" stroke={C.letraTxt} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"></path>
      </g>
      {md && mdP > 0 && (() => {
        const bx = X(md.tx), y1 = Y(md.som), y2 = Y(md.letra);
        return (
          <g>
            {[0, 0.35, 0.7].map((d, i) => {
              const r = cl((dm - d) / 1.1);
              return r > 0 && r < 1 ? (
                <g key={i} opacity={(1 - r) * 0.9}>
                  <circle cx={bx} cy={y1} r={12 + r * 90} fill="none" stroke={C.som} strokeWidth="3"></circle>
                  <circle cx={bx} cy={y2} r={12 + r * 90} fill="none" stroke={C.letraTxt} strokeWidth="3"></circle>
                </g>
              ) : null;
            })}
            <line x1={bx} x2={bx} y1={y1} y2={y1 + (y2 - y1) * mdP} stroke="#fff" strokeOpacity={0.35 + 0.5 * bump} strokeWidth={14 + 16 * bump} filter="url(#v2-glow)"></line>
            <line x1={bx} x2={bx} y1={y1} y2={y1 + (y2 - y1) * mdP} stroke="#fff" strokeWidth="4"></line>
            <line x1={bx - 16} x2={bx + 16} y1={y1} y2={y1} stroke="#fff" strokeWidth="4" strokeLinecap="round"></line>
            <line x1={bx - 16} x2={bx + 16} y1={y2} y2={y2} stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity={cl(mdP * 4 - 3)}></line>
          </g>
        );
      })()}
      <line x1={cx} x2={cx} y1={G.CT - 20} y2={G.CB} stroke={C.paper} strokeOpacity={0.35 * ax} strokeWidth="2"></line>
      <circle cx={cx} cy={Y(sv)} r={18 + 10 * pulse} fill={C.som} opacity={0.25 * ax}></circle>
      <circle cx={cx} cy={Y(sv)} r="13" fill={C.som} stroke={C.bg} strokeWidth="4" opacity={ax}></circle>
      {lv != null && <circle cx={cx} cy={Y(lv)} r={18 + 10 * (1 - pulse)} fill={C.letra} opacity={0.3 * ax}></circle>}
      {lv != null && <circle cx={cx} cy={Y(lv)} r="13" fill={C.letraTxt} stroke={C.bg} strokeWidth="4" opacity={ax}></circle>}
      {pe > 0.98 && M.vol && <circle cx={cx} cy={Y(M.vol(m))} r="5" fill="#9FC6E8"></circle>}
      {pe > 0.98 && M.ag && <circle cx={cx} cy={Y(M.ag(m))} r="5" fill="#9FC6E8"></circle>}
    </svg>
  );
}

function ChartLabels({ M, m, tw, gIn }) {
  const { X, Y, md, vs } = M;
  const cx = X(m), lv = M.letraAt(m);
  const k = M.lastIdx(m);
  const name = (v) => (tw.emocoes === 'EN' ? v.emocao : M.emo(v));
  const cur = k >= 0 && !vs[k].anterior ? (() => { let j = k; while (j > 0 && !vs[j - 1].anterior && M.emo(vs[j - 1]) === M.emo(vs[k])) j--; return j; })() : -1;
  const hot = cur >= 0 && M.emo(vs[cur]) === M.destaque;
  const pp = cur >= 0 ? EZ.back(cl((m - vs[cur].t) / 0.5)) : 0;
  const slide = cl((cx - 640) / 220);
  const dm = md ? m - md.tx : -1;
  const mdP = md ? EZ.back(cl((dm - 0.15) / 0.55)) : 0;
  const ax = EZ.out(cl(gIn / 0.8));
  const sv = M.som(m), lf = M.letraFixa(m);
  const ys = Y(sv), yl = lv != null ? Y(lv) : null;
  let a1 = ys, a2 = yl;
  if (yl != null && Math.abs(a2 - a1) < 30) { const c = (a1 + a2) / 2, s = a2 >= a1 ? 1 : -1; a1 = c - 15 * s; a2 = c + 15 * s; }
  const tv = { position: 'absolute', left: cx + 24, ...TEC, fontSize: 19, fontWeight: 700, lineHeight: 1, whiteSpace: 'nowrap', textShadow: SH, opacity: 0.9 * ax };
  return (
    <React.Fragment>
      <div style={{ ...tv, top: a1 - 10, color: C.som }}>{fmt(sv)}</div>
      {lf != null && <div style={{ ...tv, top: a2 - 10, color: C.letraTxt }}>{fmt(lf)}</div>}
      {md && mdP > 0 && <div style={{ position: 'absolute', left: X(md.tx) + 14, top: (Y(md.som) + Y(md.letra)) / 2 - 10, ...TEC, fontSize: 18, color: 'rgba(246,242,234,0.8)', whiteSpace: 'nowrap', textShadow: SH, opacity: cl(mdP) }}>{fmtAbs2(Math.abs(md.som - md.letra))} SD</div>}
      <div style={{ position: 'absolute', left: G.X0 + 4, top: G.CT - 52, fontFamily: F.sans, fontSize: 26, fontWeight: 700, color: C.paper, textShadow: SH, opacity: ax }}>↑ {M.R.mais_claro}</div>
      <div style={{ position: 'absolute', left: G.X0 + 4, top: G.CB + 58, visibility: M.D.cta && M.D.cta.inicio_s != null && m - M.ini >= +M.D.cta.inicio_s ? 'hidden' : 'visible', fontFamily: F.sans, fontSize: 26, fontWeight: 700, color: C.paper, textShadow: SH, opacity: ax }}>↓ {M.R.mais_escuro}</div>
      {M.marcos.filter(i => vs[i].t <= m && i !== cur).map(i => {
        const nx = M.marcos.find(j => j > i), a = EZ.out(cl((m - (nx != null ? vs[nx].t : m)) / 0.6));
        return <div key={i} style={{ position: 'absolute', left: X(vs[i].t) + 6, top: Y(vs[i].sd) + 26, transformOrigin: '0 0', transform: `scale(${(1 - 0.35 * a).toFixed(3)})`, opacity: 1 - 0.35 * a, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.06em', color: C.letraTxt, padding: '6px 14px', borderRadius: 999, border: '2px solid rgba(255,107,74,0.7)', background: 'rgba(16,14,12,0.75)', whiteSpace: 'nowrap' }}>{name(vs[i])}</div>;
      })}
      {cur >= 0 && (
        <div style={{ position: 'absolute', left: cx, top: Y(lv) + 30, transform: `translateX(${(-slide * 100).toFixed(2)}%) translateX(${(slide * 20 - 20).toFixed(1)}px)` }}>
          <div style={{ transform: `scale(${(0.5 + 0.5 * pp).toFixed(3)})`, transformOrigin: `${slide * 100}% 0%`, opacity: cl(pp * 1.6), background: C.letra, color: '#fff', fontFamily: F.mono, fontWeight: 700, fontSize: hot ? 34 : 28, letterSpacing: '0.08em', padding: hot ? '14px 26px 13px' : '11px 20px 10px', borderRadius: 999, whiteSpace: 'nowrap', boxShadow: hot ? `0 0 0 ${(4 + 4 * Math.sin(m * 5)).toFixed(1)}px rgba(232,57,30,0.3), 0 12px 40px rgba(232,57,30,0.6)` : '0 10px 30px rgba(232,57,30,0.4)' }}>{name(vs[cur])}</div>
        </div>
      )}
      {md && mdP > 0 && (
        <div style={{ position: 'absolute', left: X(md.tx), top: Y(md.som) - 84, transform: `translateX(-50%) scale(${(0.6 + 0.4 * mdP).toFixed(3)})`, transformOrigin: '50% 100%', opacity: cl(mdP * 1.5), background: '#fff', color: C.bg, fontFamily: F.mono, fontWeight: 700, fontSize: 24, letterSpacing: '0.12em', padding: '12px 20px 11px', borderRadius: 10, whiteSpace: 'nowrap', boxShadow: '0 10px 40px rgba(255,255,255,0.25)' }}>{md.rotulo}</div>
      )}
    </React.Fragment>
  );
}

function GraficoTopo({ M, g, m }) {
  const p = (d) => EZ.out(cl((g - d) / 0.6));
  const L = M.momentos;
  let k = -1; L.forEach((x, i) => { if (x.t <= m) k = i; });
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 236, display: 'flex', justifyContent: 'space-between', alignItems: 'center', ...rise(p(0), 12) }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: F.sans, textShadow: SH }}>
          <span style={{ fontSize: 60, fontWeight: 850, fontStretch: '78%', color: C.paper, lineHeight: 1 }}>{M.D.musica}</span>
          <span style={{ fontSize: 28, fontWeight: 500, color: C.mute }}>{M.D.banda}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: F.mono, fontSize: 40, fontWeight: 700, color: C.som, fontVariantNumeric: 'tabular-nums', textShadow: SH }}>{clock(m)}</span>
          <Selo src={M.marca.logo} size={54}></Selo>
        </div>
      </div>
      {k >= 0 && (() => {
        const x = L[k], e = (m - x.t);
        const n = String(x.texto).split(' ').length;
        return (
          <div key={k} style={{ position: 'absolute', left: G.L - 3, right: 1080 - G.R, top: 334, minHeight: 170, display: 'flex', flexWrap: 'wrap', alignContent: 'flex-start', columnGap: 18, fontFamily: F.sans, fontWeight: 850, fontStretch: '74%', fontSize: 76, lineHeight: 1, letterSpacing: '-0.012em', color: C.paper, textShadow: '0 4px 30px rgba(0,0,0,0.65)' }}>
            <Colorido texto={x.texto} wordStyle={(i) => {
              const q = EZ.back(cl((e - i * 0.07) / 0.35));
              return { opacity: cl(q * 2), transform: `translateY(${((1 - q) * 36).toFixed(1)}px)` };
            }}></Colorido>
          </div>
        );
      })()}
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 540, display: 'flex', flexWrap: 'wrap', columnGap: 40, rowGap: 10, ...rise(p(0.3), 14) }}>
        {[[C.som, M.R.legenda_som], [C.letraTxt, M.R.legenda_letra]].map(([cor, t], i) => (
          <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: F.sans, fontSize: 34, fontWeight: 750, color: cor, textShadow: SH }}>
            <span style={{ width: 26, height: 26, borderRadius: 13, background: cor, boxShadow: `0 0 16px ${cor}`, flex: 'none' }}></span>{t}
          </span>
        ))}
      </div>
      {(M.vol || M.ag) && (() => {
        const q = EZ.out(cl((g - M.volIni - 1.2) / 0.6));
        if (q <= 0) return null;
        const vs1 = (v) => fmt(v, 1);
        return (
          <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 600, display: 'flex', flexWrap: 'wrap', columnGap: 30, ...TEC, fontSize: 15, color: '#BFD8EE', ...rise(q, 6) }}>
            {M.vol && <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 26, height: 2.5, background: '#9FC6E8' }}></span>{M.R.tec_volume || 'volume'} {vs1(M.vol(m))} SD {M.R.tec_vs_disco || ''}</span>}
            {M.ag && <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}><svg width="26" height="4"><line x1="1" x2="25" y1="2" y2="2" stroke="#9FC6E8" strokeWidth="3" strokeDasharray="1 7" strokeLinecap="round"></line></svg>{M.R.tec_agudos || 'agudos'} {vs1(M.ag(m))} SD</span>}
          </div>
        );
      })()}
    </React.Fragment>
  );
}

function Revelacoes({ M, m, tw, gIn }) {
  const shown = M.reveal.filter(r => r.t <= m);
  return (
    <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1262, minHeight: 100, display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 18, rowGap: 6, opacity: EZ.out(cl(gIn / 0.6)) }}>
      {shown.map((r, i) => {
        const e = EZ.back(cl((m - r.t) / 0.55)), hot = r.nome === M.destaque;
        const age = M.reveal[M.reveal.indexOf(r) + 1] && M.reveal[M.reveal.indexOf(r) + 1].t <= m;
        return (
          <React.Fragment key={r.nome}>
            {i > 0 && <span style={{ fontFamily: F.sans, fontSize: 40, color: C.dim, opacity: cl(e * 2) }}>→</span>}
            <span style={{ display: 'inline-block', fontFamily: F.sans, fontWeight: 850, fontStretch: '78%', fontSize: hot ? 84 : 52, lineHeight: 1, letterSpacing: '0.01em', color: hot ? '#fff' : C.letraTxt, background: hot ? C.letra : 'transparent', padding: hot ? '8px 20px 6px' : 0, borderRadius: hot ? 12 : 0, opacity: cl(e * 2) * (age && !hot ? 0.7 : 1), transform: `translateY(${((1 - e) * 30).toFixed(1)}px) scale(${(0.7 + 0.3 * e).toFixed(3)})`, transformOrigin: '0 50%', textShadow: hot ? 'none' : SH, boxShadow: hot ? '0 14px 50px rgba(232,57,30,0.55)' : 'none' }}>{tw.emocoes === 'EN' ? r.en : r.nome}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function Secoes({ M, m, gIn }) {
  const g = EZ.out(cl((gIn - 0.4) / 0.6));
  return M.secoes.map((s, i) => {
    const x1 = i ? M.X(s.ini) + 5 : G.L, x2 = i === M.secoes.length - 1 ? G.R : M.X(s.fim) - 5;
    const f = cl((m - s.ini) / (s.fim - s.ini)), on = m >= s.ini && (m < s.fim || i === M.secoes.length - 1);
    return (
      <div key={i} style={{ position: 'absolute', left: x1, width: x2 - x1, top: 1400, height: 54, borderRadius: 12, overflow: 'hidden', background: 'rgba(16,14,12,0.55)', boxShadow: on ? 'inset 0 0 0 2px rgba(246,242,234,0.6)' : 'inset 0 0 0 1.5px rgba(246,242,234,0.16)', opacity: g }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: (f * 100).toFixed(2) + '%', background: 'rgba(246,242,234,0.16)' }}></div>
        <span style={{ position: 'absolute', left: 18, top: 15, fontFamily: F.mono, fontSize: 21, fontWeight: 700, letterSpacing: '0.12em', color: f > 0 ? C.paper : C.dim }}>{s.nome}</span>
        {s.som_sd != null && s.letra_sd != null && (
          <span style={{ position: 'absolute', right: 16, top: 19, display: 'flex', gap: 12, ...TEC, fontSize: 15, opacity: EZ.out(cl((m - s.ini) / 1)) }}>
            <span style={{ color: 'rgba(255,204,26,0.8)' }}>{fmt(s.som_sd)}</span>
            <span style={{ color: 'rgba(255,107,74,0.85)' }}>{fmt(s.letra_sd)}</span>
          </span>
        )}
      </div>
    );
  });
}

function Metodo({ M, gIn }) {
  const ls = M.R.metodo_linhas || (M.R.metodo ? [M.R.metodo] : []);
  const ref = React.useRef(null);
  const [fs, setFs] = React.useState(13);
  React.useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    let w = 0; Array.from(el.children).forEach(c => { w = Math.max(w, c.scrollWidth); });
    const nf = Math.max(9, Math.min(13, Math.floor(fs * (G.R - G.L) / Math.max(1, w) * 10) / 10));
    if (Math.abs(nf - fs) > 0.05) setFs(nf);
  });
  if (!ls.length) return null;
  return (
    <div ref={ref} style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1474, whiteSpace: 'nowrap', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 4, ...TEC, fontSize: fs, fontStretch: '75%', lineHeight: 1.4, letterSpacing: '-0.01em', color: 'rgba(246,242,234,0.45)', opacity: EZ.out(cl((gIn - 1) / 0.8)) }}>
      {ls.map((l, i) => <div key={i} style={{ display: 'inline-block', width: 'max-content' }}>{l}</div>)}
    </div>
  );
}

function CTA({ M, g }) {
  const cta = M.D.cta || {};
  if (cta.inicio_s == null) return null;
  const e = g - +cta.inicio_s;
  if (e < 0) return null;
  const bg = EZ.out(cl(e / 0.5));
  const p2 = EZ.out(cl((e - 0.9) / 0.5)), p3 = EZ.back(cl((e - 1.2) / 0.6));
  return (
    <React.Fragment>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1170, bottom: 0, background: 'linear-gradient(180deg, rgba(16,14,12,0) 0%, rgba(16,14,12,0.92) 14%, rgba(16,14,12,0.97) 100%)', opacity: bg }}></div>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 1218, display: 'flex', flexDirection: 'column', gap: 22 }}>
        {cta.linha1 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: 18, fontFamily: F.sans, fontWeight: 850, fontStretch: '74%', fontSize: 82, lineHeight: 0.98, letterSpacing: '-0.012em', color: C.paper }}>
            <Colorido texto={cta.linha1} wordStyle={(i) => { const q = EZ.back(cl((e - 0.15 - i * 0.07) / 0.4)); return { opacity: cl(q * 2), transform: `translateY(${((1 - q) * 40).toFixed(1)}px)` }; }}></Colorido>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, ...rise(p2, 16) }}>
          <span style={{ height: 3, width: 70, background: C.som, flex: 'none' }}></span>
          <span style={{ fontFamily: F.sans, fontSize: 40, fontWeight: 700, color: C.som }}>{cta.linha2}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: cl(p3 * 1.5) }}>
          <Selo src={M.marca.logo} size={92} style={{ transform: `scale(${(0.6 + 0.4 * p3).toFixed(3)}) rotate(${((1 - p3) * -25).toFixed(1)}deg)` }}></Selo>
          <span style={{ fontFamily: F.mono, fontSize: 36, fontWeight: 700, color: C.paper }}>{cta.linha3 || M.marca.assinatura}</span>
        </div>
      </div>
    </React.Fragment>
  );
}

function Fundo({ M, T, tw }) {
  const fv = M.D.fundo_video || {};
  const v = tw.veu;
  return (
    <React.Fragment>
      <Clip src={tw.video === false ? '' : fv.src} t={(+fv.inicio_s || 0) + T} hue={22} label={fv.src || 'fundo_video.src'} dimLabel></Clip>
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, rgba(14,12,10,${0.78 * v}) 0%, rgba(14,12,10,${0.62 * v}) 20%, rgba(14,12,10,${0.45 * v}) 36%, rgba(14,12,10,${0.42 * v}) 55%, rgba(14,12,10,${0.62 * v}) 68%, rgba(14,12,10,${0.85 * v}) 85%, rgba(14,12,10,${0.92 * v}) 100%)` }}></div>
    </React.Fragment>
  );
}

function Reel({ tw }) {
  const comp = useComposition();
  const M = React.useMemo(() => buildModel(SL_DADOS), []);
  const T = comp.T, A = M.A;
  const g = T - A, gIn = Math.max(0, g);
  const m = Math.min(M.fim, M.ini + gIn);
  const flash = g >= 0 ? cl(1 - g / 0.35) * 0.85 : 0;
  const zin = EZ.out(cl(g / 0.8));
  const bump = M.md && m - M.md.tx > 0 ? Math.exp(-(m - M.md.tx) * 1.6) : 0;
  const ctaS = M.D.cta && M.D.cta.inicio_s != null ? +M.D.cta.inicio_s : 1e9;
  const baixo = 1 - EZ.out(cl((g - ctaS) / 0.4));
  return (
    <div data-screen-label={g < 0 ? `abertura ${T.toFixed(1)}s` : `gráfico ${clock(m)}`} style={{ position: 'absolute', inset: 0, background: C.bg, overflow: 'hidden', fontFamily: F.sans }}>
      {g >= -0.3 && (
        <div style={{ position: 'absolute', inset: 0, transform: `scale(${(1.06 - 0.06 * zin + 0.012 * bump).toFixed(4)})`, opacity: cl((g + 0.3) / 0.3) }}>
          <Fundo M={M} T={T} tw={tw}></Fundo>
          <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: 0.12 * bump }}></div>
          <GraficoTopo M={M} g={gIn} m={m}></GraficoTopo>
          <Chart M={M} g={gIn} m={m} gIn={gIn}></Chart>
          <ChartLabels M={M} m={m} tw={tw} gIn={gIn}></ChartLabels>
          {baixo > 0 && (
            <div style={{ position: 'absolute', inset: 0, opacity: baixo }}>
              <Revelacoes M={M} m={m} tw={tw} gIn={gIn}></Revelacoes>
              <Secoes M={M} m={m} gIn={gIn}></Secoes>
            </div>
          )}
          <CTA M={M} g={g}></CTA>
        </div>
      )}
      {g < 0.01 && <Abertura M={M} T={T}></Abertura>}
      <div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: flash, pointerEvents: 'none' }}></div>
      {tw.zonas && (
        <React.Fragment>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 220, background: 'rgba(255,0,80,0.22)', borderBottom: '2px dashed #ff3d7f' }}></div>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 380, background: 'rgba(255,0,80,0.22)', borderTop: '2px dashed #ff3d7f' }}></div>
        </React.Fragment>
      )}
    </div>
  );
}

// ---------- CAPA (miniatura) ----------
function Capa({ tw }) {
  const M = React.useMemo(() => buildModel(SL_DADOS), []);
  const R = M.R;
  const frase = R.capa_frase || String(R.pergunta).replace(new RegExp('^' + M.D.musica + '\\s*[:—-]\\s*', 'i'), '');
  const W0 = 60, W1 = 760, yT = 1120, yB = 1440, ymn = M.ymin, ymx = M.ymax;
  const Xc = (t) => W0 + ((t - M.ini) / M.dur) * (W1 - W0);
  const Yc = (v) => yT + ((ymx - v) / (ymx - ymn)) * (yB - yT);
  const pth = (fn) => { let d = ''; for (let t = M.ini; t <= M.fim + 1e-6; t += 0.25) d += (d ? 'L' : 'M') + Xc(t).toFixed(1) + ' ' + Yc(fn(t)).toFixed(1); return d; };
  const gapA = (() => { const up = [], lo = []; for (let t = M.ini; t <= M.fim + 1e-6; t += 0.25) { up.push(Xc(t).toFixed(1) + ' ' + Yc(M.som(t)).toFixed(1)); lo.push(Xc(t).toFixed(1) + ' ' + Yc(M.letraAt(t)).toFixed(1)); } return 'M' + up.join('L') + 'L' + lo.reverse().join('L') + 'Z'; })();
  const fv = M.D.fundo_video || {};
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg, overflow: 'hidden' }}>
      <Clip src={tw.video === false ? '' : fv.src} t={+fv.capa_s || 3} hue={22} ativo></Clip>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(14,12,10,0.8) 0%, rgba(14,12,10,0.35) 30%, rgba(14,12,10,0.55) 55%, rgba(14,12,10,0.92) 85%)' }}></div>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 330, fontFamily: F.mono, fontSize: 24, fontWeight: 700, letterSpacing: '0.1em', color: C.som, textShadow: SH }}>{R.titulo_chamada}</div>
      <div style={{ position: 'absolute', left: G.L - 14, right: 0, top: 370, fontFamily: F.sans, fontWeight: 900, fontStretch: '68%', fontSize: 360, lineHeight: 0.9, letterSpacing: '-0.03em', color: C.paper, textShadow: '0 10px 60px rgba(0,0,0,0.5)' }}>{M.D.musica}</div>
      <div style={{ position: 'absolute', left: G.L, right: 1080 - G.R, top: 730, display: 'flex', flexWrap: 'wrap', columnGap: 20, fontFamily: F.sans, fontWeight: 850, fontStretch: '74%', fontSize: 92, lineHeight: 0.98, letterSpacing: '-0.012em', color: C.paper, textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>
        <Colorido texto={frase}></Colorido>
      </div>
      <svg width="1080" height="1920" style={{ position: 'absolute', inset: 0 }}>
        <defs><filter id="cp-glow" x="-10%" y="-50%" width="120%" height="200%"><feGaussianBlur stdDeviation="12"></feGaussianBlur></filter></defs>
        <path d={gapA} fill={C.letra} opacity="0.18"></path>
        <path d={pth(M.som)} fill="none" stroke={C.som} strokeWidth="26" opacity="0.6" filter="url(#cp-glow)"></path>
        <path d={pth(M.letraAt)} fill="none" stroke={C.letra} strokeWidth="26" opacity="0.6" filter="url(#cp-glow)"></path>
        <path d={pth(M.som)} fill="none" stroke={C.som} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d={pth(M.letraAt)} fill="none" stroke={C.letraTxt} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round"></path>
        <circle cx={W1} cy={Yc(M.som(M.fim))} r="20" fill={C.som}></circle>
        <circle cx={W1} cy={Yc(M.letraAt(M.fim))} r="20" fill={C.letraTxt}></circle>
      </svg>
      <div style={{ position: 'absolute', left: W1 + 34, right: 30, top: Yc(M.som(M.fim)) - 40, fontFamily: F.sans, fontSize: 34, fontWeight: 800, lineHeight: 1.02, color: C.som, textShadow: SH }}>{R.legenda_som}</div>
      <div style={{ position: 'absolute', left: W1 + 34, right: 30, top: Yc(M.letraAt(M.fim)) - 40, fontFamily: F.sans, fontSize: 34, fontWeight: 800, lineHeight: 1.02, color: C.letraTxt, textShadow: SH }}>{R.legenda_letra}</div>
      <div style={{ position: 'absolute', left: G.L, top: 1500, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Selo src={M.marca.logo} size={78}></Selo>
        <span style={{ fontFamily: F.mono, fontSize: 30, fontWeight: 700, color: C.paper }}>{M.marca.assinatura}</span>
      </div>
      {tw.zonas && <div style={{ position: 'absolute', left: 0, right: 0, top: 285, height: 1350, boxShadow: '0 0 0 2000px rgba(255,0,80,0.25)', border: '2px dashed #ff3d7f' }}></div>}
    </div>
  );
}

function SomLetraReelV2() {
  const capa = !!window.SOM_LETRA_CAPA;
  const [tw, setTweak] = useTweaks(Object.assign({ motionEditor: true, emocoes: 'PT', zonas: false, video: true, veu: 1 }, window.TWEAK_DEFAULTS || {}));
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a' }}>
      <CompositionStage width={1080} height={1920} bg={C.bg} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK} autoplay={!capa}>
        {capa ? <Capa tw={tw}></Capa> : <Reel tw={tw}></Reel>}
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Reel v3"></TweakSection>
        <TweakRadio label="Emoções" value={tw.emocoes} options={['PT', 'EN']} onChange={(v) => setTweak('emocoes', v)}></TweakRadio>
        <TweakToggle label="Vídeo de fundo" value={tw.video} onChange={(v) => setTweak('video', v)}></TweakToggle>
        <TweakSlider label="Véu escuro" value={tw.veu} min={0.4} max={1.3} step={0.05} onChange={(v) => setTweak('veu', v)}></TweakSlider>
        <TweakToggle label={capa ? 'Recorte do feed (4:5)' : 'Zonas seguras do Reels'} value={tw.zonas} onChange={(v) => setTweak('zonas', v)}></TweakToggle>
        <TweakToggle label="Motion editor" value={tw.motionEditor} onChange={(v) => setTweak('motionEditor', v)}></TweakToggle>
      </TweaksPanel>
    </div>
  );
}

window.somLetraRender = function (t) {
  const el = document.querySelector('[data-om-exportable-video-with-duration-secs]');
  if (el) el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: t, sync: true } }));
};
window.SomLetraReelV3 = SomLetraReelV2;
