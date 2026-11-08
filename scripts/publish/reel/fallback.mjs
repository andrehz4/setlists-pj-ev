// Fallback do reel semanal. Em 2026-11-08 o IG deixou o container em IN_PROGRESS por 5 min e o reel não saiu.
// Camadas: (1) espera longa; (2) 2º container do MESMO vídeo; (3) se tudo falhar, a run guarda os containers no
// _reel-log.json e a próxima rodada do domingo RETOMA sem renderizar (retomar.mjs); (4) alerta no Telegram.
import { credenciais } from "../ig/http.mjs";
import { createReelContainer, waitContainerReady } from "../ig/containers.mjs";
import { publicarComRecuperacao } from "../ig/recuperar.mjs";

const min = (n) => n * 60000;
// Espera de cada tentativa. Job tem 45 min: render+upload ~9 + 10 + 8 = ~27.
// REEL_ESPERAS_MS="150,150" e REEL_POLL_MS=20 encurtam tudo pra testar contra o mock (mock-ig/run.mjs reel).
const doEnv = (process.env.REEL_ESPERAS_MS || "").split(",").map(Number).filter((n) => n > 0);
export const ESPERAS_MS = doEnv.length ? doEnv : [min(10), min(8)];
const POLL_ENV = Number(process.env.REEL_POLL_MS) || undefined;

export class ReelFalhou extends Error {
  constructor(message, containerIds, { publicando = false } = {}) {
    super(message);
    this.containerIds = containerIds;
    // true = o erro veio do media_publish (container já pronto). Pode ter publicado mesmo assim: não retomar sozinho.
    this.publicando = publicando;
  }
}

// Cria o container, espera ficar pronto e publica. Container que não fica pronto → próximo container (mesmo vídeo).
// Erro no publish NÃO vira outro container: outro container + falso-erro 2207051 = reel duplicado.
export async function publishReelComFallback({
  videoUrl, caption, shareToFeed = true, thumbOffsetMs, igUserId, accessToken,
  esperasMs = ESPERAS_MS, intervalMs = POLL_ENV, deps = {},
} = {}) {
  if (!videoUrl) throw new Error("publishReelComFallback: videoUrl obrigatorio");
  const d = { createReelContainer, waitContainerReady, publicarComRecuperacao, ...deps };
  const c = credenciais({ igUserId, accessToken }, "publishReelComFallback");
  const sinceMs = Date.now();
  const containerIds = [], causas = [];
  for (const [i, timeoutMs] of esperasMs.entries()) {
    const n = `${i + 1}/${esperasMs.length}`;
    let containerId;
    try {
      containerId = await d.createReelContainer({ ...c, videoUrl, caption, shareToFeed, thumbOffsetMs });
      containerIds.push(containerId);
      await d.waitContainerReady({ accessToken: c.accessToken, containerId, timeoutMs, ...(intervalMs && { intervalMs }) });
    } catch (e) {
      causas.push(`tentativa ${n}: ${e.message}`);
      console.warn(`[reel] tentativa ${n} falhou: ${e.message}`);
      continue;
    }
    try {
      const r = await d.publicarComRecuperacao({ ...c, creationId: containerId, caption, sinceMs, rotulo: "reel" });
      return { ...r, containerId, tentativa: i + 1 };
    } catch (e) {
      throw new ReelFalhou(`publicar container ${containerId}: ${e.message}`, containerIds, { publicando: true });
    }
  }
  throw new ReelFalhou(causas.join(" | "), containerIds);
}
