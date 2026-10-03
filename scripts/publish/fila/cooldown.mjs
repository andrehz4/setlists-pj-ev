// Cooldown global depois de rate limit da app (_ig-cooldown.json).
import fs from "node:fs/promises";
import { lerEstado } from "../../lib/estado.mjs";
import { naRaiz } from "../../config.mjs";

const COOLDOWN_PATH = naRaiz("media/news/_ig-cooldown.json");

// Cooldown GLOBAL da run. Diferente do _rateLimitedUntil (que e por item e
// so cobre a cota de content publishing 50/24h), o cooldown global existe pra
// o limite DA APLICACAO no Graph API (code 4 "Application request limit
// reached"), que o pre-check de content_publishing_limit NAO enxerga (ele
// reporta 0/50 mesmo com a app throttled). Quando armado, o proximo cron sai
// cedo SEM rodar deteccao de apagados, gerar slides, dar push, nem tentar
// publicar. Para de martelar a API e de poluir o repo com commits vazios.
// Persistido em arquivo porque cada run do Actions e um checkout limpo.
export async function readCooldown() {
  // Corrompido derruba: cooldown sumindo em silêncio fazia a run voltar a martelar a API
  const doc = await lerEstado(COOLDOWN_PATH, {});
  return { until: doc.until || null, reason: doc.reason || null, code: doc.code ?? null, fbtraceId: doc.fbtraceId || null, setAt: doc.setAt || null };
}

// Retorna true se ha cooldown ativo (until no futuro relativo a nowIso).
export function isCoolingDown(cooldown, nowIso) {
  if (!cooldown || !cooldown.until) return false;
  return new Date(cooldown.until).getTime() > new Date(nowIso).getTime();
}

// Arma o cooldown ate now + ms. Grava o motivo/code/fbtrace pra debug e pra
// telegram. Retorna o doc gravado.
export async function setCooldown({ ms, reason = null, code = null, fbtraceId = null } = {}) {
  const now = Date.now();
  const doc = {
    until: new Date(now + ms).toISOString(),
    reason,
    code,
    fbtraceId,
    setAt: new Date(now).toISOString(),
  };
  await fs.writeFile(COOLDOWN_PATH, JSON.stringify(doc, null, 2));
  return doc;
}

// Zera o cooldown (until=null). Chamado quando uma run publica com sucesso,
// pra remover cooldown stale e nao segurar o feed mais que o necessario.
export async function clearCooldown() {
  const doc = { until: null, reason: null, code: null, fbtraceId: null, setAt: new Date().toISOString() };
  await fs.writeFile(COOLDOWN_PATH, JSON.stringify(doc, null, 2));
  return doc;
}
