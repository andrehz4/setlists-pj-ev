// ===== FRETBOARD ANIMADO =====
// Brace horizontal de violao com madeira (rosewood), trastes, marcadores
// e adesivos de Pearl Jam no corpo (areas nao-animadas).

const FRET_COUNT = 14;
const STRING_COUNT = 6;
// Espacamento dos trastes baseado em Vincenzo Galilei (1/17.817 da regua a cada traste)
function fretX(i, scale) {
  // scale = largura total da regua de trastes
  let pos = 0;
  let remaining = 1;
  const arr = [0];
  for (let k = 1; k <= FRET_COUNT; k++) {
    const step = remaining / 17.817;
    pos += step;
    remaining -= step;
    arr.push(pos);
  }
  return arr[i] / arr[FRET_COUNT] * scale;
}
const FRET_POSITIONS = (() => {
  const arr = [];
  for (let i = 0; i <= FRET_COUNT; i++) arr.push(fretX(i, 1));
  return arr;
})();

function PJStickerStickman({ size = 60, color = "#1a1410" }) {
  // Silhueta minimalista do "stickman" do logo do PJ (versao decal)
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <g fill={color}>
        <circle cx="50" cy="22" r="8" />
        <path d="M 50 30 L 50 60 M 30 42 L 70 42 M 50 60 L 35 85 M 50 60 L 65 85" stroke={color} strokeWidth="5" strokeLinecap="round" fill="none" />
      </g>
    </svg>
  );
}

