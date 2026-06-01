import React, { useEffect, useState } from "react";
import { fetchCuration, syncFromOrigin } from "../api.js";

// Aba Curadoria: o ponto da esteira onde se decide o que vai pro feed.
// Dois lados: AGUARDANDO (candidatos crus em _pending.json que a Claude do
// schedule vai avaliar) e ULTIMA RODADA (o que ela ja pegou e enfileirou +
// o que foi rejeitado por validacao). READ-ONLY, nao dispara curadoria.
const KIND_LABEL = { regular: "Noticia", spotlight: "Spotlight", digest: "Comunidade" };

// Horarios dos disparos (TriggerAll), em HORA UTC pra independer do fuso da
// maquina. Ver PIPELINE.md secao 7.
//  - News fetch (enche "Aguardando curadoria"): 8x/dia.
//  - Curadoria (Claude schedule, gera "Ultima rodada"): 4x/dia = 00/06/12/18 BRT.
const NEWS_UTC_HOURS = [2, 4, 8, 11, 14, 16, 20, 22];     // 23/01/05/08/11/13/17/19 BRT
const CURATION_UTC_HOURS = [3, 9, 15, 21];                 // 00/06/12/18 BRT

function brt(iso) {
  if (!iso) return "?";
  const s = new Date(new Date(iso).getTime() - 3 * 3600 * 1000).toISOString();
  return `${s.slice(8, 10)}/${s.slice(5, 7)} ${s.slice(11, 16)} BRT`;
}

// Proximo horario (Date) em que a hora UTC cai na lista, minuto 0.
function nextRunUTC(hours, fromMs = Date.now()) {
  const now = new Date(fromMs);
  for (let i = 0; i <= 48; i++) {
    const d = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
      now.getUTCHours() + i, 0, 0, 0,
    ));
    if (d.getTime() > fromMs && hours.includes(d.getUTCHours())) return d;
  }
  return null;
}

// Formata o tempo que falta de forma curta (2h 14min / 14min 03s / 42s).
function fmtDelta(ms) {
  if (ms < 0) ms = 0;
  const totalM = Math.floor(ms / 60000);
  const h = Math.floor(totalM / 60);
  const m = totalM % 60;
  const s = Math.floor((ms % 60000) / 1000);
  if (h > 0) return `${h}h ${String(m).padStart(2, "0")}min`;
  if (m > 0) return `${m}min ${String(s).padStart(2, "0")}s`;
  return `${s}s`;
}

