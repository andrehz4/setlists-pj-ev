import React, { useEffect, useState } from "react";
import { fetchCurationRuns, simulateCurationRun, syncFromOrigin } from "../api.js";

// Aba Rodadas: o historico das rodadas de curadoria do Claude schedule (a
// routine sonnet que cura os pendentes e COMMITA direto na main, fora do
// GitHub Actions). Cada commit "curadoria automatica via routine sonnet" e uma
// rodada. Clicar mostra o que ELA salvou (os itens que entraram no index).
const KIND_LABEL = { regular: "Noticia", spotlight: "Spotlight", digest: "Comunidade" };

function brt(iso) {
  if (!iso) return "?";
  const d = new Date(new Date(iso).getTime() - 3 * 3600 * 1000);
  return d.toISOString().slice(5, 16).replace("T", " ") + " BRT";
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

  async function pick(hash) {
    setSel(hash); setDetail(null); setLoading(true);
    try { setDetail(await simulateCurationRun(hash)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  if (err) return <div className="ig-err">{err}</div>;
  if (!runs) return <div className="lab-loading">carregando rodadas…</div>;

  const totalNew = runs.reduce((s, r) => s + (r.newCount || 0), 0);
  const avg = runs.length ? (totalNew / runs.length).toFixed(1) : "0";

  return (
    <div className="lab runs">
      <div className="lab-head">
        <div>
          <h2>Rodadas de curadoria</h2>
          <p>O Claude schedule (routine sonnet) cura os pendentes e commita direto na main, fora do Actions. Cada commit e uma rodada. Clique pra ver o que ela salvou.</p>
        </div>
        <div className="lab-refresh-wrap">
          <button className="lab-refresh" onClick={refresh} disabled={syncing}>
            {syncing ? "buscando…" : "↻ Atualizar"}
          </button>
          {syncMsg && <span className="lab-sync-msg">{syncMsg}</span>}
        </div>
      </div>

      {/* diagnostico: ritmo real de itens novos por rodada */}
      <div className="cr-diag">
        <span><b>{runs.length}</b> rodadas</span>
        <span><b>{avg}</b> item novo por rodada (media)</span>
        <span className="cr-diag-note">a mensagem diz "30 itens" mas isso e o tamanho do index; o que de fato ENTRA por rodada e o numero abaixo</span>
      </div>

      <div className="runs-list">
        {runs.map((r) => (
          <button key={r.hash} className={"run-row st-success" + (sel === r.hash ? " on" : "")} onClick={() => pick(r.hash)}>
            <span className="run-dot st-success" />
            <span className="run-when">{brt(r.date)}</span>
            <span className="run-id mono">{r.shortHash}</span>
            <span className={"cr-badge" + (r.newCount === 0 ? " zero" : "")}>+{r.newCount} novo{r.newCount === 1 ? "" : "s"}</span>
            <span className="run-go">ver →</span>
          </button>
        ))}
      </div>

      {loading && <div className="lab-loading">lendo o que a rodada salvou…</div>}

      {detail && !loading && (
        <div className="run-detail">
          <p className="cr-subject mono">{detail.subject}</p>
          {detail.items.length === 0
            ? <p className="lab-empty">essa rodada nao adicionou item novo ao index (so reordenou/podou o TOP-30).</p>
            : (
              <div className="cur-picked">
                {detail.items.map((it) => (
                  <article key={it.id} className="cur-pick">
                    {it.img
                      ? <img className="cur-thumb" src={it.img} alt="" loading="lazy" />
                      : <span className="cur-thumb ph" />}
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
        </div>
      )}
    </div>
  );
}
