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
import { publishSingleImage, publishTaggedCarousel } from "../../publish/instagram.mjs";
import { getCurrentCycleColor } from "../../publish/color-cycle.mjs";
import { readQueue } from "../../publish/queue.mjs";
import { isoWeekKey } from "../../publish/reel-week.mjs";
import { showsDaSemana, legendaSemana, contasDaSemana, segundaDa, somaDias } from "./semana.mjs";
import { gerarArteSemana } from "./arte-semana.mjs";
import { gerarCarrossel } from "./carrossel/montar.mjs";
import { corDoCiclo } from "./carrossel/svg-base.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const PUBLICAR = process.env.AGENDA_PUBLICAR === "1" && !DRY;
// Carrossel (capa + 1 slide por banda + chamada, scripts/agenda/redes/carrossel/). Sem a variável: arte única antiga.
const CARROSSEL = process.env.AGENDA_CARROSSEL === "1";
const LOG = naRaiz("media/agenda/_semana-log.json");
const PASTA = naRaiz("media/agenda/stories");
const REPO = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// Sobe a imagem (R2; sem R2, commit e URL do raw do GitHub).
async function urlPublica(arquivo, semana) {
  const nome = arquivo.split("/").pop();
  const url = await publicarViaR2(arquivo, `stories/${nome}`);
  if (url) return url;
  await commitAndPush(["media/agenda/stories/"], `agenda: arte da semana ${semana}`, { dry: NO_GIT });
  return `${REPO}/media/agenda/stories/${nome}`;
}

async function arteUnica(lista, inicio, fim, cor, semana, legenda, contas) {
  const arquivo = `${PASTA}/agenda-semana-${semana}.jpg`;
  await gerarArteSemana(lista, inicio, fim, arquivo, cor);
  console.log(`${legenda}\n[agenda-semana] marcar: ${contas.join(", ")}`);
  if (!PUBLICAR) return null;
  return publishSingleImage({ imageUrl: await urlPublica(arquivo, semana), caption: legenda, contas });
}

async function carrossel(lista, inicio, fim, cor, semana, legenda) {
  const { bandas = [] } = await lerEstado(naRaiz("media/agenda/bandas.json"), { bandas: [] });
  const slides = await gerarCarrossel(lista, bandas, inicio, fim, corDoCiclo(cor), PASTA, `agenda-semana-${semana}`);
  console.log(`${legenda}\n[agenda-semana] carrossel: ${slides.map((s) => `${s.tipo}(${s.contas.join(",")})`).join(" | ")}`);
  if (!PUBLICAR) return null;
  const comUrl = [];
  for (const s of slides) comUrl.push({ imageUrl: await urlPublica(s.arquivo, semana), contas: s.contas });
  return publishTaggedCarousel(comUrl, legenda);
}

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
  const cor = getCurrentCycleColor((await readQueue()).postCount);
  await fs.mkdir(PASTA, { recursive: true });
  const r = CARROSSEL ? await carrossel(lista, inicio, fim, cor, semana, legenda) : await arteUnica(lista, inicio, fim, cor, semana, legenda, contas);
  if (!r) return;
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
