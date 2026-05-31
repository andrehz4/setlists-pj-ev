import React, { useEffect, useState } from "react";
import { fetchControl, setFail } from "../api.js";

// Modal pra injetar erros no mock sem mexer em arquivo/curl. Reflete o
// estado real do server (/_mock/control) e liga modos que exercitam o
// pipeline: ratelimit (cooldown global), quota (pre-check aborta),
// videoerror (story/reel travado), polls (video demora a ficar pronto).
const MODES = [
  { v: "none", label: "Normal (sem falha)" },
  { v: "ratelimit", label: "Rate limit (code 4) → arma cooldown global" },
  { v: "quota", label: "Quota saturada (49/50) → pre-check aborta" },
  { v: "videoerror", label: "Erro de processamento de video" },
];

export default function FailPanel({ onClose }) {
  const [mode, setMode] = useState("none");
  const [polls, setPolls] = useState(0);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchControl().then((c) => { setMode(c.fail || "none"); setPolls(c.storyPolls || 0); }).catch(() => {});
  }, []);

  async function apply(nextMode, nextPolls) {
    await setFail(nextMode, nextPolls);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  }

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
        <header className="fp-head">
          <h3>Simular erro da Graph API</h3>
          <button className="x" onClick={onClose}>×</button>
        </header>
        <div className="fp-body">
          <label className="fp-title">Modo de falha</label>
          {MODES.map((m) => (
            <label key={m.v} className={"fp-radio" + (mode === m.v ? " on" : "")}>
              <input type="radio" name="fail" checked={mode === m.v}
                onChange={() => { setMode(m.v); apply(m.v, polls); }} />
              <span>{m.label}</span>
            </label>
          ))}
          <label className="fp-polls">
            Polls ate o video ficar pronto: <b>{polls}</b>
            <input type="range" min="0" max="4" value={polls}
              onChange={(e) => { const p = Number(e.target.value); setPolls(p); apply(mode, p); }} />
          </label>
          {saved && <span className="fp-saved">aplicado ✓</span>}
          <p className="fp-hint">
            Depois rode <code>npm run mock:publish</code> (ou <code>mock:story</code>)
            e veja o efeito nos logs do pipeline. O rate limit arma o cooldown
            global em <code>media/news/_ig-cooldown.json</code>.
          </p>
        </div>
      </div>
    </div>
  );
}
