// Publica o reel "Agenda da semana" da terça (render.mjs) no IG e no FB. Idempotente por semana ISO
// (media/agenda/reel-log.json). Desligado sem AGENDA_REEL=1 (variável do repo).
//   node scripts/publish/agenda-reel/publicar.mjs [--inicio AAAA-MM-DD] [--previa | --dry-run] [--no-git]
//   --previa: renderiza, sobe pro R2 e manda o link no Telegram (Andre aprova), sem publicar.
//   --dry-run: só renderiza e mostra a legenda.
// Workflow: .github/workflows/publish-agenda-reel.yml (TriggerAll toda terça 11:07 BRT).
import fs from "node:fs";
import path from "node:path";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { diaBRT } from "../../lib/brt.mjs";
import { naRaiz } from "../../config.mjs";
import { publicarViaR2 } from "../midia-r2.mjs";
import { publishReelComFallback } from "../reel/fallback.mjs";
import { espelharNoFacebook } from "../reel/registro.mjs";
import { somaDias } from "../../agenda/redes/semana.mjs";
import { renderizarReelAgenda } from "./render.mjs";
import { legendaDoReel } from "./legenda.mjs";
import { semanaIso } from "./semana.mjs";

export const LOG = naRaiz("media/agenda/reel-log.json");
const SAIDA = naRaiz("media/agenda/reel-saida"); // gitignored
export const THUMB_MS = 2700; // fim da abertura: a pergunta inteira na tela

// Terça desta semana em BRT (no próprio dia, é hoje; depois dela, a da semana seguinte).
export function tercaDaVez(hoje = diaBRT()) {
  const dow = new Date(`${hoje}T12:00:00Z`).getUTCDay();
  return somaDias(hoje, (2 - dow + 7) % 7);
}

const valida = (d) => (d && typeof d.semanas === "object" ? null : "reel-log.json sem 'semanas'");

export async function publicarReelAgenda({ inicio = tercaDaVez(), modo = "publicar", git = true, env = process.env, deps = {} } = {}) {
  const avisar = deps.enviarTelegram || enviarTelegram;
  if (modo === "publicar" && env.AGENDA_REEL !== "1") { console.log("[agenda-reel] desligado (AGENDA_REEL != 1)"); return { pulou: "desligado" }; }
  const weekKey = semanaIso(inicio);
  const log = await lerEstado(LOG, { semanas: {} }, { valida });
  if (modo === "publicar" && log.semanas[weekKey]) {
    console.log(`[agenda-reel] ${weekKey} já saiu (${log.semanas[weekKey].postId || log.semanas[weekKey].obs}), nada a fazer`);
    return { pulou: "já publicado" };
  }
  fs.mkdirSync(SAIDA, { recursive: true });
  const render = deps.renderizar || renderizarReelAgenda;
  const r = await render({ inicio, env, saida: path.join(SAIDA, `${weekKey}${modo === "publicar" ? "" : "-previa"}.mp4`) });
  if (r.pulou) {
    console.log(`[agenda-reel] ${weekKey} pulou: ${r.pulou}`);
    if (modo !== "dry") await avisar(`🗓️ Reel da agenda ${escHtml(weekKey)} não saiu: ${escHtml(r.pulou)}`).catch(() => {});
    return r;
  }
  const legenda = legendaDoReel(r.shows);
  console.log(`[agenda-reel] legenda (${legenda.length} caracteres):\n${legenda}`);
  if (modo === "dry") return { ...r, legenda };

  try {
    const chave = `especiais/agenda-semana/${weekKey}${modo === "previa" ? `-previa-${Date.now()}` : ""}.mp4`;
    const subir = deps.publicarViaR2 || publicarViaR2;
    let url = await subir(r.arquivo, chave, { env });
    // mock IG local (sem R2): o mock busca o MP4 pela base pública do repo
    if (!url && env.REPO_PUBLIC_BASE && !git) url = `${env.REPO_PUBLIC_BASE}/${path.relative(naRaiz("."), r.arquivo)}`;
    if (!url) throw new Error("não consegui subir o vídeo pro R2");
    const resumo = `${r.layout}/${r.paleta} · ${r.duracao.toFixed(1)} s · ${r.shows.length} shows · ${r.aviso}`;
    if (modo === "previa") {
      await avisar(`🎬 <b>Prévia do reel da agenda</b> (${escHtml(weekKey)}, NÃO publicado)\n${escHtml(resumo)}\n${escHtml(url)}`);
      return { ...r, url, legenda };
    }
    const pub = await (deps.publishReelComFallback || publishReelComFallback)({ videoUrl: url, caption: legenda, shareToFeed: true, thumbOffsetMs: THUMB_MS });
    const fbPostId = await (deps.espelharNoFacebook || espelharNoFacebook)(url, legenda);
    log.semanas[weekKey] = { postId: pub.postId, fbPostId: fbPostId || null, layout: r.layout, paleta: r.paleta, url, em: new Date().toISOString() };
    if (git) { // --no-git (mock IG): não mexe no log de verdade
      await gravarEstado(LOG, log);
      await (deps.commitAndPush || commitAndPush)([LOG], `publish-agenda-reel: ${weekKey} postado (${r.layout}/${r.paleta}, IG ${pub.postId})`);
    }
    await avisar(`🗓️ <b>Reel da agenda no ar</b> (${escHtml(weekKey)})\n${escHtml(resumo)}\nIG ${escHtml(pub.postId)}${fbPostId ? `\nFB ${escHtml(fbPostId)}` : ""}`);
    return { ...r, url, legenda, postId: pub.postId };
  } catch (e) {
    await avisar(`⚠️ <b>Reel da agenda FALHOU</b> (${escHtml(weekKey)})\n${escHtml(e.message)}`).catch(() => {});
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv;
  const i = a.indexOf("--inicio");
  const modo = a.includes("--dry-run") ? "dry" : a.includes("--previa") ? "previa" : "publicar";
  publicarReelAgenda({ inicio: i >= 0 ? a[i + 1] : undefined, modo, git: !a.includes("--no-git") })
    .catch((e) => { console.error(`[agenda-reel] FALHA: ${e.stack || e.message}`); process.exit(1); });
}
