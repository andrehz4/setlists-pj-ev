// Layout A · Cartaz de show (o original).
(() => {
const { clamp01, lerp, MOTION, V, A, HALF, LOGOS, fmtHora, casaDe, weekRange, plural, dayWeights, accordion, MapCanvas, ClipPH, Logo, Tape, Slam } = window.RC;
const MAP = { x: 40, y: 645, w: 1000, h: 840 };

function Opening({ T, S, End }) {
  const cut = (End - S) / 4;
  return (
    <Shot from={S} to={End}>
      {[0, 1, 2, 3].map(i => (
        <Shot key={i} from={S + i * cut} to={S + (i + 1) * cut}>
          <ClipPH label={'CLIPE PJ ' + (i + 1)} idx={i} zoom={lerp(1.02 + i * 0.02, 1.12, clamp01((T - S - i * cut) / cut))} />
        </Shot>
      ))}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.55) + ' 0%, ' + A('bg', 0) + ' 22%, ' + A('bg', 0) + ' 42%, ' + A('bg', 0.85) + ' 70%, ' + A('bg', 0.9) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 56, top: 900, display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'Anton, sans-serif', lineHeight: 0.92 }}>
        <Slam T={T} at={S + 0.1}><div style={{ fontSize: 168, color: V.paper }}>ONDE TEM</div></Slam>
        <Slam T={T} at={S + cut}><div style={{ fontSize: 214, color: V.hl }}>PEARL JAM</div></Slam>
        <Slam T={T} at={S + cut * 2}><div style={{ fontSize: 168, color: V.paper }}>AO VIVO</div></Slam>
        <div style={{ marginTop: 18 }}><Tape bg={V.hl} color={V.bg} size={104} rot={-2} p={MOTION.enter(T, S + cut * 3, 0.25)}>ESSA SEMANA?</Tape></div>
      </div>
    </Shot>
  );
}

function MapScene({ T, S, End, geo, week }) {
  const n = week.shows.length, nC = geo.cities.length, [a, b] = weekRange(week);
  return (
    <Shot from={S} to={End}>
      <div style={{ position: 'absolute', inset: 0, background: V.paper2 }}>
        <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.10), 8) }}></div>
        <div style={{ position: 'absolute', left: 56, top: 326, fontFamily: 'Anton, sans-serif' }}>
          <Slam T={T} at={S + 0.05}><div style={{ fontSize: 220, lineHeight: 0.9, color: V.bg }}>{plural(n, 'SHOW', 'SHOWS')}</div></Slam>
          <div style={{ marginTop: 14 }}><Tape bg={V.hl} color={V.bg} size={52} rot={-1.5} p={MOTION.enter(T, S + 0.35, 0.3)}>{'EM ' + plural(nC, 'CIDADE', 'CIDADES') + ' · ' + a + ' A ' + b}</Tape></div>
        </div>
        <div style={{ position: 'absolute', left: MAP.x, top: MAP.y, width: MAP.w, height: MAP.h, border: '5px solid ' + V.bg }}>
          <MapCanvas T={T} S={S} End={End} geo={geo} th={{ land: V.paper, lit: V.hl, stroke: V.bg, sea: A('bg', 0.08), labelBg: V.bg, labelFg: V.paper, leader: V.bg, pinFill: V.alert, pinBorder: V.bg }} />
          <div style={{ position: 'absolute', left: -20, top: 18, width: 150, height: 40, background: A('hl', 0.85), transform: 'rotate(-28deg)' }}></div>
          <div style={{ position: 'absolute', right: -20, top: 18, width: 150, height: 40, background: A('hl', 0.85), transform: 'rotate(28deg)' }}></div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: MAP.y + MAP.h + 12, textAlign: 'center', font: '600 30px Inter, sans-serif', color: V.bg }}>bandas cover de Pearl Jam pelo Brasil</div>
      </div>
    </Shot>
  );
}

function DayBg({ T, S, End, day, w, mode }) {
  const life = clamp01((T - S) / (End - S));
  return day.shows.map((s, i) => (
    <div key={i} style={{ position: 'absolute', inset: 0, opacity: w[i] }}>
      {mode === 'clipe' && !s.semClipe
        ? <ClipPH label={'CLIPE ' + s.arrobaBanda.toUpperCase()} idx={s.banda.length} zoom={lerp(1.0, 1.1, life)} />
        : <div style={{ position: 'absolute', inset: 0, background: V.bg, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: -200, top: 200, opacity: 0.22, transform: 'rotate(-8deg) scale(' + lerp(1, 1.08, life) + ')' }}>
              <Logo src={LOGOS[s.arrobaBanda]} D={1480} ring={0} name={s.banda} />
            </div>
            <div style={{ position: 'absolute', inset: 0, ...HALF(A('hl', 0.10), 10) }}></div>
          </div>}
    </div>
  ));
}

