// Layout D · Tipográfico: dia gigante vazado, lista em faixas de ponta a ponta.
(() => {
const { clamp01, lerp, MOTION, V, A, LOGOS, fmtHora, casaDe, weekRange, plural, dayWeights, accordion, MapCanvas, ClipPH, Logo } = window.RC;
const MAP = { x: 0, y: 830, w: 1080, h: 690 };
const OUT = (c, w) => ({ color: 'transparent', WebkitTextStroke: w + 'px ' + c });
const fitFs = (txt, width, max) => Math.min(max, width / (txt.length * 0.47));
// Entrada lateral: desliza de fora do quadro (lado alterna).
const slide = (T, at, side, d = 0.32) => 'translateX(' + (1 - MOTION.enter(T, at, d)) * 1100 * side + 'px)';

function Opening({ T, S, End }) {
  const cut = (End - S) / 4;
  const wipe = (at) => MOTION.enter(T, at, 0.25);
  return (
    <Shot from={S} to={End}>
      {[0, 1, 2, 3].map(i => (
        <Shot key={i} from={S + i * cut} to={S + (i + 1) * cut}>
          <ClipPH label={'CLIPE PJ ' + (i + 1)} idx={i} zoom={lerp(1.02 + i * 0.02, 1.12, clamp01((T - S - i * cut) / cut))} />
        </Shot>
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.45) + ' 0%, ' + A('bg', 0) + ' 25%, ' + A('bg', 0.75) + ' 60%, ' + A('bg', 0.9) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 40, top: 860, transform: slide(T, S + 0.1, -1), font: '400 200px/1 Anton, sans-serif', ...OUT(V.paper, 4) }}>ONDE TEM</div>
      <div style={{ position: 'absolute', left: 0, top: 1070, width: 1080, height: 230, background: V.hl, transform: 'scaleX(' + wipe(S + cut) + ')', transformOrigin: 'left' }}></div>
      <div style={{ position: 'absolute', left: 40, top: 1076, font: '400 214px/1 Anton, sans-serif', color: V.bg, opacity: clamp01((wipe(S + cut) - 0.4) * 3) }}>PEARL JAM</div>
      <div style={{ position: 'absolute', right: 40, top: 1300, transform: slide(T, S + cut * 2, 1), font: '400 200px/1 Anton, sans-serif', ...OUT(V.paper, 4) }}>AO VIVO</div>
      <div style={{ position: 'absolute', left: 0, top: 296, width: 1080, height: 130, background: V.paper, transform: 'scaleX(' + wipe(S + cut * 3) + ')', transformOrigin: 'right' }}></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 306, textAlign: 'center', font: '400 110px/1 Anton, sans-serif', color: V.bg, opacity: clamp01((wipe(S + cut * 3) - 0.4) * 3) }}>ESSA SEMANA?</div>
    </Shot>
  );
}

function MapScene({ T, S, End, geo, week }) {
  const n = week.shows.length, nC = geo.cities.length, [a, b] = weekRange(week);
  const num = String(n), nfs = num.length === 1 ? 580 : 420, nw = num.length * 0.5 * nfs;
  const np = MOTION.pop(T, S, 0.45);
  return (
    <Shot from={S} to={End}>
      <div style={{ position: 'absolute', inset: 0, background: V.bg }}>
        <div style={{ position: 'absolute', left: 30, top: 300, font: '400 ' + nfs + 'px/0.86 Anton, sans-serif', ...OUT(V.hl, 6), opacity: MOTION.enter(T, S, 0.08), transform: 'scale(' + lerp(1.3, 1, np) + ')', transformOrigin: 'left top' }}>{num}</div>
        <div style={{ position: 'absolute', left: 50 + nw, right: 40, top: 330, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ transform: slide(T, S + 0.1, 1), font: '400 150px/0.9 Anton, sans-serif', color: V.paper }}>{n === 1 ? 'SHOW' : 'SHOWS'}</div>
          <div style={{ transform: slide(T, S + 0.22, 1), font: '400 72px/1 Anton, sans-serif', color: V.hl }}>{plural(nC, 'CIDADE', 'CIDADES')}</div>
          <div style={{ transform: slide(T, S + 0.34, 1), font: '800 40px Inter, sans-serif', color: V.paper, letterSpacing: 2 }}>{a} A {b}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: MAP.y - 6, height: 6, background: V.hl, transform: 'scaleX(' + MOTION.enter(T, S + 0.15, 0.4) + ')', transformOrigin: 'left' }}></div>
        <div style={{ position: 'absolute', left: MAP.x, top: MAP.y, width: MAP.w, height: MAP.h }}>
          <MapCanvas T={T} S={S} End={End} geo={geo} th={{ land: A('paper', 0.10), lit: V.hl, stroke: A('paper', 0.55), sea: V.bg, labelBg: V.paper, labelFg: V.bg, leader: V.paper, pinFill: V.alert, pinBorder: V.bg }} />
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: MAP.y + MAP.h, height: 6, background: V.hl, transform: 'scaleX(' + MOTION.enter(T, S + 0.15, 0.4) + ')', transformOrigin: 'right' }}></div>
      </div>
    </Shot>
  );
}

