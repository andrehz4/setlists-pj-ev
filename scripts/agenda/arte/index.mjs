// Agenda que só está na ARTE do post: lê o texto da imagem (Gemini) e pendura os shows em post.arte, que o
// montar.mjs trata como post de agenda. Módulo apartado: sem GEMINI_API_KEY não faz nada.
// Cache (media/agenda/_arte-cache.json, por link do post): cada arte é lida UMA vez; entradas com mais de 90 dias saem.
import { precisaArte, showsDaArte } from "./quais.mjs";
import { lerArteGemini } from "./gemini.mjs";

const NOVENTA_DIAS = 90 * 864e5;

// posts: os da banda (com imagens). cache: objeto {link: {lidoEm, resposta}}, alterado no lugar.
export async function completarComArte(banda, posts, cache, { env = process.env, ler = lerArteGemini, agora = Date.now() } = {}) {
  for (const [link, v] of Object.entries(cache)) if (agora - Date.parse(v.lidoEm) > NOVENTA_DIAS) delete cache[link];
  if (!env.GEMINI_API_KEY) return 0;
  let lidas = 0;
  for (const p of posts) {
    if (!precisaArte(p)) continue;
    if (!cache[p.link]) {
      try {
        cache[p.link] = { lidoEm: new Date(agora).toISOString(), resposta: await ler(p.imagens, { banda, dataPost: p.data, env }) };
        lidas++;
      } catch (e) {
        console.warn(`[agenda] arte de ${p.link} não deu pra ler: ${e.message}`);
        continue;
      }
    }
    const shows = showsDaArte(cache[p.link].resposta, p.data);
    if (shows.length) p.arte = shows;
  }
  return lidas;
}