const RY = 600, RH = 930, ROW = 96, GAP = 12;
function DayScene({ T, S, End, day, mode }) {
  const n = day.shows.length, { w } = dayWeights(T, day, S, End);
  const { HX, off } = accordion(n, RH, ROW, GAP, 780);
  return (
    <Shot from={S} to={End}>
      <DayBg T={T} S={S} End={End} day={day} w={w} mode={mode} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.92) + ' 0%, ' + A('bg', 0.55) + ' 30%, ' + A('bg', 0.35) + ' 60%, ' + A('bg', 0.9) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 44, top: 318 }}>
        <Slam T={T} at={S} from={1.35}><div style={{ font: '400 250px/0.86 Anton, sans-serif', color: V.hl }}>{day.word}</div></Slam>
      </div>
      <div style={{ position: 'absolute', right: 52, top: 466 }}>
        <Tape bg={V.paper} color={V.bg} size={86} rot={3} p={MOTION.enter(T, S + 0.18, 0.28)} pad="8px 22px">{day.dm}</Tape>
      </div>
      <div style={{ position: 'absolute', left: 50, top: RY + off, width: 980, display: 'flex', flexDirection: 'column', gap: GAP }}>
        {day.shows.map((s, i) => {
          const h = ROW + w[i] * (HX - ROW);
          const fs = Math.min(104, 880 / ((s.cidade.length + 1.2) * 0.5));
          const D = Math.max(130, Math.min(HX - fs - 110, 400));
          const hora = fmtHora(s.hora), en = MOTION.enter(T, S + 0.28 + i * 0.07, 0.45);
          return (
            <div key={i} style={{ position: 'relative', height: h, flexShrink: 0, overflow: 'hidden', background: V.paper, border: '4px solid ' + V.bg, boxSizing: 'border-box',
              transform: 'translateX(' + (1 - en) * 1100 + 'px) rotate(' + (i % 2 ? 0.5 : -0.5) * (1 - w[i]) + 'deg)' }}>
              <div style={{ position: 'absolute', inset: 0, background: V.hl, opacity: w[i] }}></div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ROW - 8, padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, opacity: clamp01(1 - w[i] / 0.45) }}>
                <div style={{ font: '400 54px/1 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.cidade.toUpperCase()}/{s.uf}</div>
                <div style={{ font: '700 30px Inter, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.banda}{hora ? ' · ' + hora : ''}</div>
              </div>
              <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HX - 8, padding: '30px 34px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: clamp01((w[i] - 0.55) / 0.45) }}>
                <div style={{ font: '400 ' + fs + 'px/0.95 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.cidade.toUpperCase()}<span style={{ fontSize: fs * 0.55 }}>/{s.uf}</span></div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 28, marginTop: 10 }}>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ font: '800 52px/1.05 Inter, sans-serif', color: V.bg, letterSpacing: -1 }}>{s.banda}</div>
                    <div style={{ font: '600 32px Inter, sans-serif', color: V.bg }}>{s.arrobaBanda}</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>
                      {casaDe(s) ? <div style={{ border: '3px solid ' + V.bg, padding: '6px 14px', font: '700 28px Inter, sans-serif', color: V.bg }}>{casaDe(s)}</div> : null}
                      {hora ? <div style={{ background: V.bg, padding: '6px 16px', font: '400 34px/1.1 Anton, sans-serif', color: V.hl }}>{hora}</div> : null}
                    </div>
                  </div>
                  <Logo src={LOGOS[s.arrobaBanda]} D={D} name={s.banda} />
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
  return (
    <Shot from={S} to={End}>
      <div style={{ position: 'absolute', inset: 0, background: V.hl }}>
        <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.09), 8) }}></div>
        <div style={{ position: 'absolute', right: 70, top: 330, opacity: MOTION.enter(T, S + 0.45, 0.1), transform: 'scale(' + lerp(0.4, 1, MOTION.pop(T, S + 0.45, 0.45)) + ') rotate(' + ((T - S) * 10 - 12) + 'deg)' }}>
          <div style={{ width: 300, height: 300, borderRadius: 150, overflow: 'hidden', border: '6px solid ' + V.bg }}>
            <img src="assets/selo-smufdpj.jpg" alt="" style={{ width: 330, height: 330, marginLeft: -21, marginTop: -21 }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: 56, top: 690, fontFamily: 'Anton, sans-serif', color: V.bg, lineHeight: 0.9 }}>
          <Slam T={T} at={S + 0.05}><div style={{ fontSize: 250 }}>TODA</div></Slam>
          <Slam T={T} at={S + 0.3}><div style={{ fontSize: 210 }}>TERÇA TEM</div></Slam>
        </div>
        <div style={{ position: 'absolute', left: 56, top: 1170 }}>
          <Tape bg={V.bg} color={V.hl} size={104} rot={-1.5} p={MOTION.enter(T, S + 0.75, 0.3)} pad="14px 30px">SEGUE @SMUFDPJ</Tape>
        </div>
        <div style={{ position: 'absolute', left: 60, top: 1360, opacity: MOTION.enter(T, S + 1.15, 0.3), transform: 'translateY(' + (1 - MOTION.enter(T, S + 1.15, 0.3)) * 24 + 'px)' }}>
          <div style={{ font: '600 32px Inter, sans-serif', color: V.bg }}>agenda completa:</div>
          <div style={{ font: '800 42px Inter, sans-serif', color: V.bg, letterSpacing: -0.5 }}>somaisumfadepearljam.com.br/agenda</div>
        </div>
      </div>
    </Shot>
  );
}

window.LAYOUTS.A = { map: { w: MAP.w, h: MAP.h }, sig: { open: V.paper, map: V.bg, day: V.paper, close: V.bg }, Opening, MapScene, DayScene, Closing, DayBg };
})();
