import React from "react";

// Barra de circulos no topo (estilo stories do IG).
export default function StoriesBar({ stories, onOpen }) {
  if (!stories.length) return null;
  return (
    <div className="stories-bar">
      {stories.map((s, i) => (
        <button key={s.postId} className="story-circle" onClick={() => onOpen(i)}>
          <span className="ring">
            <video src={s.videoUrl} muted preload="metadata" />
          </span>
          <small>story {i + 1}</small>
        </button>
      ))}
    </div>
  );
}