const RY = 730, RH = 800, ROW = 92, GAP = 0;
function DayScene({ T, S, End, day, mode }) {
  const n = day.shows.length, { w } = dayWeights(T, day, S, End);
  const { HX, off } = accordion(n, RH, ROW, GAP, 700);
  const DayBg = window.LAYOUTS.A.DayBg;
  const wfs = fitFs(day.word, 1000, /[ÁÉÍÓÚÂÊÔÃÕÇ]/.test(day.word) ? 280 : 300);
  const wp = MOTION.pop(T, S, 0.45);
  return (
    <Shot from={S} to={End}>
      <DayBg T={T} S={S} End={End} day={day} w={w} mode={mode} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.85) + ' 0%, ' + A('bg', 0.7) + ' 35%, ' + A('bg', 0.55) + ' 70%, ' + A('bg', 0.85) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 36, top: 370, font: '400 ' + wfs + 'px/0.86 Anton, sans-serif', ...OUT(V.hl, 5), whiteSpace: 'nowrap', opacity: MOTION.enter(T, S, 0.08), transform: 'scale(' + lerp(1.25, 1, wp) + ')', transformOrigin: 'left top' }}>{day.word}</div>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 370 + wfs * 0.86 + 8, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', transform: slide(T, S + 0.15, -1) }}>
        <div style={{ font: '400 72px/1 Anton, sans-serif', color: V.hl }}>{day.dm}</div>
        <div style={{ font: '800 30px Inter, sans-serif', letterSpacing: 4, color: V.paper }}>{plural(n, 'SHOW', 'SHOWS')}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, top: RY + off, width: 1080, display: 'flex', flexDirection: 'column' }}>
        {day.shows.map((s, i) => {
          const h = ROW + w[i] * (HX - ROW), hora = fmtHora(s.hora);
          const tight = HX < 420;
          const cfs = Math.min(fitFs(s.cidade + '/' + s.uf, 1000, 130), tight ? HX * 0.24 : 130);
          const D = Math.max(120, Math.min(HX - cfs - (tight ? 50 : 120), 260));
          const idx = String(i + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
          return (
            <div key={i} style={{ position: 'relative', height: h, flexShrink: 0, overflow: 'hidden', background: i % 2 ? V.paper2 : V.paper, transform: slide(T, S + 0.28 + i * 0.06, i % 2 ? 1 : -1, 0.4) }}>
              <div style={{ position: 'absolute', inset: 0, background: V.hl, opacity: w[i] }}></div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ROW, padding: '0 40px', display: 'flex', alignItems: 'center', gap: 22, opacity: clamp01(1 - w[i] / 0.45) }}>
                <div style={{ font: '800 26px Inter, sans-serif', color: A('bg', 0.55), letterSpacing: 2 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ flex: 1, font: '400 52px/1 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap', overflow: 'hidden' }}>{s.cidade.toUpperCase()}/{s.uf}</div>
                <div style={{ font: '700 28px Inter, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.banda}</div>
                {hora ? <div style={{ font: '400 48px/1 Anton, sans-serif', color: V.bg, width: 110, textAlign: 'right' }}>{hora}</div> : <div style={{ width: 110 }}></div>}
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HX, padding: tight ? '18px 40px 20px' : '26px 40px 30px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: clamp01((w[i] - 0.55) / 0.45) }}>
                {tight ? null : <div style={{ font: '800 26px Inter, sans-serif', color: V.bg, letterSpacing: 4 }}>{idx}</div>}
                <div style={{ font: '400 ' + cfs + 'px/0.95 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap', marginTop: 6 }}>{s.cidade.toUpperCase()}/{s.uf}</div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 28 }}>
                  <Logo src={LOGOS[s.arrobaBanda]} D={D} ring={6} name={s.banda} />
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ font: '800 ' + (tight ? 46 : 56) + 'px/1.05 Inter, sans-serif', color: V.bg, letterSpacing: -1.5 }}>{s.banda}</div>
                    <div style={{ font: '600 30px Inter, sans-serif', color: V.bg }}>{s.arrobaBanda}</div>
                    {casaDe(s) ? <div style={{ font: '700 30px Inter, sans-serif', color: V.bg, borderTop: '3px solid ' + V.bg, paddingTop: tight ? 4 : 8, marginTop: tight ? 2 : 6 }}>{casaDe(s)}</div> : null}
                  </div>
                  {hora ? <div style={{ font: '400 ' + Math.min(170, D * 0.9) + 'px/1 Anton, sans-serif', ...OUT(V.bg, 4) }}>{hora}</div> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Shot>
  );
}

