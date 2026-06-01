import React, { useEffect, useState } from "react";
import { fetchRuns, simulateRun, syncFromOrigin } from "../api.js";

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
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  async function load() {
    try { setRuns(await fetchRuns()); setErr(null); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);

  // Atualizar = puxa commits novos do Actions (sync) e entao recarrega a lista.
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
        <div className="lab-refresh-wrap">
          <button className="lab-refresh" onClick={refresh} disabled={syncing}>
            {syncing ? "buscando…" : "↻ Atualizar"}
          </button>
          {syncMsg && <span className="lab-sync-msg">{syncMsg}</span>}
        </div>
      </div>

      <div className="runs-list">
        {runs.map((r) => (
          r.id === "next" ? (
            <button key="next" className={"run-row is-next" + (sel === "next" ? " on" : "")} onClick={() => pick("next")}>
              <span className="run-dot st-next" />
              <span className="run-when">Proxima run</span>
              <span className="run-id mono">fila atual</span>
              <span className="run-status">vai rodar</span>
              <span className="run-go">simular →</span>
            </button>
          ) : (
            <button key={r.id} className={"run-row st-" + r.status + (sel === r.id ? " on" : "")} onClick={() => pick(r.id)}>
              <span className={"run-dot st-" + r.status} />
              <span className="run-when">{brt(r.createdAt)}</span>
              <span className="run-id mono">#{r.id.slice(-5)}</span>
              <span className="run-status">{STATUS_LABEL[r.status] || r.status}</span>
              <span className="run-go">simular →</span>
            </button>
          )
        ))}
      </div>

      {loading && <div className="lab-loading">reconstruindo o post da run…</div>}

      {detail && !loading && (
        <div className="run-detail">
          {/* resumo da run: total de posts e custo Graph */}
          <div className="run-summary">
            <div className="run-stat">
              <b>{detail.totalPosts}</b>
              <span>{detail.totalPosts === 1 ? "post (carrossel)" : "posts (carrosseis)"} iriam pro feed</span>
            </div>
            <div className="run-stat">
              <b>{detail.totalCalls}</b>
              <span>chamadas Graph no total · limite 200/h</span>
            </div>
          </div>

          {detail.cooldownAbort && <p className="run-note">esta run abortou no cooldown (nao chegou a montar carrossel).</p>}

          {detail.batches.map((b, i) => (
            <div key={i} className="run-batch">
              <div className="run-batch-head">
                <h3>{b.type === "regular" ? "Carrossel · Noticias" : "Carrossel · Comunidade"}</h3>
                <span className={"run-outcome o-" + b.outcome}>{b.outcome}</span>
                {b.carousel && b.carousel.slideCount > 0 && (
                  <span className="run-carousel-meta">
                    {b.carousel.slideCount} slides{b.carousel.hasCover ? " (1 capa)" : ""} · {b.carousel.apiCalls} chamadas
                  </span>
                )}
                {!b.exact && b.ids.length === 0 && <span className="run-warn">ids nao logados nesta run</span>}
                {!b.exact && b.ids.length > 0 && <span className="run-warn">ids aproximados</span>}
              </div>

              {b.posts && b.posts.filter((p) => !p.error).length > 0 ? (
                <>
                  {/* o CARROSSEL montado: tira de slides como iria pro IG */}
                  <div className="carousel-strip">
                    {b.carousel?.hasCover && (
                      <div className="strip-slide cover" title="capa do carrossel (Card 11)">
                        <span className="strip-cover-label">CAPA</span>
                      </div>
                    )}
                    {b.posts.filter((p) => !p.error).map((p, k) => (
                      <button key={p.id} className="strip-slide" onClick={() => onPreview(p)} title={p.title}>
                        <img src={p.slideUrl} alt="" loading="lazy" />
                        <span className="strip-num">{(b.carousel?.hasCover ? k + 2 : k + 1)}</span>
                      </button>
                    ))}
                  </div>
                  <p className="strip-hint">clique num slide pra ver o post completo (imagem + legenda)</p>
                </>
              ) : <p className="lab-empty">sem itens reconstruiveis neste batch.</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
