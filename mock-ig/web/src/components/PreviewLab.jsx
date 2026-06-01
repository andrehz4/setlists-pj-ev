import React, { useEffect, useState } from "react";
import { fetchCandidates, requestPreview, syncFromOrigin } from "../api.js";

// Simulador: lista o material real (fila de publicacao) e, ao clicar, gera a
// previa de como o post ficaria no Instagram. READ-ONLY: nao publica, nao
// altera a fila. Stories mostram os MP4 que o Action ja gerou.
const TYPE_LABEL = { regular: "Noticia", spotlight: "Spotlight", digest: "Comunidade" };

export default function PreviewLab({ onPreview, onStory }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);     // id em processamento
  const [loading, setLoading] = useState(false); // recarregando candidatos
  const [syncMsg, setSyncMsg] = useState(null);

  async function reload() {
    setLoading(true);
    try { setData(await fetchCandidates()); setErr(null); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  // Atualizar = puxa commits novos do Actions (sync) e entao recarrega a fila.
  async function refresh() {
    setLoading(true); setSyncMsg(null);
    try {
      const s = await syncFromOrigin();
      if (s.ok) setSyncMsg(s.changed ? `+${s.newCommits} commit(s) novo(s) · ${s.head}` : "ja estava atualizado");
      else setSyncMsg("sync falhou: " + String(s.error || "").slice(0, 70));
    } catch (e) { setSyncMsg("sync falhou: " + e.message); }
    await reload();
  }

  useEffect(() => { reload(); }, []);

  async function open(id) {
    setBusy(id);
    try { onPreview(await requestPreview(id)); }
    catch (e) { setErr(e.message); }
    finally { setBusy(null); }
  }

  if (err) return <div className="ig-err">{err}</div>;
  if (!data) return <div className="lab-loading">carregando material…</div>;

  const Section = ({ title, items, posted }) => {
    if (!items.length) return null;
    return (
      <div className="lab-sec">
        <h3>{title}</h3>
        <div className="lab-row">
          {items.map((it) => (
            <button key={it.id} className={"lab-card" + (posted ? " is-posted" : "")} onClick={() => open(it.id)} disabled={busy === it.id}>
              <span className="lab-thumb">
                {it.img ? <img src={it.img} alt="" loading="lazy" /> : <span className="lab-noimg">sem foto</span>}
                <span className={"lab-kind k-" + it.kind}>{TYPE_LABEL[it.kind] || it.kind}</span>
              </span>
              <span className="lab-title">{it.title}</span>
              {busy === it.id && <span className="lab-spin">gerando…</span>}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const pendingGroups = [
    ["Noticias", data.pending.regular],
    ["Spotlight", data.pending.spotlight],
    ["Comunidade", data.pending.digest],
  ];
  const postedGroups = [
    ["Noticias", data.posted.regular],
    ["Spotlight", data.posted.spotlight],
    ["Comunidade", data.posted.digest],
  ];
  const pendingCount = pendingGroups.reduce((n, [, items]) => n + items.length, 0);
  const postedCount = postedGroups.reduce((n, [, items]) => n + items.length, 0);

  return (
    <div className="lab">
      <div className="lab-head">
        <div>
          <h2>Simulador de post</h2>
          <p>Material real do pipeline. Clique pra ver como ficaria no Instagram. Nada e publicado.</p>
        </div>
        <div className="lab-refresh-wrap">
          <button className="lab-refresh" onClick={refresh} disabled={loading}>
            {loading ? "buscando…" : "↻ Atualizar"}
          </button>
          {syncMsg && <span className="lab-sync-msg">{syncMsg}</span>}
        </div>
      </div>

      {/* separador: o que VAI ser postado */}
      <div className="lab-divider fila">
        <span className="lab-divider-dot" />
        <h2>Na fila <em>vai postar</em></h2>
        <span className="lab-divider-count">{pendingCount}</span>
      </div>
      {pendingCount === 0
        ? <p className="lab-empty">Nada na fila no momento.</p>
        : pendingGroups.map(([t, items]) => <Section key={"p-" + t} title={t} items={items} />)}

      {/* separador: o que JA foi postado */}
      <div className="lab-divider postados">
        <span className="lab-divider-dot" />
        <h2>Postados <em>ja foi pro feed</em></h2>
        <span className="lab-divider-count">{postedCount}</span>
      </div>
      {postedCount === 0
        ? <p className="lab-empty">Nenhum postado recente.</p>
        : postedGroups.map(([t, items]) => <Section key={"o-" + t} title={t} items={items} posted />)}

      {/* separador: stories */}
      {data.stories.length > 0 && (
        <>
          <div className="lab-divider story">
            <span className="lab-divider-dot" />
            <h2>Stories <em>gerados</em></h2>
            <span className="lab-divider-count">{data.stories.length}</span>
          </div>
          <div className="lab-sec">
            <div className="lab-row">
              {data.stories.map((s) => (
                <button key={s.name} className="lab-card story" onClick={() => onStory(s)}>
                  <span className="lab-thumb"><video src={s.videoUrl} muted preload="metadata" /><span className="lab-kind k-story">Story</span></span>
                  <span className="lab-title">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
