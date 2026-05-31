import React, { useEffect, useState } from "react";
import { fetchControl, setFail } from "../api.js";

// Painel pra injetar erros no mock sem mexer em arquivo/curl. Reflete o
// estado real do server (/_mock/control) e liga modos de falha que
// exercitam o pipeline: ratelimit (cooldown global), quota (pre-check
// aborta), videoerror (story/reel travado), storyPolls (video demora).
const MODES = [
  { v: "none", label: "Normal (sem falha)" },
  { v: "ratelimit", label: "Rate limit (code 4) → cooldown" },
  { v: "quota", label: "Quota saturada (49/50)" },
  { v: "videoerror", label: "Erro de processamento de video" },
];

export default function FailPanel() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("none");
  const [polls, setPolls] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchControl().then((c) => {
      setMode(c.fail || "none");
      setPolls(c.storyPolls || 0);
    }).catch(() => {});
  }, [open]);

  async function apply(nextMode, nextPolls) {
    await setFail(nextMode, nextPolls);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className={"failpanel" + (open ? " open" : "")}>
      <button className="fp-toggle" onClick={() => setOpen(!open)}>
        {mode !== "none" ? "⚠ falha: " + mode : "⚙ simular erro"}
      </button>
      {open && (
        <div className="fp-body">
          <label>Modo de falha</label>
          {MODES.map((m) => (
            <label key={m.v} className="fp-radio">
              <input type="radio" name="fail" checked={mode === m.v}
                onChange={() => { setMode(m.v); apply(m.v, polls); }} />
              {m.label}
            </label>
          ))}
          <label className="fp-polls">
            Polls ate video pronto: <b>{polls}</b>
            <input type="range" min="0" max="4" value={polls}
              onChange={(e) => { const p = Number(e.target.value); setPolls(p); apply(mode, p); }} />
          </label>
          {saved && <span className="fp-saved">aplicado ✓</span>}
          <p className="fp-hint">
            Depois rode <code>npm run mock:publish</code> (ou story) e veja o
            efeito nos logs do pipeline. Rate limit arma o cooldown global.
          </p>
        </div>
      )}
    </div>
  );
}
