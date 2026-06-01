import React, { useEffect, useState } from "react";
import { fetchCurationRuns, simulateCurationRun, syncFromOrigin } from "../api.js";

// Aba Rodadas: o historico das rodadas de curadoria do Claude schedule (a
// routine sonnet que cura os pendentes e commita direto na main). A partir de
// 2026-06 cada rodada grava um log (aprovados + todos os SKIP com razao),
// inclusive as 100% SKIP. Clicar numa rodada mostra o que entrou E o que foi
// pulado e por que. Sem log ainda, cai nos commits (so o que entrou no index).
const KIND_LABEL = { regular: "Noticia", spotlight: "Spotlight", digest: "Comunidade" };

function brt(iso) {
  if (!iso) return "?";
  const s = new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString();
  return `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)} BRT`;
}

export default function CurationRunsLab() {
  const [runs, setRuns] = useState(null);
  const [err, setErr] = useState(null);
  const [sel, setSel] = useState(null);
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  async function load() {
    try { setRuns(await fetchCurationRuns()); setErr(null); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  async function refresh() {
    setSyncing(true); setSyncMsg(null); setDetail(null); setSel(null);
    try {
      const s = await syncFromOrigin();
      if (s.ok) setSyncMsg(s.changed ? `+${s.newCommits} commit(s) novo(s) · ${s.head}` : "ja estava atualizado");
      else setSyncMsg("sync falhou: " + String(s.error || "").slice(0, 70));
    } catch (e) { setSyncMsg("sync falhou: " + e.message); }
    await load();
    setSyncing(false);
  }

  async function pick(ref) {
    setSel(ref); setDetail(null); setLoading(true);
    try { setDetail(await simulateCurationRun(ref)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  if (err) return <div className="ig-err">{err}</div>;
  if (!runs) return <div className="lab-loading">carregando rodadas…</div>;

  const hasLogs = runs.some((r) => r.source === "log");
  const totalApproved = runs.reduce((s, r) => s + (r.approvedCount || 0), 0);
  const avg = runs.length ? (totalApproved / runs.length).toFixed(1) : "0";

  return (
    <div className="lab runs">
      <div className="lab-head">
        <div>
          <h2>Rodadas de curadoria</h2>
          <p>O Claude schedule cura os pendentes 4x/dia e commita direto na main. Clique numa rodada pra ver o que entrou e, quando houver log, tudo que foi pulado e por que.</p>
        </div>
        <div className="lab-refresh-wrap">
          <button className="lab-refresh" onClick={refresh} disabled={syncing}>
            {syncing ? "buscando…" : "↻ Atualizar"}
          </button>
          {syncMsg && <span className="lab-sync-msg">{syncMsg}</span>}
        </div>
      </div>

      <div className="cr-diag">
        <span><b>{runs.length}</b> rodadas</span>
        <span><b>{avg}</b> aprovado por rodada (media)</span>
        <span className="cr-diag-note">
          {hasLogs
            ? "com log completo: cada rodada registra os aprovados e TODOS os SKIP com razao"
            : "ainda sem log de rodada (mostrando os commits). Quando a routine atualizada rodar, aparece aqui o detalhe dos SKIP"}
        </span>
      </div>

      <div className="runs-list">
        {runs.map((r) => (
          <button key={r.ref} className={"run-row st-success" + (sel === r.ref ? " on" : "")} onClick={() => pick(r.ref)}>
            <span className="run-dot st-success" />
            <span className="run-when">{brt(r.date)}{r.marco ? ` · ${r.marco}` : ""}</span>
            <span className={"cr-badge" + (r.approvedCount === 0 ? " zero" : "")}>+{r.approvedCount} aprov.</span>
            {r.skippedCount != null && <span className="cr-badge skip">{r.skippedCount} skip</span>}
            {r.pendingTotal != null && <span className="cr-pend mono">{r.pendingTotal} pend.</span>}
            <span className="run-go">ver →</span>
          </button>
        ))}
      </div>

      {loading && <div className="lab-loading">lendo a rodada…</div>}

      {detail && !loading && (
        <div className="run-detail">
          {detail.source === "commit" && detail.subject && <p className="cr-subject mono">{detail.subject}</p>}
          {detail.source === "log" && (
            <p className="cr-subject mono">
              {detail.marco || "rodada"} · {detail.pendingTotal != null ? `${detail.pendingTotal} pendentes` : ""} · {detail.approved.length} aprovado(s), {detail.skipped.length} skip
            </p>
          )}

          {/* aprovados */}
          <h4 className="cr-sec-h">Aprovados <span className="cur-count sm">{detail.approved.length}</span></h4>
          {detail.approved.length === 0
            ? <p className="lab-empty">nenhum item entrou nesta rodada.</p>
            : (
              <div className="cur-picked">
                {detail.approved.map((it) => (
                  <article key={it.id} className="cur-pick">
                    {it.img ? <img className="cur-thumb" src={it.img} alt="" loading="lazy" /> : <span className="cur-thumb ph" />}
                    <div className="cur-pick-body">
                      <div className="cur-pick-top">
                        <span className={"cur-kind k-" + it.kind}>{KIND_LABEL[it.kind] || it.kind}</span>
                        {it.source && <span className="cr-src">{it.source}</span>}
                      </div>
                      <strong className="cur-pick-title">{it.title}</strong>
                      {it.intro && <p className="cur-pick-intro">{it.intro}</p>}
                      {it.tags && it.tags.length > 0 && (
                        <div className="cur-tags">{it.tags.map((t) => <span key={t} className="cur-chip">{t}</span>)}</div>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}

          {/* skip (so quando ha log) */}
          {detail.source === "log" && (
            <>
              <h4 className="cr-sec-h skip">Pulados (SKIP) <span className="cur-count sm">{detail.skipped.length}</span></h4>
              {detail.skipped.length === 0
                ? <p className="lab-empty">nada foi pulado nesta rodada.</p>
                : (
                  <ul className="cr-skip-list">
                    {detail.skipped.map((s, i) => (
                      <li key={s.id + i}>
                        <code>{s.id}</code>
                        <span className="cr-skip-title">{s.title}</span>
                        <em className="cr-skip-reason">{s.reason}</em>
                      </li>
                    ))}
                  </ul>
                )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
