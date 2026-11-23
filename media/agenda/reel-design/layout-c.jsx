// Layout C · Lambe-lambe / xerox recortado.
(() => {
const { clamp01, lerp, MOTION, V, A, HALF, rng, torn, LOGOS, fmtHora, casaDe, weekRange, plural, dayWeights, accordion, MapCanvas, ClipPH, Logo } = window.RC;
const MAP = { x: 60, y: 660, w: 960, h: 800 };
const CYCLE = [[V.paper, V.bg], [V.bg, V.paper], [V.hl, V.bg], [V.paper2, V.bg], [V.alert, V.paper]];

// Letras de bilhete de resgate: cada caractere num recorte próprio.
function Ransom({ T, at, text, size, seed, stagger = 0.035, gap = 6 }) {
  const r = rng(seed);
  const chars = text.split('').map(ch => ({ ch, c: CYCLE[Math.floor(r() * CYCLE.length)], serif: r() < 0.35, rot: r() * 9 - 4.5, k: 0.88 + r() * 0.22, dy: r() * 14 - 7 }));
  let j = 0;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap, rowGap: gap * 2 }}>
      {chars.map((o, i) => {
        if (o.ch === ' ') return <div key={i} style={{ width: size * 0.22 }}></div>;
        const t0 = at + (j++) * stagger, p = MOTION.pop(T, t0, 0.3);
        return (
          <div key={i} style={{ background: o.c[0], color: o.c[1], padding: '0 ' + size * 0.08 + 'px', transform: 'translateY(' + o.dy + 'px) rotate(' + o.rot + 'deg) scale(' + lerp(1.6, 1, p) + ')', opacity: T >= t0 ? 1 : 0,
            font: o.serif ? 'italic 900 ' + size * o.k * 0.92 + 'px/1.15 "Playfair Display", serif' : '400 ' + size * o.k + 'px/1.12 Anton, sans-serif' }}>{o.ch}</div>
        );
      })}
    </div>
  );
}
// Pedaço de papel colado: entra "batido" na parede.
function Paste({ T, at, rot = 0, seed, bg, style, children, amp = 1.4, from = 1.12 }) {
  const p = MOTION.pop(T, at, 0.32);
  return (
    <div style={{ position: 'absolute', ...style, opacity: T >= at ? 1 : 0, transform: 'rotate(' + lerp(rot + 5, rot, clamp01(p)) + 'deg) scale(' + lerp(from, 1, p) + ')' }}>
      <div style={{ background: bg, clipPath: torn(seed, amp) }}>{children}</div>
    </div>
  );
}
function TapeBit({ style, rot }) { return <div style={{ position: 'absolute', width: 150, height: 42, background: A('paper2', 0.78), transform: 'rotate(' + rot + 'deg)', ...style }}></div>; }
function Wall() {
  return (
    <div style={{ position: 'absolute', inset: 0, background: V.paper2 }}>
      <div style={{ position: 'absolute', left: -60, top: 1540, width: 700, height: 500, background: A('bg', 0.12), clipPath: torn(91, 4), transform: 'rotate(6deg)' }}></div>
      <div style={{ position: 'absolute', left: 620, top: -80, width: 600, height: 380, background: A('hl', 0.35), clipPath: torn(57, 4), transform: 'rotate(-5deg)' }}></div>
      <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.16), 6, 1.4) }}></div>
    </div>
  );
}

function Opening({ T, S, End }) {
  const cut = (End - S) / 4;
  return (
    <Shot from={S} to={End}>
      {[0, 1, 2, 3].map(i => (
        <Shot key={i} from={S + i * cut} to={S + (i + 1) * cut}>
          <ClipPH label={'CLIPE PJ ' + (i + 1)} idx={i} zoom={lerp(1.02 + i * 0.02, 1.12, clamp01((T - S - i * cut) / cut))} />
        </Shot>
      ))}
      <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.35), 6, 1.6) }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.4) + ' 0%, ' + A('bg', 0) + ' 30%, ' + A('bg', 0.7) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 50, top: 880, width: 980 }}><Ransom T={T} at={S + 0.1} text="ONDE TEM" size={120} seed={11} /></div>
      <div style={{ position: 'absolute', left: 40, top: 1050, width: 1000 }}><Ransom T={T} at={S + cut} text="PEARL JAM" size={150} seed={23} stagger={0.03} /></div>
      <div style={{ position: 'absolute', left: 70, top: 1250, width: 980 }}><Ransom T={T} at={S + cut * 2} text="AO VIVO" size={120} seed={37} /></div>
      <Paste T={T} at={S + cut * 3} rot={-3} seed={5} bg={V.hl} style={{ left: 60, top: 1405 }}>
        <div style={{ padding: '14px 34px', font: '400 92px/1 Anton, sans-serif', color: V.bg }}>ESSA SEMANA?</div>
      </Paste>
    </Shot>
  );
}

