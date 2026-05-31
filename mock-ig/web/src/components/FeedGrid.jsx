import React from "react";

// Grid estilo perfil do Instagram web: 3 colunas largas, gap pequeno.
// Thumb = primeiro slide (capa). Hover mostra overlay; marcador de carrossel.
function MultiIcon() {
  return (
    <svg className="multi" viewBox="0 0 24 24" width="20" height="20" fill="#fff">
      <path d="M7 3h11a3 3 0 0 1 3 3v11h-2V6a1 1 0 0 0-1-1H7V3Z" />
      <rect x="3" y="7" width="14" height="14" rx="2.5" />
    </svg>
  );
}

export default function FeedGrid({ feed, onOpen }) {
  if (!feed.length) {
    return (
      <div className="ig-empty">
        <div className="ig-empty-ico">▦</div>
        <p>Nenhuma publicacao ainda.</p>
        <code>npm run mock:publish</code>
      </div>
    );
  }
  return (
    <div className="ig-grid">
      {feed.map((p) => (
        <button key={p.postId} className="ig-cell" onClick={() => onOpen(p)} title={p.caption}>
          <img src={p.slides[0]} alt="" loading="lazy" />
          {p.slides.length > 1 && <MultiIcon />}
          <span className="ig-cell-hover">▦ {p.slides.length}</span>
        </button>
      ))}
    </div>
  );
}
