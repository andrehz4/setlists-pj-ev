// Guardas que podem encerrar a run cedo, antes de tocar a API do IG: cooldown global e quota.
// Devolvem a mensagem do motivo (a run sai com código 0, é backoff intencional) ou null pra seguir.
import { readCooldown, isCoolingDown, clearCooldown, setCooldown } from "../queue.mjs";
import { getContentPublishingLimit, QUOTA_SAFETY_MARGIN } from "../ig-quota.mjs";
import { horaBRT } from "../../lib/brt.mjs";
import { QUOTA_PRECHECK, cooldownMsForCode } from "./config.mjs";
import { avisar } from "./avisos.mjs";

// Cooldown global: se a run anterior bateu no limite DA APP (code 4 etc), sai cedo SEM detecção de
// apagados, slides, push nem publish. Sem Telegram aqui: a falha que armou o cooldown já notificou.
export async function guardaCooldown(nowIso) {
  const cooldown = await readCooldown();
  if (isCoolingDown(cooldown, nowIso)) {
    const motivo = `${cooldown.reason || "rate limit"}${cooldown.code != null ? ` code=${cooldown.code}` : ""}`;
    return { titulo: "Cooldown ativo", msg: `cooldown global ativo ate ${cooldown.until} (motivo: ${motivo}). Aborta a run sem tocar a IG API.` };
  }
  // Expirou mas o arquivo ainda tem `until` no passado: normaliza pra não deixar estado velho no repo.
  if (cooldown.until) {
    await clearCooldown();
    console.log("[publish] cooldown expirado, estado limpo");
  }
  return null;
}

// Pré-check de quota. DESLIGADO por padrão: o endpoint reporta a cota de publishes (50/24h), não o
// limite DA APP (code 4) que é o que derruba o feed. Reativável via IG_QUOTA_PRECHECK=1.
export async function guardaQuota() {
  if (!QUOTA_PRECHECK) return null;
  try {
    const q = await getContentPublishingLimit();
    console.log(`[publish] quota IG: ${q.usage}/${q.total} usados, ${q.remaining} restantes (margem=${QUOTA_SAFETY_MARGIN})`);
    if (!q.saturated) return null;
    await avisar(`⏸ <b>Publish IG pulado, ${horaBRT()} BRT</b>\n\nQuota saturada: <code>${q.usage}/${q.total}</code> usados.\nRestam <b>${q.remaining}</b> (margem ${QUOTA_SAFETY_MARGIN}).\nAguardando janela rolling de 24h liberar.`);
    return { titulo: "Quota saturada", msg: `IG content publishing quota saturada: ${q.usage}/${q.total} usados, ${q.remaining} restantes (<= margem ${QUOTA_SAFETY_MARGIN}). Aborta a run antes de tentar publicar.` };
  } catch (e) {
    // Pré-check falhou (API instável, permissão): não bloqueia; o publish expõe o erro real.
    console.warn(`[publish] pre-check quota falhou (segue mesmo assim): ${e.message}`);
    return null;
  }
}

// Depois dos lotes: rate limit em qualquer lote arma o cooldown (prioridade sobre sucesso parcial,
// o throttle é da app inteira); sem rate limit e com algum sucesso, limpa cooldown velho.
export async function atualizarCooldown(results) {
  const rl = results.find((r) => r.isRateLimit);
  if (rl) {
    const cd = await setCooldown({ ms: cooldownMsForCode(rl.errorCode), reason: rl.error, code: rl.errorCode, fbtraceId: rl.fbtraceId });
    console.warn(`[publish] cooldown global armado ate ${cd.until} (code=${rl.errorCode ?? "?"})`);
  } else if (results.some((r) => r.succeeded > 0 && r.postId)) {
    await clearCooldown();
  }
}
