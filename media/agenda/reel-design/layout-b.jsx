// Layout B · Ingresso de show.
(() => {
const { clamp01, lerp, MOTION, V, A, HALF, LOGOS, fmtHora, casaDe, weekRange, plural, dayWeights, accordion, MapCanvas, ClipPH, Logo, Slam } = window.RC;
const FIELD = { font: '800 22px Inter, sans-serif', letterSpacing: 4, color: A('bg', 0.6) };
const MAP = { x: 80, y: 660, w: 920, h: 830 };

// Furos de picote: círculos da cor do fundo da cena nas bordas.
function Notch({ x, y, r = 18, color = V.bg }) {
  return <div style={{ position: 'absolute', left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: r, background: color }}></div>;
}
function VPerf({ x }) { return <div style={{ position: 'absolute', left: x, top: 22, bottom: 22, borderLeft: '4px dashed ' + A('bg', 0.45) }}></div>; }
function HPerf({ y }) { return <div style={{ position: 'absolute', top: y, left: 26, right: 26, borderTop: '4px dashed ' + A('bg', 0.45) }}></div>; }
function Stamp({ T, at, text, size = 64, rot = -12, color = V.alert, style }) {
  const p = MOTION.pop(T, at, 0.35);
  return (
    <div style={{ position: 'absolute', ...style, opacity: MOTION.enter(T, at, 0.06), transform: 'rotate(' + rot + 'deg) scale(' + lerp(1.8, 1, p) + ')' }}>
      <div style={{ border: '7px solid ' + color, padding: '6px 18px', font: '400 ' + size + 'px/1 Anton, sans-serif', color, whiteSpace: 'nowrap', opacity: 0.92 }}>{text}</div>
    </div>
  );
}

function Opening({ T, S, End, week }) {
  const cut = (End - S) / 4, [a, b] = weekRange(week);
  const up = MOTION.enter(T, S + 0.05, 0.5);
  return (
    <Shot from={S} to={End}>
      {[0, 1, 2, 3].map(i => (
        <Shot key={i} from={S + i * cut} to={S + (i + 1) * cut}>
          <ClipPH label={'CLIPE PJ ' + (i + 1)} idx={i} zoom={lerp(1.02 + i * 0.02, 1.12, clamp01((T - S - i * cut) / cut))} />
        </Shot>
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.5) + ' 0%, ' + A('bg', 0) + ' 25%, ' + A('bg', 0.6) + ' 60%, ' + A('bg', 0.85) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 60, top: 900, width: 960, height: 560, transform: 'translateY(' + (1 - up) * 1100 + 'px) rotate(-3deg)' }}>
        <div style={{ position: 'absolute', inset: 0, background: V.paper, overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.06), 7) }}></div>
          <VPerf x={735} />
          <div style={{ position: 'absolute', left: 44, top: 40, ...FIELD }}>ENTRADA · BANDAS COVER</div>
          <div style={{ position: 'absolute', left: 40, top: 90, display: 'flex', flexDirection: 'column', gap: 4, fontFamily: 'Anton, sans-serif', lineHeight: 0.95 }}>
            <Slam T={T} at={S + 0.15} from={1.25}><div style={{ fontSize: 116, color: V.bg }}>ONDE TEM</div></Slam>
            <Slam T={T} at={S + cut} from={1.25}><div style={{ fontSize: 150, color: V.alert }}>PEARL JAM</div></Slam>
            <Slam T={T} at={S + cut * 2} from={1.25}><div style={{ fontSize: 116, color: V.bg }}>AO VIVO</div></Slam>
          </div>
          <div style={{ position: 'absolute', left: 740, top: 0, width: 220, height: 560, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ transform: 'rotate(90deg)', whiteSpace: 'nowrap', textAlign: 'center' }}>
              <div style={FIELD}>VÁLIDO DE</div>
              <div style={{ font: '400 64px/1.1 Anton, sans-serif', color: V.bg }}>{a} A {b}</div>
            </div>
          </div>
          <Notch x={737} y={0} /><Notch x={737} y={560} />
        </div>
      </div>
      <Stamp T={T} at={S + cut * 3} text="ESSA SEMANA?" size={92} rot={-9} style={{ left: 330, top: 1380 }} />
    </Shot>
  );
}

