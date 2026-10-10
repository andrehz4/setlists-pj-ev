// Story em VÍDEO por banda (substitui o "Alô, pessoal de..." quando AGENDA_STORY_VIDEO=1). Um story por banda com show
// hoje: abertura com clipe, logo, mapa, shows, final; voz fixa (media/agenda/voz), b-roll do acervo, trilha do story.
// Só publica com AGENDA_PUBLICAR=1. Idempotente por dia+banda (media/agenda/_story-banda-log.json).
// Flags: --dry-run (renderiza e não publica), --no-git. AGENDA_DIA força o dia.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { naRaiz } from "../../config.mjs";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { diaBRT } from "../../lib/brt.mjs";
import { publicarViaR2 } from "../../publish/midia-r2.mjs";
import { publishVideoStory } from "../../publish/instagram.mjs";
import { getCurrentCycleColor } from "../../publish/color-cycle.mjs";
import { readQueue } from "../../publish/queue.mjs";
import { listTracks, dayOfYear } from "../../publish/story-track.mjs";
import { carregarTransicoes } from "../../publish/reel/transicoes.mjs";
import { materializar } from "../../publish/reel/acervo-r2.mjs";
import { storiesDoDia, falasDaBanda, clipesDoStory, contasDoStory } from "./story-banda/dados.mjs";
import { cortarData } from "./story-banda/data-cortada.mjs";
import { renderizarStory } from "./story-banda/render.mjs";
import { variacaoDoDia } from "./story-banda/variacao.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run"), NO_GIT = args.includes("--no-git");
const PUBLICAR = process.env.AGENDA_PUBLICAR === "1" && !DRY;
const LOG = naRaiz("media/agenda/_story-banda-log.json");
const TEMA = { "#0a0a0a": "preto", "#E10600": "vermelho", "#a87f2c": "ocre", "#2a5b9e": "azul" };
const ORDEM_TEMAS = ["azul", "ocre", "preto", "vermelho"];
// cor do ciclo pra 1a banda do dia; as seguintes andam na roda (3 stories seguidos não saem da mesma cor)
const temaDaBanda = (tema, k) => ORDEM_TEMAS[(ORDEM_TEMAS.indexOf(tema) + k) % ORDEM_TEMAS.length];

async function main() {
  const dia = process.env.AGENDA_DIA || diaBRT();
  const { shows } = await lerEstado(naRaiz("media/agenda/shows.json"), { shows: [] });
  const { bandas } = await lerEstado(naRaiz("media/agenda/bandas.json"), { bandas: [] });
  const log = await lerEstado(LOG, { entradas: [] });
  const stories = storiesDoDia(shows, bandas, dia);
  console.log(`[story-banda] ${dia}: ${stories.length} banda(s) com show | publicar=${PUBLICAR}`);
  if (!stories.length) return;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "story-banda-dia-"));
  const cor = getCurrentCycleColor((await readQueue()).postCount);
  const tema = TEMA[cor] || "azul";
  const tracks = await listTracks();
  const acervo = carregarTransicoes();
  const feitos = [], mapasUsados = DRY ? [] : log.entradas.filter((e) => e.dia === dia && e.mapa).map((e) => e.mapa);
  for (const [k, st] of stories.entries()) {
    if (!DRY && log.entradas.some((e) => e.dia === dia && e.banda === st.contaPura && e.postId)) { console.log(`[story-banda] ${st.banda} já publicado`); continue; }
    const escolhidos = clipesDoStory(acervo, dia, k);
    const clipes = escolhidos ? materializar(escolhidos).map((t) => t.arq) : [];
    if (clipes.length < 3) { console.warn(`[story-banda] ${st.banda}: sem trechos de clipe suficientes, pulando`); continue; }
    const f = falasDaBanda(st, k);
    const falas = { abertura: f.abertura, whoosh: f.whoosh, estado: f.estado, data: cortarData(f.dataInteira, tmp), hora: f.hora, final: f.final };
    const logo = naRaiz(`media/agenda/fotos/${st.contaPura}.jpg`);
    const saida = path.join(tmp, `${dia}-${st.contaPura}.mp4`);
    const variacao = variacaoDoDia(dia, st, k, mapasUsados);
    mapasUsados.push(variacao);
    const temaK = temaDaBanda(tema, k);
    await renderizarStory({ story: st, tema: temaK, variacao, logo: fs.existsSync(logo) ? logo : null, clipes, falas,
      trilha: tracks[(dayOfYear(new Date(`${dia}T12:00:00Z`)) + k) % tracks.length].path, saida });
    const contas = contasDoStory(st);
    console.log(`[story-banda] ${st.banda}: ${st.shows.length} show(s), mapa ${variacao}, cor ${temaK}, voz ${f.voz.nome}, marcar ${contas.join(", ")} -> ${saida}`);
    if (DRY) { fs.copyFileSync(saida, naRaiz(`media/agenda/_teste-${dia}-${st.contaPura}.mp4`)); continue; }
    if (!PUBLICAR) continue;
    let videoUrl = await publicarViaR2(saida, `stories/agenda-${dia}-${st.contaPura}.mp4`);
    if (!videoUrl && process.env.IG_API_BASE) { // teste no IG falso (mock-ig): serve o vídeo do disco
      fs.mkdirSync(naRaiz("media/agenda/stories"), { recursive: true });
      fs.copyFileSync(saida, naRaiz(`media/agenda/stories/${path.basename(saida)}`));
      videoUrl = `${process.env.REPO_PUBLIC_BASE}/media/agenda/stories/${path.basename(saida)}`;
    }
    if (!videoUrl) throw new Error("R2 indisponível: story em vídeo precisa do R2");
    const r = await publishVideoStory({ videoUrl, contas });
    console.log(`[story-banda] ${st.banda} OK postId=${r.postId} marcou=${r.marcou}`);
    log.entradas.push({ dia, banda: st.contaPura, postId: r.postId, marcou: r.marcou, mapa: variacao, em: new Date().toISOString() });
    feitos.push(`${escHtml(st.banda)}${r.marcou ? "" : " (sem marcação)"}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  if (!feitos.length) return;
  log.entradas = log.entradas.slice(-200);
  await gravarEstado(LOG, log);
  await commitAndPush(["media/agenda/_story-banda-log.json"], `agenda: story por banda ${dia} (${feitos.length})`, { dry: NO_GIT });
  await enviarTelegram(`🎬 <b>Stories por banda publicados</b>\n\n${feitos.map((x) => `• ${x}`).join("\n")}`, { prefixo: "[story-banda]" });
}

main().catch((e) => { console.error("[story-banda] FATAL:", e); process.exit(1); });
