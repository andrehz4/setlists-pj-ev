import React from "react";

// Medidor do limite REAL do Instagram: chamadas Graph nas ultimas 24h vs o teto
// (4800 x impressoes/24h, doc Meta). O teto cresce com o alcance da conta; o
// mock simula com MOCK_IMPRESSIONS. Vermelho ao passar do alarme (80%).
// O numero verdadeiro da conta aparece no log do pipeline (header x-app-usage).
export default function UsageMeter({ usage }) {
  const { used, limit, alarmAt, over, pct, impressions } = usage;
  return (
    <div className={"usage-meter" + (over ? " over" : "")}>
      <div className="usage-top">
        <span className="usage-label">
          chamadas Graph nas ultimas 24h
          <small>limite IG = 4800 × impressoes ({impressions} simuladas) = {limit.toLocaleString("pt-BR")} · alarme {alarmAt.toLocaleString("pt-BR")}</small>
        </span>
        <b>{used}<span>/{limit.toLocaleString("pt-BR")}</span></b>
      </div>
      <div className="usage-bar">
        <i style={{ width: Math.min(100, pct) + "%" }} />
        <span className="usage-alarm" style={{ left: (alarmAt / limit * 100) + "%" }} title={`alarme em ${alarmAt}`} />
      </div>
      {over
        ? <p className="usage-msg over">acima do alarme. Nesse ritmo o feed estoura o limite do Instagram (code 4 / 80002).</p>
        : <p className="usage-msg ok">dentro do orcamento. Teto cresce com as impressoes da conta. O numero real sai no log (x-app-usage).</p>}
    </div>
  );
}
