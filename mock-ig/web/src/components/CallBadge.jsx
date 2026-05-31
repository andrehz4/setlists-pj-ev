import React from "react";

// Selo do custo de chamadas Graph de uma postagem (feed, story ou reel).
// apiCalls = { total, byKind, carouselMax, over }. Mostra "N chamadas".
export default function CallBadge({ apiCalls, className = "" }) {
  if (!apiCalls) return null;
  return (
    <span className={"call-badge" + (apiCalls.over ? " over" : "") + (className ? " " + className : "")}
      title={`${apiCalls.total} chamadas Graph API pra publicar este post`}>
      {apiCalls.total} chamadas
    </span>
  );
}
