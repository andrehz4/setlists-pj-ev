import React, { useEffect, useState } from "react";
import { fetchRuns, simulateRun } from "../api.js";

// Aba Runs: lista as ultimas runs do Action e, ao clicar, reconstroi como
// aquele post DEVERIA ter ido pro Instagram (slide + caption reais de cada id
// que a run tentou postar). Da pra conferir se o conteudo daquela run estava
// certo, mesmo que ela tenha falhado no rate limit.
function brt(iso) {
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(5, 16).replace("T", " ") + " BRT";
}
const STATUS_LABEL = { success: "ok", failure: "falhou", in_progress: "rodando" };

export default function RunsLab({ onPreview }) {
  const [runs, setRuns] = useState(null);
  const [err, setErr] = useState(null);
  const [sel, setSel] = useState(null);     // run id selecionada
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    try { setRuns(await fetchRuns()); setErr(null); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function pick(id) {
    setSel(id); setDetail(null); setLoading(true);
    try { setDetail(await simulateRun(id)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  if (err) return <div className="ig-err">{err} {err.includes("gh") && "(precisa do gh CLI logado)"}</div>;
  if (!runs) return <div className="lab-loading">carregando runs…</div>;

  return (
    <div className="lab runs">
      <div className="lab-head">
        <div>
          <h2>Runs do Action</h2>
          <p>Clique numa run pra ver como o post dela DEVERIA ter ido pro Instagram. Fiel ao historico, mesmo runs que falharam no rate limit.</p>
        </div>
        <button className="lab-refresh" onClick={() => { setDetail(null); setSel(null); load(); }}>↻ Atualizar</button>
      </div>

      <div className="runs-list">
        {runs.map((r) => (
          <button key={r.id} className={"run-row st-" + r.status + (sel === r.id ? " on" : "")} onClick={() => pick(r.id)}>
            <span className={"run-dot st-" + r.status} />
            <span className="run-when">{brt(r.createdAt)}</span>
            <span className="run-id mono">#{r.id.slice(-5)}</span>
            <span className="run-status">{STATUS_LABEL[r.status] || r.status}</span>
            <span className="run-go">simular →</span>
          </button>
        ))}
      </div>

      {loading && <div className="lab-loading">reconstruindo o post da run…</div>}

      {detail && !loading && (
        <div className="run-detail">
          {detail.cooldownAbort && <p className="run-note">esta run abortou no cooldown (nao chegou a montar carrossel).</p>}
          {detail.batches.map((b, i) => (
            <div key={i} className="run-batch">
              <div className="run-batch-head">
                <h3>{b.type === "regular" ? "Noticias" : "Comunidade / Spotlight"}</h3>
                <span className={"run-outcome o-" + b.outcome}>{b.outcome}</span>
                {!b.exact && b.ids.length === 0 && <span className="run-warn">ids nao logados nesta run</span>}
                {!b.exact && b.ids.length > 0 && <span className="run-warn">ids aproximados</span>}
              </div>
              {b.posts && b.posts.length > 0 ? (
                <div className="lab-row">
                  {b.posts.map((p) => (
                    p.error
                      ? <div key={p.id} className="lab-card err-card"><span className="lab-title">{p.id}: {p.error}</span></div>
                      : <button key={p.id} className="lab-card" onClick={() => onPreview(p)}>
                          <span className="lab-thumb"><img src={p.slideUrl} alt="" loading="lazy" /><span className={"lab-kind k-" + p.kind}>{p.kind}</span></span>
                          <span className="lab-title">{p.title}</span>
                        </button>
                  ))}
                </div>
              ) : <p className="lab-empty">sem itens reconstruiveis neste batch.</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
