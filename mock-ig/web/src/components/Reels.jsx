import React, { useEffect, useRef } from "react";

// Feed vertical de reels: cada video ocupa a tela, autoplay quando visivel
// (IntersectionObserver), loop, mudo por padrao. Le de /_mock/reels.
export default function Reels({ reels }) {
  if (!reels || !reels.length) {
    return (
      <div className="reels-ph">
        <h2>Reels</h2>
        <p>Nenhum reel ainda. Quando o pipeline publicar com media_type=REELS, eles aparecem aqui num feed vertical.</p>
      </div>
    );
  }
  return (
    <div className="reels-feed">
      {reels.map((r) => <ReelItem key={r.postId} reel={r} />)}
    </div>
  );
}

function ReelItem({ reel }) {
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {});
      else v.pause();
    }, { threshold: 0.6 });
    io.observe(v);
    return () => io.disconnect();
  }, []);
  return (
    <div className="reel">
      <video ref={ref} src={reel.videoUrl} loop muted playsInline />
      {reel.apiCalls && (
        <span className={"call-badge reel-cost" + (reel.apiCalls.over ? " over" : "")}>
          {reel.apiCalls.total} chamadas
        </span>
      )}
      {reel.caption && <div className="reel-cap">{reel.caption}</div>}
    </div>
  );
}
