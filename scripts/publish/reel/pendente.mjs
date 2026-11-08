// Reel que falhou ESPERANDO o IG (fallback.mjs): o que guardar no _reel-log.json e como achar de novo.
// Puro: sem rede nem arquivo.
export const VALIDADE_MS = 20 * 3600e3; // container do IG expira em 24 h; folga de 4 h

// Fora do domingo em BRT? Recebe a data já deslocada (emBRT). Os horários de reserva só valem no próprio
// domingo: uma rodada atrasada que caísse na segunda publicaria o resumo da SEMANA SEGUINTE.
export const foraDaJanela = (brt) => brt.getUTCDay() !== 0;

export function entradaFalha({ now, weekKey, items, track, accent, rangeLabel, videoUrl, caption, thumbOffsetMs, erro }) {
  return {
    weekKey, runAt: now.toISOString(), items: items.map((it) => it.id),
    resumo: items.map((it) => ({ id: it.id, title_pt: it.title_pt || "" })),
    track: track.name, accent, rangeLabel, videoUrl, caption, thumbOffsetMs,
    containerIds: erro.containerIds || [], error: erro.message,
    // erro no media_publish: pode ter saído mesmo assim, então ninguém retoma sozinho
    semRetomar: Boolean(erro.publicando),
  };
}

// Entrada mais recente da semana que dá pra retomar: sem postId, com containers e vídeo guardados, dentro da validade.
export function acharPendente(log, weekKey, agoraMs) {
  return [...log.entries].reverse().find((e) => e.weekKey === weekKey && !e.postId && !e.semRetomar
    && e.containerIds?.length && e.videoUrl && e.caption && agoraMs - Date.parse(e.runAt) < VALIDADE_MS) || null;
}
