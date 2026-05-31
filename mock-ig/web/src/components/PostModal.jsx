import React, { useState } from "react";

// Post aberto estilo IG desktop: imagem/carrossel a esquerda, painel com
// autor + caption a direita.
export default function PostModal({ post, onClose }) {
  const [i, setI] = useState(0);
  const n = post.slides.length;
  const prev = () => setI((x) => Math.max(0, x - 1));
  const next = () => setI((x) => Math.min(n - 1, x + 1));

  return (
    <div className="modal-bg" onClick={onClose}>
      <button className="close" onClick={onClose}>×</button>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="carousel">
          <img src={post.slides[i]} alt="" />
          {n > 1 && (
            <>
              {i > 0 && <button className="nav left" onClick={prev}>‹</button>}
              {i < n - 1 && <button className="nav right" onClick={next}>›</button>}
              <div className="counter">{i + 1}/{n}</div>
              <div className="dots">
                {post.slides.map((_, k) => <span key={k} className={k === i ? "on" : ""} />)}
              </div>
            </>
          )}
        </div>
        <div className="side">
          <div className="side-head">
            <span className="av" />
            smufdpj
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--ig-pj)", fontWeight: 700 }}>
              {post.type === "CAROUSEL" ? "CARROSSEL" : "POST"}
            </span>
          </div>
          <div className="side-body">
            <pre>{post.caption}</pre>
          </div>
        </div>
      </div>
    </div>
  );
}
