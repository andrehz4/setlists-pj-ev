import React, { useState } from "react";

// Abre o post: carrossel navegavel (setas + dots) + caption + contador.
export default function PostModal({ post, onClose }) {
  const [i, setI] = useState(0);
  const n = post.slides.length;
  const prev = () => setI((x) => Math.max(0, x - 1));
  const next = () => setI((x) => Math.min(n - 1, x + 1));

  return (
    <div className="modal-bg" onClick={onClose}>
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
        <div className="caption">
          <span className="type">{post.type === "CAROUSEL" ? "carrossel" : "post"}</span>
          <pre>{post.caption}</pre>
        </div>
        <button className="close" onClick={onClose}>fechar</button>
      </div>
    </div>
  );
}
