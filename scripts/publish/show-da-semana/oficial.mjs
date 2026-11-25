// Coleta o histórico de shows do site oficial (pearljam.com/tour/history): pôster (até 3), artista do pôster,
// setlist com os bis e galeria. Cada página de show traz um JSON embutido ("show":{...}); a lista de shows vem
// embutida na página do histórico. Grava media/show-da-semana/oficial/<ano>.json e, com --posters, baixa os
// pôsteres pra media/show-da-semana/posters/ (tudo FORA do git: arte de terceiros, repo público).
//   node scripts/publish/show-da-semana/oficial.mjs            coleta os dados (1 página por segundo)
//   node scripts/publish/show-da-semana/oficial.mjs --posters  baixa os pôsteres que faltam
import fs from "node:fs";
import path from "node:path";
import { RAIZ } from "../../config.mjs";

const SITE = "https://pearljam.com";
export const PASTA_OFICIAL = "media/show-da-semana/oficial";
export const PASTA_POSTERS = "media/show-da-semana/posters";
const CAB = { headers: { "User-Agent": "Mozilla/5.0 (smufdpj-acervo)" } };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

// Recorta o objeto JSON que começa logo depois de `marca` (conta chaves fora de string).
export function objetoApos(html, marca) {
  const ini = html.indexOf(marca);
  if (ini < 0) return null;
  let i = ini + marca.length - 1, nivel = 0, str = false;
  for (let j = i; j < html.length; j++) {
    const c = html[j];
    if (str) { if (c === "\\") j++; else if (c === '"') str = false; continue; }
    if (c === '"') str = true;
    else if (c === "{") nivel++;
    else if (c === "}" && --nivel === 0) return JSON.parse(html.slice(i, j + 1));
  }
  return null;
}

export function slugsDaLista(html) {
  const vistos = new Map();
  for (const m of html.matchAll(/"slug":"([a-z0-9-]+-\d{9,})","rawdate":"(\d{4}-\d{2}-\d{2})"/g)) vistos.set(m[1], m[2]);
  return [...vistos].map(([slug, data]) => ({ slug, data }));
}

export function registro(s, data) {
  const posters = [1, 2, 3].map((n) => {
    const suf = n === 1 ? "" : `_${n}`;
    const url = s[`poster${suf}_file`];
    return url ? { url, artista: s[`poster_artist${suf}`] || "", creditos: s[`poster_credits${suf}`] || "" } : null;
  }).filter(Boolean);
  return {
    slug: s.slug, data, cidade: s.location || s.city, local: s.venue_name, pais: s.country,
    url: `${SITE}/tour/history/show/${s.slug}`, posters, galeria: s.gallery_id || null,
    sets: (s.sets || []).map((x) => ({ nome: x.name, musicas: (x.songs || []).map((m) => m.name) })),
  };
}

async function texto(url) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, CAB);
    if (r.ok) return r.text();
    if (i >= 3 || (r.status < 500 && r.status !== 429)) throw new Error(`HTTP ${r.status} em ${url}`);
    await espera(5000 * (i + 1));
  }
}

async function coletar() {
  const lista = slugsDaLista(await texto(`${SITE}/tour/history`));
  const porAno = {}, falhas = [];
  for (const [i, { slug, data }] of lista.entries()) {
    try {
      const show = objetoApos(await texto(`${SITE}/tour/history/show/${slug}`), '"show":{');
      if (show) (porAno[data.slice(0, 4)] ||= []).push(registro(show, data));
      else falhas.push(slug);
    } catch (e) { falhas.push(`${slug} (${e.message})`); }
    process.stdout.write(`${i + 1}/${lista.length}\r`);
    await espera(1000);
  }
  const pasta = path.join(RAIZ, PASTA_OFICIAL);
  fs.mkdirSync(pasta, { recursive: true });
  for (const [ano, l] of Object.entries(porAno)) {
    l.sort((a, b) => a.data.localeCompare(b.data));
    fs.writeFileSync(path.join(pasta, `${ano}.json`), JSON.stringify(l, null, 1) + "\n");
  }
  const total = Object.values(porAno).flat();
  console.log(`\n${total.length} shows, ${total.filter((s) => s.posters.length).length} com pôster, ${falhas.length} falhas`);
  if (falhas.length) console.log(falhas.slice(0, 20).join("\n"));
}

async function baixarPosters() {
  const pastaO = path.join(RAIZ, PASTA_OFICIAL), pastaP = path.join(RAIZ, PASTA_POSTERS);
  fs.mkdirSync(pastaP, { recursive: true });
  let novos = 0;
  for (const arq of fs.readdirSync(pastaO).filter((n) => n.endsWith(".json"))) {
    for (const s of JSON.parse(fs.readFileSync(path.join(pastaO, arq), "utf8"))) {
      for (const [n, p] of s.posters.entries()) {
        const ext = (p.url.match(/\.(jpe?g|png|gif|webp)$/i) || [".jpg"])[0].toLowerCase();
        const destino = path.join(pastaP, `${s.data}-${s.slug}${n ? `-${n + 1}` : ""}${ext}`);
        if (fs.existsSync(destino)) continue;
        const r = await fetch(encodeURI(p.url), CAB);
        if (!r.ok) { console.log(`falhou ${r.status}: ${p.url}`); continue; }
        fs.writeFileSync(destino, Buffer.from(await r.arrayBuffer()));
        novos++;
        await espera(500);
      }
    }
  }
  console.log(`${novos} pôsteres baixados em ${pastaP}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  if (process.argv.includes("--posters")) await baixarPosters();
  else await coletar();
}
