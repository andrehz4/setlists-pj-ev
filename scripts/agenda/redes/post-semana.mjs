// Post de feed "Agenda da semana" (segunda de manhã): arte com os shows de segunda a domingo e legenda
// com o @ da banda e o @ da casa; marca as contas na foto. Workflow agenda-semana.yml.
// Só publica com AGENDA_PUBLICAR=1 (variável do repo); sem ela, gera a arte e mostra a legenda.
// Não passa pela fila de notícias, então nunca entra no reel semanal. Idempotente por semana ISO.
// Flags: --dry-run, --no-git. AGENDA_DIA força o dia (teste).
import fs from "node:fs/promises";
import { naRaiz } from "../../config.mjs";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { enviarTelegram } from "../../lib/telegram.mjs";
import { diaBRT } from "../../lib/brt.mjs";
import { publicarViaR2 } from "../../publish/midia-r2.mjs";
import { publishSingleImage } from "../../publish/instagram.mjs";
import { getCurrentCycleColor } from "../../publish/color-cycle.mjs";
import { readQueue } from "../../publish/queue.mjs";
import { isoWeekKey } from "../../publish/reel-week.mjs";
import { showsDaSemana, legendaSemana, contasDaSemana, segundaDa, somaDias } from "./semana.mjs";
import { gerarArteSemana } from "./arte-semana.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const PUBLICAR = process.env.AGENDA_PUBLICAR === "1" && !DRY;
const LOG = naRaiz("media/agenda/_semana-log.json");
const PASTA = naRaiz("media/agenda/stories");
const REPO = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

async function main() {
  const inicio = segundaDa(process.env.AGENDA_DIA || diaBRT());
  const fim = somaDias(inicio, 6);
  const semana = isoWeekKey(new Date(`${inicio}T12:00:00Z`));
  const log = await lerEstado(LOG, { entradas: [] });
  if (log.entradas.some((e) => e.semana === semana && e.postId)) return console.log(`[agenda-semana] ${semana} já publicada`);
  const { shows } = await lerEstado(naRaiz("media/agenda/shows.json"), { shows: [] });
  const lista = showsDaSemana(shows, inicio);
  console.log(`[agenda-semana] ${semana} (${inicio} a ${fim}): ${lista.length} show(s) | publicar=${PUBLICAR}`);
  if (!lista.length) return;
  const legenda = legendaSemana(lista, inicio);
  const contas = contasDaSemana(lista);
  const nome = `agenda-semana-${semana}.jpg`;
  await fs.mkdir(PASTA, { recursive: true });
  const arquivo = `${PASTA}/${nome}`;
  await gerarArteSemana(lista, inicio, fim, arquivo, getCurrentCycleColor((await readQueue()).postCount));
  console.log(`${legenda}\n[agenda-semana] marcar: ${contas.join(", ")}`);
  if (!PUBLICAR) return;
  let imageUrl = await publicarViaR2(arquivo, `stories/${nome}`);
  if (!imageUrl) {
    await commitAndPush(["media/agenda/stories/"], `agenda: arte da semana ${semana}`, { dry: NO_GIT });
    imageUrl = `${REPO}/media/agenda/stories/${nome}`;
  }
  const r = await publishSingleImage({ imageUrl, caption: legenda, contas });
  console.log(`[agenda-semana] OK postId=${r.postId} marcou=${r.marcou}`);
  log.entradas.push({ semana, postId: r.postId, marcou: r.marcou, shows: lista.map((s) => s.id), em: new Date().toISOString() });
  log.entradas = log.entradas.slice(-60);
  await gravarEstado(LOG, log);
  await commitAndPush(["media/agenda/_semana-log.json"], `agenda: post da semana ${semana}`, { dry: NO_GIT });
  await enviarTelegram(`🗓️ <b>Agenda da semana publicada</b> (${lista.length} show(s))${r.marcou ? "" : ", sem marcação"}`, { prefixo: "[agenda-semana]" });
}

main().catch((e) => {
  console.error("[agenda-semana] FATAL:", e);
  process.exit(1);
});