function MapScene({ T, S, End, geo, week }) {
  const n = week.shows.length, nC = geo.cities.length, [a, b] = weekRange(week);
  const p = MOTION.pop(T, S, 0.35);
  return (
    <Shot from={S} to={End}>
      <Wall />
      <div style={{ position: 'absolute', left: 54, top: 300, width: 980 }}><Ransom T={T} at={S + 0.05} text={plural(n, 'SHOW', 'SHOWS')} size={150} seed={71} /></div>
      <Paste T={T} at={S + 0.4} rot={2} seed={8} bg={V.bg} style={{ left: 60, top: 520 }}>
        <div style={{ padding: '10px 28px', font: '400 50px/1 Anton, sans-serif', color: V.hl, whiteSpace: 'nowrap' }}>{'EM ' + plural(nC, 'CIDADE', 'CIDADES') + ' · ' + a + ' A ' + b}</div>
      </Paste>
      <div style={{ position: 'absolute', left: MAP.x, top: MAP.y, width: MAP.w, height: MAP.h, transform: 'rotate(' + lerp(3, -1.2, clamp01(p)) + 'deg) scale(' + lerp(1.08, 1, p) + ')' }}>
        <div style={{ position: 'absolute', inset: 0, clipPath: torn(19, 1.2, 24), background: V.paper }}>
          <MapCanvas T={T} S={S} End={End} geo={geo} th={{ land: V.paper, lit: V.hl, stroke: V.bg, sea: A('bg', 0.22), labelBg: V.hl, labelFg: V.bg, labelBorder: '3px solid ' + V.bg, labelRot: i => (i % 2 ? 3 : -3), leader: V.bg, pinFill: V.alert, pinBorder: V.bg }} />
          <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.12), 5, 1.1) }}></div>
        </div>
        <TapeBit rot={-35} style={{ left: -40, top: -6 }} />
        <TapeBit rot={35} style={{ right: -40, top: -6 }} />
        <TapeBit rot={-8} style={{ left: 400, bottom: -18 }} />
      </div>
    </Shot>
  );
}