function Closing({ T, S, End }) {
  const band = MOTION.enter(T, S + 0.75, 0.3);
  return (
    <Shot from={S} to={End}>
      <div style={{ position: 'absolute', inset: 0, background: V.hl }}>
        <div style={{ position: 'absolute', left: 40, top: 330, transform: slide(T, S + 0.05, -1), font: '400 330px/0.86 Anton, sans-serif', ...OUT(V.bg, 6) }}>TODA</div>
        <div style={{ position: 'absolute', left: 40, top: 620, transform: slide(T, S + 0.2, 1), font: '400 330px/0.86 Anton, sans-serif', color: V.bg }}>TERÇA</div>
        <div style={{ position: 'absolute', left: 40, top: 910, transform: slide(T, S + 0.35, -1), font: '400 330px/0.86 Anton, sans-serif', ...OUT(V.bg, 6) }}>TEM</div>
        <div style={{ position: 'absolute', left: 740, top: 960, opacity: MOTION.enter(T, S + 0.5, 0.08), transform: 'scale(' + lerp(0.4, 1, MOTION.pop(T, S + 0.5, 0.45)) + ') rotate(' + ((T - S) * 10 - 10) + 'deg)' }}>
          <div style={{ width: 240, height: 240, borderRadius: 120, overflow: 'hidden', border: '6px solid ' + V.bg }}>
            <img src="assets/selo-smufdpj.jpg" alt="" style={{ width: 266, height: 266, marginLeft: -19, marginTop: -19 }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: 1240, width: 1080, height: 150, background: V.bg, transform: 'scaleX(' + band + ')', transformOrigin: 'left' }}></div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1258, textAlign: 'center', font: '400 112px/1 Anton, sans-serif', color: V.hl, opacity: clamp01((band - 0.4) * 3) }}>SEGUE @SMUFDPJ</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 1420, textAlign: 'center', opacity: MOTION.enter(T, S + 1.15, 0.3), font: '800 40px Inter, sans-serif', color: V.bg, letterSpacing: -0.5 }}>somaisumfadepearljam.com.br/agenda</div>
      </div>
    </Shot>
  );
}

window.LAYOUTS.D = { map: { w: MAP.w, h: MAP.h, lab: { fs: 30, h: 46, cw: 17, pad: 26 } }, sig: { open: V.paper, map: V.paper, day: V.paper, close: V.bg }, Opening, MapScene, DayScene, Closing };
})();
