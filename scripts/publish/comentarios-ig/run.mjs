// Comentários de ingresso no IG (módulo apartado, rodado à mão pelo workflow ig-comentarios.yml).
//   listar:    lê os comentários dos últimos posts e lista os de venda/procura de ingresso (NÃO responde nada)
//   responder: responde SÓ os ids aprovados pelo Andre, com o texto aprovado (--ids a,b --texto "...")
//   node scripts/publish/comentarios-ig/run.mjs listar [--posts 15]
//   node scripts/publish/comentarios-ig/run.mjs responder --ids 123,456 --texto "..."
import { getIG, postIG, credenciais } from "../ig/http.mjs";
import { tipoIngresso } from "./filtro.mjs";

const arg = (nome, padrao = "") => { const i = process.argv.indexOf(`--${nome}`); return i >= 0 ? process.argv[i + 1] || "" : padrao; };
const modo = process.argv[2];
const { igUserId, accessToken } = credenciais({}, "comentarios-ig");

async function todasPaginas(path, params) {
  const itens = [];
  let after;
  for (let i = 0; i < 10; i++) { // teto de 10 páginas por post
    const r = await getIG(path, { ...params, access_token: accessToken, ...(after ? { after } : {}) });
    itens.push(...(r.data || []));
    after = r.paging?.cursors?.after;
    if (!r.paging?.next || !after) break;
  }
  return itens;
}

async function listar() {
  const nPosts = Number(arg("posts", "15"));
  const eu = (await getIG(`/${igUserId}`, { fields: "username", access_token: accessToken })).username;
  const posts = await getIG(`/${igUserId}/media`, {
    fields: "id,caption,timestamp,permalink,comments_count", limit: nPosts, access_token: accessToken });
  const achados = [];
  let total = 0, semResposta = 0;
  for (const p of posts.data || []) {
    if (!p.comments_count) continue;
    const coms = await todasPaginas(`/${p.id}/comments`, { fields: "id,text,username,timestamp,replies{username}", limit: 50 });
    if (coms.length < p.comments_count) console.log(`[comentarios-ig] aviso: post ${p.id} diz ${p.comments_count} comentários, API devolveu ${coms.length}`);
    for (const c of coms) {
      total++;
      if (c.username !== eu && !(c.replies?.data || []).some((r) => r.username === eu)) semResposta++;
      const tipo = tipoIngresso(c.text);
      if (!tipo) continue;
      const jaRespondido = (c.replies?.data || []).some((r) => r.username === eu);
      achados.push({ id: c.id, tipo, usuario: c.username, texto: c.text.replace(/\s+/g, " ").slice(0, 140), jaRespondido,
        post: (p.caption || "").split("\n")[0].slice(0, 50), link: p.permalink });
    }
  }
  const contados = (posts.data || []).reduce((n, p) => n + (p.comments_count || 0), 0);
  console.log(`[comentarios-ig] comments_count somado nos posts: ${contados}`);
  console.log(`[comentarios-ig] conta @${eu}: ${posts.data?.length || 0} posts lidos, ${total} comentários, ${semResposta} sem resposta nossa, ${achados.length} de ingresso`);
  for (const a of achados) {
    console.log(`  ${a.id} | ${a.tipo} | @${a.usuario} | ${a.jaRespondido ? "JÁ RESPONDIDO" : "pendente"} | "${a.texto}" | post: ${a.post}`);
  }
  const pendentes = achados.filter((a) => !a.jaRespondido).map((a) => a.id);
  console.log(`[comentarios-ig] ids pendentes: ${pendentes.join(",") || "(nenhum)"}`);
}

async function responder() {
  const ids = arg("ids").split(",").map((x) => x.trim()).filter((x) => /^\d+$/.test(x));
  const texto = arg("texto").trim();
  if (!ids.length) throw new Error("responder: --ids obrigatório (lista aprovada pelo Andre)");
  if (texto.length < 20) throw new Error("responder: --texto vazio ou curto demais");
  let ok = 0;
  for (const id of ids) {
    try {
      const r = await postIG(`/${id}/replies`, { message: texto, access_token: accessToken });
      console.log(`[comentarios-ig] respondido ${id} -> ${r.id}`);
      ok++;
    } catch (e) {
      console.error(`[comentarios-ig] falhou ${id}: ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, 4000)); // devagar, pra não parecer robô em rajada
  }
  console.log(`[comentarios-ig] ${ok}/${ids.length} respondidos`);
  if (ok < ids.length) process.exitCode = 1;
}

if (modo === "listar") await listar();
else if (modo === "responder") await responder();
else throw new Error(`modo inválido: ${modo} (use listar ou responder)`);