export default function CurationLab() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [now, setNow] = useState(Date.now());

  async function load() {
    try { setData(await fetchCuration()); setErr(null); }
    catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, []);
  // Tick de 1s pros countdowns dos proximos disparos.
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Atualizar = puxa commits novos do Actions (sync) e recarrega a curadoria.
  async function refresh() {
    setLoading(true); setSyncMsg(null);
    try {
      const s = await syncFromOrigin();
      if (s.ok) setSyncMsg(s.changed ? `+${s.newCommits} commit(s) novo(s) · ${s.head}` : "ja estava atualizado");
      else setSyncMsg("sync falhou: " + String(s.error || "").slice(0, 70));
    } catch (e) { setSyncMsg("sync falhou: " + e.message); }
    await load();
    setLoading(false);
  }

  if (err) return <div className="ig-err">{err}</div>;
  if (!data) return <div className="lab-loading">carregando curadoria…</div>;

  const { pending, picked, rejected, lastRoundAt, counts } = data;

  const nextNews = nextRunUTC(NEWS_UTC_HOURS, now);
  const nextCuration = nextRunUTC(CURATION_UTC_HOURS, now);

  return (
    <div className="lab curation">
      <div className="lab-head">
        <div>
          <h2>Curadoria</h2>
          <p>O ponto onde se decide o feed. A Claude do schedule le os candidatos crus, escolhe o que presta e enfileira. Aqui voce ve os dois lados. Nada e publicado.</p>
        </div>
        <div className="lab-refresh-wrap">
          <button className="lab-refresh" onClick={refresh} disabled={loading}>
            {loading ? "buscando…" : "↻ Atualizar"}
          </button>
          {syncMsg && <span className="lab-sync-msg">{syncMsg}</span>}
        </div>
      </div>

      {/* Countdowns dos proximos disparos, pra saber quando a news coleta e
          quando o schedule cura. Horarios em PIPELINE.md secao 7. */}
      <div className="cur-timers">
        <div className="cur-timer t-news">
          <span className="cur-timer-label">Próxima coleta (News fetch)</span>
          <strong className="cur-timer-eta">{nextNews ? fmtDelta(nextNews.getTime() - now) : "?"}</strong>
          <span className="cur-timer-when">{nextNews ? brt(nextNews.toISOString()) : ""}</span>
          <span className="cur-timer-sub">enche "Aguardando curadoria" · 8x/dia</span>
        </div>
        <div className="cur-timer t-cur">
          <span className="cur-timer-label">Próxima curadoria (Claude schedule)</span>
          <strong className="cur-timer-eta">{nextCuration ? fmtDelta(nextCuration.getTime() - now) : "?"}</strong>
          <span className="cur-timer-when">{nextCuration ? brt(nextCuration.toISOString()) : ""}</span>
          <span className="cur-timer-sub">gera "Última rodada" · 00/06/12/18 BRT</span>
        </div>
      </div>

      <div className="cur-grid">
        {/* ----- AGUARDANDO (input bruto) ----- */}
        <section className="cur-col cur-wait">
          <header className="cur-col-head">
            <h3>Aguardando curadoria</h3>
            <span className="cur-count">{counts.pending}</span>
          </header>
          <p className="cur-col-sub">Candidatos crus coletados pelo News fetch. A Claude ainda nao escolheu. O que ela descartar por gosto continua aqui.</p>
          <ul className="cur-list">
            {pending.length === 0 && <li className="cur-empty">fila de candidatos vazia.</li>}
            {pending.slice(0, 40).map((p) => (
              <li key={p.id} className="cur-cand">
                <div className="cur-cand-top">
                  <span className="cur-src">{p.source}</span>
                  <span className="cur-date">{brt(p.pubDate)}</span>
                </div>
                <a className="cur-title" href={p.url || "#"} target="_blank" rel="noreferrer" title={p.title}>{p.title}</a>
                {p.group && <span className={"cur-tag g-" + p.group}>{p.group}</span>}
              </li>
            ))}
            {pending.length > 40 && <li className="cur-more">+{pending.length - 40} candidatos a mais</li>}
          </ul>
        </section>

        {/* ----- ULTIMA RODADA (output decidido) ----- */}
        <section className="cur-col cur-done">
          <header className="cur-col-head">
            <h3>Ultima rodada</h3>
            <span className="cur-when">{lastRoundAt ? brt(lastRoundAt) : "sem dados"}</span>
          </header>
          <p className="cur-col-sub">O que a curadoria PEGOU e enfileirou pro feed na leva mais recente.</p>

          <div className="cur-picked">
            {picked.length === 0 && <div className="cur-empty">nenhum item enfileirado nesta leva.</div>}
            {picked.map((it) => (
              <article key={it.id} className="cur-pick">
                {it.img
                  ? <img className="cur-thumb" src={it.img} alt="" loading="lazy" />
                  : <span className="cur-thumb ph" />}
                <div className="cur-pick-body">
                  <div className="cur-pick-top">
                    <span className={"cur-kind k-" + it.kind}>{KIND_LABEL[it.kind] || it.kind}</span>
                    <span className={"cur-state " + (it.posted ? "on" : "")}>{it.posted ? "postado" : "na fila"}</span>
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

          {/* rejeitados por validacao (raro) */}
          <div className="cur-rej">
            <h4>Rejeitados por validacao <span className="cur-count sm">{counts.rejected}</span></h4>
            {rejected.length === 0
              ? <p className="cur-rej-empty">Nenhum. So aparece aqui quando a Claude cura um item mas ele falha na validacao (titulo faltando ou corpo curto). A rejeicao editorial nao e registrada: o item so fica em Aguardando.</p>
              : (
                <ul className="cur-rej-list">
                  {rejected.map((r, i) => (
                    <li key={r.id + i}><code>{r.id}</code> <span>{r.reason}</span> <em>{brt(r.at)}</em></li>
                  ))}
                </ul>
              )}
          </div>
        </section>
      </div>
    </div>
  );
}
