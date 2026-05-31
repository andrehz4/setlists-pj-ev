import React from "react";

// Medidor do limite REAL que derruba o feed: chamadas Graph na ultima hora
// vs ~200 (limite da app, code 4). Vermelho ao passar do alarme (80% = 160).
// Esse e o numero que importa: se estourar aqui, o Meta bloqueia com code 4.
export default function UsageMeter({ usage }) {
  const { used, limit, alarmAt, over, pct } = usage;
  return (
    <div className={"usage-meter" + (over ? " over" : "")}>
      <div className="usage-top">
        <span className="usage-label">
          chamadas Graph na ultima hora
          <small>limite da app (code 4) ~{limit}/h · alarme {alarmAt}</small>
        </span>
        <b>{used}<span>/{limit}</span></b>
      </div>
      <div className="usage-bar">
        <i style={{ width: Math.min(100, pct) + "%" }} />
        <span className="usage-alarm" style={{ left: (alarmAt / limit * 100) + "%" }} title={`alarme em ${alarmAt}`} />
      </div>
      {over
        ? <p className="usage-msg over">acima do alarme. Nesse ritmo o feed estoura o limite da app (code 4).</p>
        : <p className="usage-msg ok">dentro do orcamento. {alarmAt - used > 0 ? `${alarmAt - used} chamadas ate o alarme.` : ""}</p>}
    </div>
  );
}
