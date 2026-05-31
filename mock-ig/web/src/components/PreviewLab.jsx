import React, { useEffect, useState } from "react";
import { fetchCandidates, requestPreview } from "../api.js";

// Simulador: lista o material real (fila de publicacao) e, ao clicar, gera a
// previa de como o post ficaria no Instagram. READ-ONLY: nao publica, nao
// altera a fila. Stories mostram os MP4 que o Action ja gerou.
const TYPE_LABEL = { regular: "Noticia", spotlight: "Spotlight", digest: "Comunidade" };

export default function PreviewLab({ onPreview, onStory }) {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(null);     // id em processamento
  const [loading, setLoading] = useState(false); // recarregando candidatos

  async function reload() {
    setLoading(true);
    try { setData(await fetchCandidates()); setErr(null); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
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
        <h3>{title} {posted && <span className="lab-tag-posted">postados</span>}</h3>
        <div className="lab-row">
          {items.map((it) => (
            <button key={it.id} className="lab-card" onClick={() => open(it.id)} disabled={busy === it.id}>
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

  const groups = [
    ["Noticias na fila", data.pending.regular, false],
    ["Spotlight na fila", data.pending.spotlight, false],
    ["Comunidade na fila", data.pending.digest, false],
    ["Noticias", data.posted.regular, true],
    ["Spotlight", data.posted.spotlight, true],
    ["Comunidade", data.posted.digest, true],
  ];

  return (
    <div className="lab">
      <div className="lab-head">
        <div>
          <h2>Simulador de post</h2>
          <p>Material real do pipeline. Clique pra ver como ficaria no Instagram. Nada e publicado.</p>
        </div>
        <button className="lab-refresh" onClick={reload} disabled={loading}>
          {loading ? "atualizando…" : "↻ Atualizar"}
        </button>
      </div>

      {groups.map(([t, items, posted]) => <Section key={t} title={t} items={items} posted={posted} />)}

      {data.stories.length > 0 && (
        <div className="lab-sec">
          <h3>Stories <span className="lab-tag-posted">gerados</span></h3>
          <div className="lab-row">
            {data.stories.map((s) => (
              <button key={s.name} className="lab-card story" onClick={() => onStory(s)}>
                <span className="lab-thumb"><video src={s.videoUrl} muted preload="metadata" /><span className="lab-kind k-story">Story</span></span>
                <span className="lab-title">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
