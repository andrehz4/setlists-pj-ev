/* eslint-disable */
// Braço de violão horizontal — kraft paper aesthetic do site
// Wood tones combinam com a paleta kraft (#f3ede0 / #1a1612 / #9c1f22)
const Fretboard = ({ voice, activeBeat, isPlaying }) => {
  const NUM_FRETS = 22;
  const numStrings = voice.strings.length; // 4 (bass) ou 6 (guitar)
  const HEAD_W = 70;
  const BODY_W = 60;
  const NECK_H = numStrings === 4 ? 86 : 116;
  const FRET_W = 38;
  const TOTAL_W = HEAD_W + NUM_FRETS * FRET_W + BODY_W;

  // Linha atual da voz selecionada
  const allBeats = voice.lines.flatMap(l => l.beats);
  const current = isPlaying && activeBeat >= 0 ? allBeats[activeBeat % allBeats.length] : null;

  // Inlay dots Fender-style nos trastes 3,5,7,9,12,15,17,19,21
  const inlays = [3, 5, 7, 9, 12, 15, 17, 19, 21];

  return (
    <svg
      className="cifra-fretboard"
      viewBox={`0 0 ${TOTAL_W} ${NECK_H + 24}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      <defs>
        <linearGradient id="rosewood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a2014" />
          <stop offset="40%" stopColor="#5a3322" />
          <stop offset="100%" stopColor="#2a1408" />
        </linearGradient>
        <linearGradient id="headstock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f1815" />
          <stop offset="100%" stopColor="#0d0807" />
        </linearGradient>
        <linearGradient id="bodyEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5a3322" />
          <stop offset="100%" stopColor="#1f1410" />
        </linearGradient>
        <linearGradient id="fretMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8d4c8" />
          <stop offset="50%" stopColor="#8a8275" />
          <stop offset="100%" stopColor="#3a3328" />
        </linearGradient>
        <pattern id="kraftSpeck" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="transparent" />
          <circle cx="2" cy="3" r="0.3" fill="#1a1612" opacity="0.15" />
          <circle cx="5" cy="1" r="0.25" fill="#1a1612" opacity="0.1" />
        </pattern>
      </defs>

      {/* HEADSTOCK — preto, formato angular */}
      <g transform="translate(0, 12)">
        <path
          d={`M ${HEAD_W} 0 L 12 4 L 4 ${NECK_H * 0.35} L 4 ${NECK_H * 0.65} L 12 ${NECK_H - 4} L ${HEAD_W} ${NECK_H} Z`}
          fill="url(#headstock)"
          stroke="#000"
          strokeWidth="0.8"
        />
        {/* Tarraxas — 3 de cada lado (ou 2 pro baixo) */}
        {Array.from({ length: numStrings }).map((_, i) => {
          const cy = 6 + i * ((NECK_H - 12) / (numStrings - 1));
          return (
            <g key={i}>
              <circle cx={20} cy={cy} r="3.5" fill="#c8c0b0" stroke="#3a3328" strokeWidth="0.6" />
              <circle cx={20} cy={cy} r="1.4" fill="#3a3328" />
            </g>
          );
        })}
        {/* Adesivo PJ stickman colado no headstock */}
        <image
          href="assets/pj-stickman.png"
          x={32}
          y={NECK_H / 2 - 22}
          width="36"
          height="44"
          opacity="0.92"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.6))' }}
        />
      </g>

      {/* BRAÇO (FINGERBOARD) */}
      <g transform={`translate(${HEAD_W}, 12)`}>
        <rect width={NUM_FRETS * FRET_W} height={NECK_H} fill="url(#rosewood)" />
        {/* Speckle pra parecer madeira */}
        <rect width={NUM_FRETS * FRET_W} height={NECK_H} fill="url(#kraftSpeck)" opacity="0.4" />

        {/* Trastes (linhas metálicas) */}
        {Array.from({ length: NUM_FRETS + 1 }).map((_, i) => (
          <rect
            key={i}
            x={i * FRET_W - 1}
            y={-2}
            width={i === 0 ? 5 : 2}
            height={NECK_H + 4}
            fill={i === 0 ? '#d8d4c8' : 'url(#fretMetal)'}
            rx={i === 0 ? 1.5 : 0.5}
          />
        ))}

        {/* Inlay dots */}
        {inlays.map(fret => {
          if (fret > NUM_FRETS) return null;
          const cx = (fret - 0.5) * FRET_W;
          if (fret === 12) {
            // Dot duplo no traste 12
            return (
              <g key={fret}>
                <circle cx={cx} cy={NECK_H * 0.3} r="3.5" fill="#ebe4d3" opacity="0.75" />
                <circle cx={cx} cy={NECK_H * 0.7} r="3.5" fill="#ebe4d3" opacity="0.75" />
              </g>
            );
          }
          return <circle key={fret} cx={cx} cy={NECK_H / 2} r="3.5" fill="#ebe4d3" opacity="0.7" />;
        })}

        {/* Cordas */}
        {voice.strings.map((s, i) => {
          const y = 4 + i * ((NECK_H - 8) / (numStrings - 1));
          const gauge = 0.4 + i * (numStrings === 4 ? 0.4 : 0.28); // mais grossa em baixo
          const isActive = current && current.s === i;
          return (
            <g key={i}>
              <line
                x1={0}
                y1={y}
                x2={NUM_FRETS * FRET_W}
                y2={y}
                stroke={i < 3 && numStrings === 6 ? '#e8dfc8' : '#c9b896'}
                strokeWidth={gauge + 0.4}
                opacity="0.92"
              />
              {/* Vibração ativa */}
              {isActive && (
                <line
                  x1={0}
                  y1={y}
                  x2={NUM_FRETS * FRET_W}
                  y2={y}
                  stroke={voice.color}
                  strokeWidth={gauge + 1.6}
                  opacity="0.35"
                >
                  <animate attributeName="opacity" values="0.5;0.15;0.5" dur="0.18s" repeatCount="indefinite" />
                </line>
              )}
            </g>
          );
        })}

        {/* Nota tocando agora — círculo laranja igual referência */}
        {current && (
          <g>
            {/* Linha colorida ligando a nota até a borda direita (highlight da corda) */}
            <line
              x1={(current.f) * FRET_W - FRET_W / 2 + 8}
              y1={4 + current.s * ((NECK_H - 8) / (numStrings - 1))}
              x2={NUM_FRETS * FRET_W}
              y2={4 + current.s * ((NECK_H - 8) / (numStrings - 1))}
              stroke={voice.color}
              strokeWidth="3"
              opacity="0.55"
              strokeLinecap="round"
            />
            <circle
              cx={(current.f - 0.5) * FRET_W}
              cy={4 + current.s * ((NECK_H - 8) / (numStrings - 1))}
              r="9"
              fill={voice.color}
              stroke="#fff"
              strokeWidth="1.5"
            >
              <animate attributeName="r" values="9;11;9" dur="0.3s" repeatCount="indefinite" />
            </circle>
            <text
              x={(current.f - 0.5) * FRET_W}
              y={4 + current.s * ((NECK_H - 8) / (numStrings - 1)) + 3.5}
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="#fff"
              fontFamily="JetBrains Mono, monospace"
            >
              {current.f}
            </text>
          </g>
        )}

        {/* Fret numbers (abaixo) */}
        {[5, 7, 12, 15, 17].map(f => (
          <text
            key={f}
            x={(f - 0.5) * FRET_W}
            y={NECK_H + 14}
            textAnchor="middle"
            fontSize="9"
            fill="#8a7f6d"
            fontFamily="JetBrains Mono, monospace"
          >
            {f}
          </text>
        ))}
      </g>

      {/* BODY (lado direito - borda do corpo do violão) */}
      <g transform={`translate(${HEAD_W + NUM_FRETS * FRET_W}, 12)`}>
        <rect width={BODY_W} height={NECK_H} fill="url(#bodyEdge)" />
        {/* Pickup hint */}
        <rect x={6} y={NECK_H * 0.2} width={BODY_W - 12} height={NECK_H * 0.6} fill="#0a0807" rx="2" />
        <rect x={10} y={NECK_H * 0.25} width={BODY_W - 20} height={NECK_H * 0.5} fill="#3a3328" rx="1" />
        {/* Adesivo PJ sun-logo na lateral do corpo */}
        <image
          href="assets/pj-sun-logo.png"
          x={BODY_W - 36}
          y={-2}
          width="32"
          height="32"
          opacity="0.78"
          style={{ filter: 'invert(1) drop-shadow(0 1px 1px rgba(0,0,0,0.5))', transform: 'rotate(15deg)', transformOrigin: `${BODY_W - 20}px 14px` }}
        />
      </g>
    </svg>
  );
};

window.Fretboard = Fretboard;
