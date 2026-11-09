// Fila de artes de agenda entre o coletor (GitHub Actions) e o curador (routine Claude), em media/news/agenda-arte/:
//   pendentes.json  [{link, conta, banda, dataPost, legenda, imagens: ["media/news/agenda-arte/<codigo>-1.jpg"]}]
//                   escrito SÓ pelo coletor, que baixa a imagem reduzida (1080 px) pro repo;
//   lidas.json      {link: {lidoEm, shows: [{dia, mes, hora, casa, cidade, uf, observacao}]}}
//                   escrito SÓ pelo curador (scripts/news/routine-prompt.md, passo 1.5).
// Depois de lida, a imagem sai do repo (o coletor apaga). Pedido sem leitura em 30 dias também sai.
import fs from "node:fs/promises";
import path from "node:path";
import { precisaArte } from "./quais.mjs";

const TRINTA_DIAS = 30 * 864e5;
export const PASTA = "media/news/agenda-arte";
const codigo = (link) => (String(link).match(/\/(?:p|reel)\/([\w-]+)/) || [])[1];

async function reduzir(buf) {
  const sharp = (await import("sharp")).default;
  return sharp(buf).resize({ width: 1080, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();
}

// Baixa as artes novas da banda e acrescenta em `pendentes` (alterado no lugar). Devolve quantas entraram.
// raiz: raiz do repo. Falha de download de um post não derruba a banda.
export async function enfileirarArtes(banda, posts, { pendentes, lidas, hoje, raiz, fetchImpl = fetch, reduzirImpl = reduzir }) {
  let novas = 0;
  for (const p of posts) {
    const cod = codigo(p.link);
    if (!cod || !precisaArte(p, hoje) || lidas[p.link] || pendentes.some((x) => x.link === p.link)) continue;
    try {
      const imagens = [];
      for (const [i, url] of p.imagens.entries()) {
        const r = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const rel = `${PASTA}/${cod}-${i + 1}.jpg`;
        await fs.mkdir(path.join(raiz, PASTA), { recursive: true });
        await fs.writeFile(path.join(raiz, rel), await reduzirImpl(Buffer.from(await r.arrayBuffer())));
        imagens.push(rel);
      }
      pendentes.push({ link: p.link, conta: banda.conta, banda: banda.nome, dataPost: p.data, legenda: p.legenda, imagens });
      novas++;
    } catch (e) {
      console.warn(`[agenda] arte de ${p.link} não deu pra baixar: ${e.message}`);
    }
  }
  return novas;
}

// Tira da fila (e apaga a imagem) o que o curador já leu ou que passou de 30 dias. Devolve a fila nova.
export async function limparFila(pendentes, lidas, { raiz, agora = Date.now() }) {
  const fica = [];
  for (const p of pendentes) {
    if (!lidas[p.link] && agora - Date.parse(p.dataPost) <= TRINTA_DIAS) { fica.push(p); continue; }
    for (const rel of p.imagens) await fs.rm(path.join(raiz, rel), { force: true });
  }
  return fica;
}