function MapScene({ T, S, End, geo, week }) {
  const n = week.shows.length, nC = geo.cities.length, [a, b] = weekRange(week);
  const up = MOTION.enter(T, S, 0.35);
  return (
    <Shot from={S} to={End}>
      <div style={{ position: 'absolute', inset: 0, background: V.bg }}>
        <div style={{ position: 'absolute', inset: 0, ...HALF(A('hl', 0.10), 10) }}></div>
        <div style={{ position: 'absolute', left: 50, top: 300, width: 980, height: 1220, background: V.paper, overflow: 'hidden', transform: 'translateY(' + (1 - up) * 1300 + 'px)' }}>
          <div style={{ position: 'absolute', left: 50, top: 34, ...FIELD }}>INGRESSO · AGENDA DA SEMANA</div>
          <div style={{ position: 'absolute', left: 44, top: 70 }}>
            <Slam T={T} at={S + 0.15} from={1.25}><div style={{ font: '400 180px/0.92 Anton, sans-serif', color: V.bg }}>{plural(n, 'SHOW', 'SHOWS')}</div></Slam>
          </div>
          <div style={{ position: 'absolute', left: 50, top: 252, display: 'flex', gap: 60, opacity: MOTION.enter(T, S + 0.35, 0.25) }}>
            <div><div style={FIELD}>CIDADES</div><div style={{ font: '400 56px/1.1 Anton, sans-serif', color: V.bg }}>{nC}</div></div>
            <div><div style={FIELD}>DATAS</div><div style={{ font: '400 56px/1.1 Anton, sans-serif', color: V.bg }}>{a} A {b}</div></div>
          </div>
          <HPerf y={346} />
          <Notch x={0} y={348} /><Notch x={980} y={348} />
          <div style={{ position: 'absolute', left: MAP.x - 50, top: MAP.y - 300, width: MAP.w, height: MAP.h, border: '4px solid ' + V.bg, boxSizing: 'content-box' }}>
            <MapCanvas T={T} S={S} End={End} geo={geo} th={{ land: V.paper2, lit: V.hl, stroke: V.bg, sea: V.paper, labelBg: V.paper, labelFg: V.bg, labelBorder: '3px solid ' + V.bg, leader: V.bg, pinFill: V.alert, pinBorder: V.bg }} />
          </div>
        </div>
      </div>
    </Shot>
  );
}

const RY = 560, RH = 970, ROW = 100, GAP = 14, STUB = 250;
function DayScene({ T, S, End, day, mode }) {
  const n = day.shows.length, { w, sw } = dayWeights(T, day, S, End);
  const { HX, off } = accordion(n, RH, ROW, GAP, 800);
  const DayBg = window.LAYOUTS.A.DayBg;
  return (
    <Shot from={S} to={End}>
      <DayBg T={T} S={S} End={End} day={day} w={w} mode={mode} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.9) + ' 0%, ' + A('bg', 0.6) + ' 28%, ' + A('bg', 0.5) + ' 70%, ' + A('bg', 0.9) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 50, top: 300 }}>
        <Slam T={T} at={S} from={1.3}><div style={{ font: '400 200px/0.9 Anton, sans-serif', color: V.paper }}>{day.word}</div></Slam>
      </div>
      <div style={{ position: 'absolute', right: 56, top: 300, width: 200, height: 200, opacity: MOTION.enter(T, S + 0.2, 0.06), transform: 'rotate(-12deg) scale(' + lerp(1.8, 1, MOTION.pop(T, S + 0.2, 0.35)) + ')', borderRadius: 100, border: '7px solid ' + V.hl, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ font: '800 20px Inter, sans-serif', letterSpacing: 4, color: V.hl }}>DATA</div>
        <div style={{ font: '400 66px/1 Anton, sans-serif', color: V.hl }}>{day.dm}</div>
      </div>
      <div style={{ position: 'absolute', left: 50, top: RY + off, width: 980, display: 'flex', flexDirection: 'column', gap: GAP }}>
        {day.shows.map((s, i) => {
          const h = ROW + w[i] * (HX - ROW), hora = fmtHora(s.hora);
          const en = MOTION.enter(T, S + 0.28 + i * 0.07, 0.45);
          const fs = Math.min(96, 640 / ((s.cidade.length + 1.2) * 0.47));
          const D = Math.max(110, Math.min(HX - 250, 210));
          const stampAt = i === 0 ? S + 0.9 : sw[i] + 0.25;
          const BW = 980 - STUB;
          return (
            <div key={i} style={{ position: 'relative', height: h, flexShrink: 0, overflow: 'hidden', background: V.paper2, transform: 'translateY(' + (1 - en) * 1400 + 'px)' }}>
              <div style={{ position: 'absolute', inset: 0, background: V.paper, opacity: w[i] }}></div>
              <VPerf x={BW} />
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ROW, display: 'flex', alignItems: 'center', opacity: clamp01(1 - w[i] / 0.45) }}>
                <div style={{ width: BW, padding: '0 34px', boxSizing: 'border-box', display: 'flex', alignItems: 'baseline', gap: 18, whiteSpace: 'nowrap', overflow: 'hidden' }}>
                  <div style={{ font: '400 50px/1 Anton, sans-serif', color: V.bg }}>{s.cidade.toUpperCase()}/{s.uf}</div>
                  <div style={{ font: '700 28px Inter, sans-serif', color: A('bg', 0.75) }}>{s.banda}</div>
                </div>
                <div style={{ width: STUB, textAlign: 'center', font: '400 46px/1 Anton, sans-serif', color: V.bg }}>{hora || ''}</div>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HX, opacity: clamp01((w[i] - 0.55) / 0.45) }}>
                <div style={{ position: 'absolute', left: 0, top: 0, width: BW, height: 56, background: V.hl, display: 'flex', alignItems: 'center', paddingLeft: 34, boxSizing: 'border-box', font: '800 24px Inter, sans-serif', letterSpacing: 4, color: V.bg }}>{'ENTRADA · ' + day.word + ' ' + day.dm}</div>
                <div style={{ position: 'absolute', left: 34, top: 76, width: BW - 68, bottom: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
                  <div><div style={FIELD}>CIDADE</div><div style={{ font: '400 ' + fs + 'px/1 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.cidade.toUpperCase()}<span style={{ fontSize: fs * 0.55 }}>/{s.uf}</span></div></div>
                  <div><div style={FIELD}>BANDA</div><div style={{ font: '800 48px/1.1 Inter, sans-serif', color: V.bg, letterSpacing: -1 }}>{s.banda} <span style={{ fontWeight: 600, fontSize: 30 }}>{s.arrobaBanda}</span></div></div>
                  {casaDe(s) ? <div><div style={FIELD}>LOCAL</div><div style={{ font: '700 34px/1.2 Inter, sans-serif', color: V.bg }}>{casaDe(s)}</div></div> : null}
                </div>
                <div style={{ position: 'absolute', left: BW, top: 0, width: STUB, height: HX, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22 }}>
                  <Logo src={LOGOS[s.arrobaBanda]} D={D} ring={6} name={s.banda} />
                  {hora ? <div style={{ textAlign: 'center' }}><div style={FIELD}>HORA</div><div style={{ font: '400 64px/1 Anton, sans-serif', color: V.bg }}>{hora}</div></div> : null}
                </div>
                <Stamp T={T} at={stampAt} text="AO VIVO" size={58} rot={-14} style={{ right: STUB + 30, bottom: 34 }} />
              </div>
              <Notch x={BW + 2} y={0} r={16} /><Notch x={BW + 2} y={h} r={16} />
            </div>
          );
        })}
      </div>
    </Shot>
  );
}

