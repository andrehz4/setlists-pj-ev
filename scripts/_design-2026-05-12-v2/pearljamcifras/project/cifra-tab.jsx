// ===== TABLATURE DISPLAY =====
// Renderiza pentagrama de tab (6 linhas) com numeros de traste,
// brackets de palm mute, e nota "ativa" destacada conforme o playhead.

function TabStaff({ measure, measureWidth, isActive, activeNoteIdx, palette }) {
  const W = measureWidth;
  const H = 110;
  const stringGap = 11;
  const top = 18;
  const bottom = top + stringGap * 5;
  const innerW = W - 24;
  const xPad = 14;
  const slotW = innerW / measure.beats;
  const stringY = (s) => bottom - s * stringGap; // s=0 grave (linha inferior)

  const p = palette || { ink: "#0a0a0a", accent: "#C0392B", glow: "#E89C3D" };

  // brackets PM
  const pmRanges = measure.pm || [];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pj-tab-staff" preserveAspectRatio="none">
      {/* Numero do compasso */}
      <text x="4" y="14" fontSize="9" fill="#8a8580" fontWeight="600">{measure.idx}</text>

      {/* PM brackets (em cima) */}
      {pmRanges.map((rng, i) => {
        const x1 = xPad + rng[0] * slotW;
        const x2 = xPad + (rng[1] + 1) * slotW;
        return (
          <g key={"pm" + i}>
            <text x={x1} y="10" fontSize="8" fill="#6a6560" fontWeight="600">P.M.</text>
            <line x1={x1 + 18} y1="7" x2={x2} y2="7" stroke="#6a6560" strokeWidth="0.6" strokeDasharray="2 2" />
            <line x1={x2} y1="7" x2={x2} y2="12" stroke="#6a6560" strokeWidth="0.6" />
          </g>
        );
      })}

      {/* Linhas das cordas */}
      {[0, 1, 2, 3, 4, 5].map(s => (
        <line
          key={"sl" + s}
          x1={xPad - 4} x2={W - 6}
          y1={stringY(s)} y2={stringY(s)}
          stroke="#bdb6ac" strokeWidth="0.7"
        />
      ))}

      {/* Compasso inicio/fim */}
      <line x1={xPad - 4} y1={stringY(0)} x2={xPad - 4} y2={stringY(5)} stroke="#7a7570" strokeWidth="1" />
      <line x1={W - 6} y1={stringY(0)} x2={W - 6} y2={stringY(5)} stroke="#7a7570" strokeWidth="1" />

      {/* Notas */}
      {measure.notes.map((n, i) => {
        const x = xPad + n.t * slotW + slotW / 2;
        const y = stringY(n.s);
        const active = isActive && activeNoteIdx === i;
        const txt = String(n.f);
        return (
          <g key={"n" + i}>
            {/* mask (caixinha branca atras do numero pra cobrir a linha) */}
            <rect x={x - 6.5} y={y - 6.5} width={txt.length * 5.5 + 6} height="11" fill="#fffaf2" rx="1" />
            <text
              x={x} y={y + 3}
              textAnchor="middle" fontSize="10" fontWeight="700"
              fill={active ? p.accent : "#1a1410"}
              style={{
                textShadow: active ? `0 0 8px ${p.glow}` : "none",
                transition: "color 0.1s, text-shadow 0.1s",
              }}
            >{txt}</text>
            {/* slide */}
            {n.slide && (
              <line
                x1={x + 6} y1={y - 1}
                x2={x + slotW * 0.7} y2={y + 5}
                stroke="#6a6560" strokeWidth="0.8"
              />
            )}
            {/* bend */}
            {n.bend && (
              <path
                d={`M ${x + 6} ${y} Q ${x + 12} ${y - 6} ${x + 18} ${y - 8}`}
                stroke={p.accent} strokeWidth="0.8" fill="none"
              />
            )}
          </g>
        );
      })}

      {/* Marcadores de tempo (bracket abaixo) - como na referencia */}
      {Array.from({ length: 8 }).map((_, b) => {
        const x = xPad + b * 2 * slotW;
        const w = slotW * 2;
        return (
          <g key={"bk" + b}>
            <line x1={x + 1} y1={bottom + 8} x2={x + 1} y2={bottom + 14} stroke="#a8a39c" strokeWidth="0.6" />
            <line x1={x + 1} y1={bottom + 14} x2={x + w - 1} y2={bottom + 14} stroke="#a8a39c" strokeWidth="0.6" />
            <line x1={x + w - 1} y1={bottom + 8} x2={x + w - 1} y2={bottom + 14} stroke="#a8a39c" strokeWidth="0.6" />
          </g>
        );
      })}

      {/* Playhead vertical (ativo no compasso atual) */}
      {isActive && activeNoteIdx >= 0 && activeNoteIdx < measure.notes.length && (
        <line
          x1={xPad + measure.notes[activeNoteIdx].t * slotW + slotW / 2}
          x2={xPad + measure.notes[activeNoteIdx].t * slotW + slotW / 2}
          y1={top - 4} y2={bottom + 18}
          stroke={p.accent} strokeWidth="1.5" opacity="0.85"
        />
      )}
    </svg>
  );
}

function TabSheet({ tab, currentMeasure, currentNoteIdx, palette, sheetStyle }) {
  // Quebra em linhas (4 compassos por linha)
  const lines = [];
  for (let i = 0; i < tab.measures.length; i += 4) {
    lines.push(tab.measures.slice(i, i + 4));
  }
  return (
    <div className={`pj-tab-sheet pj-sheet-${sheetStyle || "paper"}`}>
      {lines.map((line, li) => (
        <div className="pj-tab-line" key={li}>
          {line.map((m, mi) => (
            <div className="pj-tab-measure" key={mi}>
              <TabStaff
                measure={m}
                measureWidth={260}
                isActive={m.idx === currentMeasure}
                activeNoteIdx={currentNoteIdx}
                palette={palette}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, { TabSheet, TabStaff });