function PJStickerTen({ size = 80, palette }) {
  // Cinco silhuetas em circulo (capa do Ten)
  const p = palette || { ink: "#F2C572", accent: "#C0392B" };
  const figs = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const x = 50 + Math.cos(a) * 22;
    const y = 50 + Math.sin(a) * 22;
    figs.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(${(i / 5) * 360})`}>
        <circle cx="0" cy="-4" r="2.5" fill={p.ink} />
        <rect x="-1.5" y="-2" width="3" height="6" fill={p.ink} />
      </g>
    );
  }
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <circle cx="50" cy="50" r="38" fill="none" stroke={p.accent} strokeWidth="2" opacity="0.75" />
      {figs}
      <text x="50" y="56" textAnchor="middle" fontFamily="serif" fontSize="14" fontWeight="700" fill={p.accent} letterSpacing="2">TEN</text>
    </svg>
  );
}

function PJStickerWords({ words, color = "#C0392B", rotate = -8 }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 2, transform: `rotate(${rotate}deg)`,
      fontFamily: "'Bebas Neue', 'Oswald', sans-serif", fontWeight: 700, letterSpacing: 2,
      color, lineHeight: 0.95, textTransform: "uppercase", fontSize: 11,
    }}>
      {words.map((w, i) => <span key={i}>{w}</span>)}
    </div>
  );
}

// Strings com vibracao
function GuitarString({ y, gauge, vibrating, length }) {
  // gauge: espessura (1..3 sendo as mais grossas)
  const stroke = 0.6 + (5 - gauge) * 0.35;
  return (
    <g>
      <line
        x1="0" y1={y} x2={length} y2={y}
        stroke="#d8d4cc" strokeWidth={stroke}
        style={{
          filter: "drop-shadow(0 1px 0.5px rgba(0,0,0,0.5))",
          animation: vibrating ? `pjStringVibrate 0.4s ease-out` : "none",
          transformOrigin: "center",
        }}
      />
    </g>
  );
}

function FretMarkerDot({ cx, cy, double }) {
  if (double) {
    return (
      <g>
        <circle cx={cx} cy={cy - 12} r="3" fill="#e8d8b8" opacity="0.85" />
        <circle cx={cx} cy={cy + 12} r="3" fill="#e8d8b8" opacity="0.85" />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r="3.5" fill="#e8d8b8" opacity="0.85" />;
}

function Fretboard({ activeNote, stringStates, palette, stickerStyle, neckStyle }) {
  // Dimensoes
  const W = 1040;
  const H = 200;
  const headW = 70;       // headstock area (esquerda)
  const bodyW = 80;       // body area (direita)
  const fbW = W - headW - bodyW;
  const fbH = 130;
  const fbX = headW;
  const fbY = (H - fbH) / 2;

  const stringY = (s) => fbY + 12 + (s * (fbH - 24)) / (STRING_COUNT - 1);

  // Madeira
  const woodFill = neckStyle === "ebony" ? "#1a1410" : neckStyle === "maple" ? "#d4a865" : "#3a1f15";
  const woodGrain = neckStyle === "ebony" ? "#251a13" : neckStyle === "maple" ? "#b8895a" : "#4a2818";
  const fretMetal = "#c8c4be";

  const palmuteGuide = activeNote ? activeNote.pm : false;
  const p = palette || { ink: "#F2C572", accent: "#C0392B", glow: "#E89C3D" };

  return (
    <div className="pj-fretboard-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} className="pj-fretboard" preserveAspectRatio="none">
        <defs>
          <linearGradient id="woodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={woodFill} />
            <stop offset="0.5" stopColor={woodGrain} />
            <stop offset="1" stopColor={woodFill} />
          </linearGradient>
          <pattern id="woodGrain" x="0" y="0" width="100" height="20" patternUnits="userSpaceOnUse">
            <rect width="100" height="20" fill="url(#woodGrad)" />
            <path d="M0 4 Q 30 6 60 4 T 100 5" stroke={woodGrain} strokeWidth="0.5" fill="none" opacity="0.6" />
            <path d="M0 10 Q 25 12 50 10 T 100 11" stroke={woodGrain} strokeWidth="0.4" fill="none" opacity="0.5" />
            <path d="M0 16 Q 40 18 70 17 T 100 16" stroke={woodGrain} strokeWidth="0.3" fill="none" opacity="0.4" />
          </pattern>
          <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2a2722" />
            <stop offset="0.5" stopColor="#3a342c" />
            <stop offset="1" stopColor="#1a1814" />
          </linearGradient>
          <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#1a1814" />
            <stop offset="1" stopColor="#2a2722" />
          </linearGradient>
          <radialGradient id="noteGlow">
            <stop offset="0" stopColor={p.glow} stopOpacity="1" />
            <stop offset="0.5" stopColor={p.accent} stopOpacity="0.6" />
            <stop offset="1" stopColor={p.accent} stopOpacity="0" />
          </radialGradient>
          <filter id="strSh" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="0.4" />
          </filter>
        </defs>

        {/* HEADSTOCK (esquerda) */}
        <rect x="0" y={fbY + 5} width={headW} height={fbH - 10} fill="url(#headGrad)" rx="6" />
        {/* Tarraxas */}
        {[0, 1, 2].map(i => (
          <g key={"tunerL" + i}>
            <circle cx={20} cy={fbY + 25 + i * 35} r="6" fill="#888" stroke="#444" strokeWidth="0.5" />
            <circle cx={20} cy={fbY + 25 + i * 35} r="3" fill="#c0c0c0" />
          </g>
        ))}
        {/* Decal stickman no headstock */}
        <g transform={`translate(${headW - 30} ${fbY + 8})`}>
          <foreignObject x="0" y="0" width="28" height="32">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{transform: "rotate(-12deg)", opacity: 0.92}}>
              <PJStickerStickman size={28} color={p.ink} />
            </div>
          </foreignObject>
        </g>

        {/* BRACO (fretboard wood) */}
        <rect x={fbX} y={fbY} width={fbW} height={fbH} fill="url(#woodGrain)" />
        <rect x={fbX} y={fbY} width={fbW} height={fbH} fill="url(#woodGrad)" opacity="0.5" />

        {/* Trastes */}
        {FRET_POSITIONS.map((pos, i) => {
          if (i === 0) {
            // Pestana (nut)
            return <rect key={"nut"} x={fbX} y={fbY} width="5" height={fbH} fill="#e8e0d0" />;
          }
          const x = fbX + pos * fbW;
          return <rect key={"fret" + i} x={x - 1.2} y={fbY} width="2.4" height={fbH} fill={fretMetal} opacity="0.9" />;
        })}

        {/* Marcadores de traste (dots) */}
        {[3, 5, 7, 9, 12].map(f => {
          const cx = fbX + ((FRET_POSITIONS[f - 1] + FRET_POSITIONS[f]) / 2) * fbW;
          const cy = fbY + fbH / 2;
          return <FretMarkerDot key={"dot" + f} cx={cx} cy={cy} double={f === 12} />;
        })}

        {/* Cordas */}
        {Array.from({ length: STRING_COUNT }).map((_, s) => {
          const inverted = STRING_COUNT - 1 - s; // visualmente, corda 0 = mais grave = mais espessa = embaixo? Vamos por mais grave em cima
          const y = stringY(s);
          return (
            <GuitarString
              key={"str" + s}
              y={y}
              gauge={s}
              length={W}
              vibrating={stringStates && stringStates[s]}
            />
          );
        })}

        {/* CORPO (direita) */}
        <rect x={W - bodyW} y={fbY - 20} width={bodyW} height={fbH + 40} fill="url(#bodyGrad)" rx="8" />
        {/* Captadores */}
        <rect x={W - bodyW + 10} y={fbY - 10} width="14" height={fbH + 20} fill="#0a0a08" rx="3" />
        <rect x={W - bodyW + 30} y={fbY - 10} width="14" height={fbH + 20} fill="#0a0a08" rx="3" />
        {/* Saida jack */}
        <circle cx={W - 18} cy={fbY + fbH / 2} r="5" fill="#1a1814" />

        {/* ADESIVO TEN no corpo */}
        <g transform={`translate(${W - bodyW - 6} ${fbY - 18}) rotate(-6)`}>
          <foreignObject x="0" y="0" width="60" height="60">
            <div xmlns="http://www.w3.org/1999/xhtml" style={{opacity: stickerStyle === "off" ? 0 : 0.95}}>
              {stickerStyle !== "off" && <PJStickerTen size={56} palette={p} />}
            </div>
          </foreignObject>
        </g>

        {/* Nota ativa: highlight */}
        {activeNote && (
          <>
            {/* Linha-faixa sobre a corda */}
            <rect
              x={fbX}
              y={stringY(activeNote.s) - 6}
              width={fbW}
              height="12"
              fill={p.glow}
              opacity="0.18"
              rx="2"
            />
            {/* Glow no traste */}
            <circle
              cx={fbX + ((FRET_POSITIONS[Math.max(0, activeNote.f - 1)] + FRET_POSITIONS[activeNote.f]) / 2) * fbW}
              cy={stringY(activeNote.s)}
              r="18"
              fill="url(#noteGlow)"
              opacity="0.9"
            />
            <circle
              cx={fbX + ((FRET_POSITIONS[Math.max(0, activeNote.f - 1)] + FRET_POSITIONS[activeNote.f]) / 2) * fbW}
              cy={stringY(activeNote.s)}
              r="9"
              fill={p.glow}
              stroke="#fff"
              strokeWidth="1.5"
            />
            <text
              x={fbX + ((FRET_POSITIONS[Math.max(0, activeNote.f - 1)] + FRET_POSITIONS[activeNote.f]) / 2) * fbW}
              y={stringY(activeNote.s) + 3}
              textAnchor="middle"
              fontSize="10"
              fontWeight="700"
              fill="#1a1410"
            >
              {activeNote.f}
            </text>
          </>
        )}
      </svg>

      {/* Adesivos decais flutuantes sobre o corpo (HTML para texto bonito) */}
      {stickerStyle === "words" && (
        <>
          <div className="pj-decal pj-decal-1">
            <PJStickerWords words={["Pearl", "Jam"]} color={p.accent} rotate={-10} />
          </div>
          <div className="pj-decal pj-decal-2">
            <PJStickerWords words={["10", "Club"]} color={p.ink} rotate={6} />
          </div>
        </>
      )}
    </div>
  );
}

Object.assign(window, { Fretboard, PJStickerStickman, PJStickerTen, FRET_POSITIONS, fretX });