const RY = 600, RH = 930, ROW = 96, GAP = 16;
function DayScene({ T, S, End, day, mode }) {
  const n = day.shows.length, { w, sw } = dayWeights(T, day, S, End);
  const { HX, off } = accordion(n, RH, ROW, GAP, 800);
  const DayBg = window.LAYOUTS.A.DayBg;
  return (
    <Shot from={S} to={End}>
      <DayBg T={T} S={S} End={End} day={day} w={w} mode={mode} />
      <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.3), 6, 1.5) }}></div>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, ' + A('bg', 0.75) + ' 0%, ' + A('bg', 0.35) + ' 35%, ' + A('bg', 0.7) + ' 100%)' }}></div>
      <div style={{ position: 'absolute', left: 50, top: 300, width: 760 }}><Ransom T={T} at={S} text={day.word} size={150} seed={day.word.length * 13 + 3} stagger={0.03} /></div>
      <Paste T={T} at={S + 0.25} rot={-4} seed={day.dm.charCodeAt(0) + 2} bg={V.paper} style={{ right: 50, top: 450 }}>
        <div style={{ padding: '8px 26px', font: '400 80px/1 Anton, sans-serif', color: V.bg }}>{day.dm}</div>
      </Paste>
      <div style={{ position: 'absolute', left: 40, top: RY + off, width: 1000, display: 'flex', flexDirection: 'column', gap: GAP }}>
        {day.shows.map((s, i) => {
          const h = ROW + w[i] * (HX - ROW), hora = fmtHora(s.hora);
          const en = MOTION.enter(T, S + 0.28 + i * 0.07, 0.45);
          const pasteAt = i === 0 ? S + 0.28 : sw[i];
          const pp = MOTION.pop(T, pasteAt, 0.4) * w[i];
          const fs = Math.min(118, 920 / ((s.cidade.length + 1.2) * 0.47));
          const D = Math.max(120, Math.min(HX - fs - 170, 330));
          const dx = (i % 2 ? 24 : 0) * (1 - w[i]);
          return (
            <div key={i} style={{ position: 'relative', height: h, flexShrink: 0, transform: 'translateX(' + ((1 - en) * -1150 + dx) + 'px) rotate(' + (i % 2 ? 1.2 : -1.2) * (1 - w[i]) + 'deg) scale(' + lerp(1, 1.035, w[i] * (1 - clamp01(pp))) + ')' }}>
              <div style={{ position: 'absolute', inset: 0, clipPath: torn(31 + i * 7, 1.6, 20), background: V.paper2, overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: V.paper, opacity: w[i] }}></div>
                <div style={{ position: 'absolute', inset: 0, ...HALF(A('bg', 0.12), 5, 1.1) }}></div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: ROW, padding: '0 34px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, opacity: clamp01(1 - w[i] / 0.45) }}>
                  <div style={{ font: '400 52px/1 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.cidade.toUpperCase()}/{s.uf}</div>
                  <div style={{ font: 'italic 900 32px "Playfair Display", serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.banda}{hora ? ' · ' + hora : ''}</div>
                </div>
                <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: HX, padding: '30px 40px 34px', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', opacity: clamp01((w[i] - 0.55) / 0.45) }}>
                  <div style={{ font: '400 ' + fs + 'px/0.95 Anton, sans-serif', color: V.bg, whiteSpace: 'nowrap' }}>{s.cidade.toUpperCase()}<span style={{ color: V.alert }}>/{s.uf}</span></div>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 30 }}>
                    <Logo src={LOGOS[s.arrobaBanda]} D={D} ring={0} name={s.banda} />
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ font: 'italic 900 60px/1.05 "Playfair Display", serif', color: V.bg }}>{s.banda}</div>
                      <div style={{ font: '700 32px Inter, sans-serif', color: V.bg }}>{s.arrobaBanda}</div>
                      {casaDe(s) ? <div style={{ font: '600 30px Inter, sans-serif', color: V.bg }}>{casaDe(s)}</div> : null}
                    </div>
                  </div>
                  {hora ? <div style={{ alignSelf: 'flex-start', background: V.bg, color: V.hl, font: '400 56px/1 Anton, sans-serif', padding: '10px 24px', clipPath: torn(i + 3, 3, 8), transform: 'rotate(-2deg)' }}>{'ÀS ' + hora}</div> : null}
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
      <Wall />
      <Paste T={T} at={S + 0.45} rot={8} seed={44} bg={V.paper} amp={0.6} style={{ right: 70, top: 300 }}>
        <img src="assets/selo-smufdpj.jpg" alt="" style={{ display: 'block', width: 280, height: 280 }} />
      </Paste>
      <div style={{ position: 'absolute', left: 50, top: 650, width: 980 }}><Ransom T={T} at={S + 0.05} text="TODA" size={190} seed={83} /></div>
      <div style={{ position: 'absolute', left: 50, top: 900, width: 1000 }}><Ransom T={T} at={S + 0.3} text="TERÇA TEM" size={140} seed={97} stagger={0.03} /></div>
      <Paste T={T} at={S + 0.75} rot={-2.5} seed={61} bg={V.bg} style={{ left: 50, top: 1140 }}>
        <div style={{ padding: '18px 36px', font: '400 100px/1 Anton, sans-serif', color: V.hl }}>SEGUE @SMUFDPJ</div>
      </Paste>
      <Paste T={T} at={S + 1.15} rot={1.5} seed={29} bg={V.paper} style={{ left: 70, top: 1340 }}>
        <div style={{ padding: '16px 30px' }}>
          <div style={{ font: '600 30px Inter, sans-serif', color: V.bg }}>agenda completa:</div>
          <div style={{ font: '800 40px Inter, sans-serif', color: V.bg, letterSpacing: -0.5 }}>somaisumfadepearljam.com.br/agenda</div>
        </div>
      </Paste>
    </Shot>
  );
}

window.LAYOUTS.C = { map: { w: MAP.w, h: MAP.h, lab: { fs: 32, h: 50, cw: 18, pad: 30 } }, sig: { open: V.paper, map: V.bg, day: V.paper, close: V.bg }, Opening, MapScene, DayScene, Closing };
})();
