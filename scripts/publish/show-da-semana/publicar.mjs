// Publica UM Show da Semana por run (IG carrossel + FB álbum), com os 4 slides já no R2 (subir.mjs).
// Desligado sem SHOW_DA_SEMANA=1. Idempotente: grava "tentativaEm" antes de publicar; se a run cair depois
// do IG aceitar (falso-erro 2207051, timeout), a próxima acha o post pela 1a linha da legenda e só marca.
//   node scripts/publish/show-da-semana/publicar.mjs [--dry-run] [--force] [--no-git]
// Workflow: .github/workflows/publish-show-da-semana.yml (TriggerAll ter/qui 17:07 e sáb 11:07 BRT).
import fs from "node:fs";
import { RAIZ } from "../../config.mjs";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { getRecentMedia } from "../ig/recuperar.mjs";
import { publicarCarrossel } from "../carrossel/especial.mjs";
import { caminhoFila, validaFila, proximoDaVez, checarPost, assinatura, ARQ_FILA } from "./fila.mjs";
import { caminhoFicha } from "./ficha.mjs";

function lerFicha(raiz, id) {
  const arq = caminhoFicha(raiz, id);
  return fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, "utf8")) : null;
}

// Post já está no IG? (legenda começando igual, criado depois da tentativa)
async function acharNoIg(legenda, desdeIso, buscar) {
  const alvo = assinatura(legenda);
  const desde = new Date(desdeIso).getTime() - 120000;
  const media = await buscar({ limit: 10 });
  const m = media.find((x) => assinatura(x.caption) === alvo && new Date(x.timestamp).getTime() >= desde);
  return m ? m.id : null;
}

export async function publicarShowDaSemana({ raiz = RAIZ, agora = new Date(), dry = false, force = false, git = true, env = process.env, deps = {} } = {}) {
  const avisar = deps.enviarTelegram || ((m) => enviarTelegram(m));
  const salvarGit = deps.commitAndPush || commitAndPush;
  if (env.SHOW_DA_SEMANA !== "1" && !dry) { console.log("[show-da-semana] desligado (SHOW_DA_SEMANA != 1)"); return { pulou: "desligado" }; }
  const arqFila = caminhoFila(raiz);
  const fila = await lerEstado(arqFila, null, { valida: validaFila });
  if (!fila) throw new Error(`${ARQ_FILA} não existe (rodar subir.mjs no Mac)`);
  const post = proximoDaVez(fila, agora, { force });
  if (!post) { console.log("[show-da-semana] nenhum post maduro, nada a fazer"); return { pulou: "nada maduro" }; }

  const ficha = (deps.lerFicha || lerFicha)(raiz, post.id);
  const erros = checarPost(post, ficha);
  const rotulo = `Show #${post.n} (${post.id})`;
  if (erros.length) {
    if (!dry) await avisar(`⚠️ <b>Show da Semana não saiu</b>: ${escHtml(rotulo)}\n${erros.map((x) => `• ${escHtml(x)}`).join("\n")}`).catch(() => {});
    throw new Error(`${rotulo} barrado: ${erros.join("; ")}`);
  }
  console.log(`[show-da-semana] ${rotulo}, legenda ${ficha.legenda.length} caracteres, ${post.urls.length} slides`);
  if (dry) return { post, legenda: ficha.legenda };

  const salvar = async (msg) => {
    if (!git) return; // mock: não mexe na fila de verdade
    await gravarEstado(arqFila, fila);
    await salvarGit([ARQ_FILA], msg);
  };
  const marcar = async (r, obs) => {
    Object.assign(post, { postedAt: new Date().toISOString(), igId: r.postId, fbId: r.fbPostId || null, erro: null, ...(obs ? { obs } : {}) });
    await salvar(`show-da-semana: #${post.n} postado (IG ${r.postId}${r.fbPostId ? `, FB ${r.fbPostId}` : ""})`);
    await avisar(`🎸 <b>Show da Semana no ar</b>: ${escHtml(rotulo)}\nIG ${escHtml(r.postId)}${r.fbPostId ? `\nFB ${escHtml(r.fbPostId)}` : ""}${obs ? `\n${escHtml(obs)}` : ""}`).catch(() => {});
    return { post, ...r };
  };

  if (post.tentativaEm) {
    const id = await acharNoIg(ficha.legenda, post.tentativaEm, deps.getRecentMedia || getRecentMedia);
    if (id) return marcar({ postId: id }, "recuperado de uma run anterior; FB não confirmado, conferir na Página");
  }
  post.tentativaEm = new Date().toISOString();
  await salvar(`show-da-semana: tentativa do #${post.n}`);
  try {
    const r = await (deps.publicarCarrossel || publicarCarrossel)({ imagens: post.urls, legenda: ficha.legenda });
    return await marcar(r);
  } catch (e) {
    post.erro = e.message.slice(0, 300);
    await salvar(`show-da-semana: #${post.n} falhou`).catch(() => {});
    await avisar(`⚠️ <b>Show da Semana FALHOU</b>: ${escHtml(rotulo)}\n${escHtml(e.message)}`).catch(() => {});
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv;
  publicarShowDaSemana({ dry: a.includes("--dry-run"), force: a.includes("--force"), git: !a.includes("--no-git") })
    .catch((e) => { console.error(`[show-da-semana] FALHA: ${e.stack || e.message}`); process.exit(1); });
}
