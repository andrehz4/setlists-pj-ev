import React from "react";

// Medidor do limite que DERRUBA o feed (code 4 = limite da app): chamadas Graph
// na ultima HORA vs ~200 x usuarios (doc Meta). E o limite ativo (o erro real e
// code 4). Vermelho ao passar do alarme (80%). O numero verdadeiro da conta
// aparece no log do pipeline (header X-App-Usage, call_count em %).
export default function UsageMeter({ usage }) {
  const { used, limit, alarmAt, over, pct, users } = usage;
  return (
    <div className={"usage-meter" + (over ? " over" : "")}>
      <div className="usage-top">
        <span className="usage-label">
          chamadas Graph na ultima hora
          <small>limite da app (code 4) = 200 × usuarios ({users}) = {limit.toLocaleString("pt-BR")}/h · alarme {alarmAt.toLocaleString("pt-BR")}</small>
        </span>
        <b>{used}<span>/{limit.toLocaleString("pt-BR")}</span></b>
      </div>
      <div className="usage-bar">
        <i style={{ width: Math.min(100, pct) + "%" }} />
        <span className="usage-alarm" style={{ left: (alarmAt / limit * 100) + "%" }} title={`alarme em ${alarmAt}`} />
      </div>
      {over
        ? <p className="usage-msg over">acima do alarme. Nesse ritmo o feed estoura o limite da app (code 4).</p>
        : <p className="usage-msg ok">dentro do orcamento. O numero real da conta sai no log do pipeline (X-App-Usage).</p>}
    </div>
  );
}
