import React from "react";

// Grid 3 colunas estilo perfil do Instagram. Thumb = primeiro slide (capa).
export default function FeedGrid({ feed, onOpen }) {
  if (!feed.length) {
    return <div className="empty">Nenhum post ainda. Rode <code>npm run mock:publish</code>.</div>;
  }
  return (
    <div className="grid">
      {feed.map((p) => (
        <button key={p.postId} className="cell" onClick={() => onOpen(p)} title={p.caption}>
          <img src={p.slides[0]} alt="" loading="lazy" />
          {p.slides.length > 1 && <span className="multi">▦</span>}
        </button>
      ))}
    </div>
  );
}