function Closing({ T, S, End }) {
  const up = MOTION.enter(T, S, 0.4);
  return (
    <Shot from={S} to={End}>
      <div style={{ position: 'absolute', inset: 0, background: V.bg }}>
        <div style={{ position: 'absolute', inset: 0, ...HALF(A('hl', 0.10), 10) }}></div>
        <div style={{ position: 'absolute', left: 60, top: 520, width: 960, height: 900, transform: 'translateY(' + (1 - up) * 1300 + 'px) rotate(-2deg)' }}>
          <div style={{ position: 'absolute', inset: 0, background: V.paper, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 50, top: 40, ...FIELD }}>INGRESSO PERMANENTE</div>
            <div style={{ position: 'absolute', left: 44, top: 84, fontFamily: 'Anton, sans-serif', color: V.bg, lineHeight: 0.9 }}>
              <Slam T={T} at={S + 0.1} from={1.25}><div style={{ fontSize: 220 }}>TODA</div></Slam>
              <Slam T={T} at={S + 0.3} from={1.25}><div style={{ fontSize: 190 }}>TERÇA TEM</div></Slam>
            </div>
            <HPerf y={540} />
            <Notch x={0} y={542} /><Notch x={960} y={542} />
            <div style={{ position: 'absolute', left: 0, right: 0, top: 590, height: 150, background: V.hl, transform: 'scaleX(' + MOTION.enter(T, S + 0.75, 0.3) + ')', transformOrigin: 'left' }}></div>
            <div style={{ position: 'absolute', left: 44, top: 606, font: '400 112px/1 Anton, sans-serif', color: V.bg, opacity: clamp01((MOTION.enter(T, S + 0.75, 0.3) - 0.5) * 3) }}>SEGUE @SMUFDPJ</div>
            <div style={{ position: 'absolute', left: 50, top: 772, opacity: MOTION.enter(T, S + 1.15, 0.3) }}>
              <div style={FIELD}>AGENDA COMPLETA</div>
              <div style={{ font: '800 40px Inter, sans-serif', color: V.bg, letterSpacing: -0.5 }}>somaisumfadepearljam.com.br/agenda</div>
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', right: 70, top: 300, opacity: MOTION.enter(T, S + 0.5, 0.08), transform: 'scale(' + lerp(1.8, 1, MOTION.pop(T, S + 0.5, 0.4)) + ') rotate(' + (14 + (T - S) * 6) + 'deg)' }}>
          <div style={{ width: 250, height: 250, borderRadius: 125, overflow: 'hidden', border: '6px solid ' + V.hl }}>
            <img src="assets/selo-smufdpj.jpg" alt="" style={{ width: 276, height: 276, marginLeft: -19, marginTop: -19 }} />
          </div>
        </div>
      </div>
    </Shot>
  );
}

window.LAYOUTS.B = { map: { w: MAP.w, h: MAP.h, lab: { fs: 30, h: 48, cw: 17, pad: 30 } }, sig: { open: V.paper, map: V.paper, day: V.paper, close: V.paper }, Opening, MapScene, DayScene, Closing };
})();
