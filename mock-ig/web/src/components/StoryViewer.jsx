import React, { useEffect, useRef, useState } from "react";

// Viewer fullscreen de story: video vertical + barra de progresso + tap
// pra avancar/voltar. Auto-avanca ao terminar o video.
export default function StoryViewer({ stories, startIndex, onClose }) {
  const [i, setI] = useState(startIndex);
  const [pct, setPct] = useState(0);
  const videoRef = useRef(null);
  const s = stories[i];

  const go = (delta) => {
    const ni = i + delta;
    if (ni < 0 || ni >= stories.length) { onClose(); return; }
    setI(ni);
    setPct(0);
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    const onTime = () => setPct(v.duration ? (v.currentTime / v.duration) * 100 : 0);
    const onEnd = () => go(1);
    v.addEventListener("timeupdate", onTime);
    v.addEventListener("ended", onEnd);
    return () => { v.removeEventListener("timeupdate", onTime); v.removeEventListener("ended", onEnd); };
  }, [i]);

  return (
    <div className="story-bg">
      <div className="story-progress">
        {stories.map((_, k) => (
          <span key={k}><i style={{ width: k < i ? "100%" : k === i ? pct + "%" : "0%" }} /></span>
        ))}
      </div>
      <button className="story-close" onClick={onClose}>×</button>
      <video ref={videoRef} src={s.videoUrl} playsInline autoPlay />
      <button className="tap left" onClick={() => go(-1)} />
      <button className="tap right" onClick={() => go(1)} />
    </div>
  );
}
