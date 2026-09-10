// Extrator de legendas pro acervo de cápsulas. Pra cada vídeo do _selecao.json,
// baixa a legenda NO IDIOMA ORIGINAL do áudio (a tradução automática pt do
// YouTube falha no download), limpa o efeito rolagem, remonta em parágrafos por
// pausa da fala, e salva media/news/youtube-acervo/<id>.json com meta+texto.
//
// Roda LOCAL (yt-dlp). As funções de parse são portadas do projeto baixa-clipehz.
//
// Uso: node scripts/news/youtube/extrair.mjs
//      node scripts/news/youtube/extrair.mjs --only iW5l8QIRe8I

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const ROOT = new URL("../../..", import.meta.url).pathname;
const ACERVO = path.join(ROOT, "media/news/youtube-acervo");
const SEL = path.join(ROOT, "scripts/news/youtube/_selecao.json");
fs.mkdirSync(ACERVO, { recursive: true });

function run(args) {
  return new Promise((resolve) => {
    const c = spawn("yt-dlp", args);
    let out = "", err = "";
    c.stdout.on("data", (d) => (out += d));
    c.stderr.on("data", (d) => (err += d));
    c.on("error", (e) => resolve({ code: -1, out, err: err + e.message }));
    c.on("close", (code) => resolve({ code, out, err }));
  });
}

/* ---------- parse VTT (portado do baixa-clipehz/legendas.mjs) ---------- */
function paraSegundos(t) {
  const m = t.trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{2})[.,](\d{1,3})$/);
  return m ? (Number(m[1] || 0) * 3600) + (Number(m[2]) * 60) + Number(m[3]) + Number(m[4]) / 1000 : null;
}
function limparInline(s) {
  return s.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">").replace(/&#39;|&apos;/gi, "'").replace(/&quot;/gi, '"').replace(/\s+/g, " ").trim();
}
function palavrasComTempo(bruto, ini, fim) {
  const partes = bruto.split(/<(\d{1,2}:\d{2}:\d{2}[.,]\d{1,3})>/);
  const saida = []; let t = ini;
  for (let i = 0; i < partes.length; i++) {
    if (i % 2 === 1) { const s = paraSegundos(partes[i]); if (s != null) t = s; continue; }
    for (const w of limparInline(partes[i]).split(/\s+/).filter(Boolean)) saida.push({ w, t });
  }
  if (partes.length <= 1 && saida.length > 1) {
    const passo = (Math.max(fim, ini) - ini) / saida.length;
    saida.forEach((p, i) => { p.t = ini + passo * i; });
  }
  return saida;
}
function parseLegenda(txt) {
  const linhas = txt.replace(/\r/g, "").split("\n"); const cues = []; let atual = null;
  const TS = /([\d:.,]+)\s*-->\s*([\d:.,]+)/;
  for (const ln of linhas) {
    const m = ln.match(TS);
    if (m) { const ini = paraSegundos(m[1]), fim = paraSegundos(m[2]);
      if (ini != null) { if (atual && atual.partes.length && /^\d+$/.test(atual.partes.at(-1).trim())) atual.partes.pop();
        atual = { ini, fim: fim ?? ini, partes: [] }; cues.push(atual); } continue; }
    if (!atual) continue;
    if (/^\s*$/.test(ln)) continue;
    if (/^(WEBVTT|Kind:|Language:|NOTE|STYLE|X-TIMESTAMP)/i.test(ln)) continue;
    atual.partes.push(ln);
  }
  return cues.map((c) => ({ ini: c.ini, fim: c.fim, palavras: palavrasComTempo(c.partes.join(" "), c.ini, c.fim), texto: limparInline(c.partes.join(" ")) })).filter((c) => c.texto);
}
const norm = (w) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
function juntarPalavras(cues) {
  const palavras = [];
  for (const c of cues) {
    const novas = (c.palavras && c.palavras.length) ? c.palavras : c.texto.split(/\s+/).filter(Boolean).map((w) => ({ w, t: c.ini }));
    if (!novas.length) continue;
    const janela = Math.min(palavras.length, 24, novas.length); let over = 0;
    for (let k = janela; k > 0; k--) { let bate = true;
      for (let i = 0; i < k; i++) if (norm(palavras[palavras.length - k + i].w) !== norm(novas[i].w)) { bate = false; break; }
      if (bate) { over = k; break; } }
    for (let i = over; i < novas.length; i++) palavras.push(novas[i]);
  }
  return palavras;
}
function pontuar(t) { t = t.trim(); if (!t) return t; t = t[0].toUpperCase() + t.slice(1); if (!/[.!?…:]$/.test(t)) t += "."; return t; }
function emParagrafos(palavras, fronteiras = []) {
  const paras = []; const marcos = [...fronteiras].filter((t) => t > 0).sort((a, b) => a - b);
  let prox = marcos.shift() ?? Infinity; let buf = [], ini = palavras[0]?.t || 0, ult = ini;
  const fecha = () => { if (buf.length) { paras.push({ ini, texto: pontuar(buf.join(" ")) }); buf = []; } };
  for (const p of palavras) {
    while (p.t >= prox) { if (buf.length) { fecha(); ini = p.t; } prox = marcos.shift() ?? Infinity; }
    if (buf.length) { const pausa = p.t - ult; const fim = /[.!?…]["')\]]?$/.test(buf.at(-1));
      if ((pausa >= 1.4 && buf.length >= 45) || (pausa >= 0.7 && buf.length >= 85) || (fim && buf.length >= 55) || buf.length >= 130) { fecha(); ini = p.t; }
    } else ini = p.t;
    buf.push(p.w); ult = p.t;
  }
  fecha(); return paras;
}

/* ---------- extração ---------- */
async function extrai(v) {
  const r = await run(["-J", "--no-warnings", v.url]);
  if (r.code !== 0) return { id: v.id, erro: "info: " + (r.err.split("\n").filter(Boolean).at(-1) || "falha") };
  const info = JSON.parse(r.out);
  const autos = info.automatic_captions || {}, oficiais = info.subtitles || {};
  // idioma original: info.language -> en -> primeiro oficial -> primeiro auto (sem -orig, sem live_chat)
  const langsAuto = Object.keys(autos).filter((l) => !/-orig$/.test(l) && !l.startsWith("live_chat"));
  const cand = [info.language, "en", ...Object.keys(oficiais), ...langsAuto].filter(Boolean);
  const dir = path.join(ACERVO, "_vtt"); fs.mkdirSync(dir, { recursive: true });
  for (const lang of cand) {
    const oficial = !!oficiais[lang];
    const alvo = path.join(dir, `${v.id}.${lang}`);
    await run(["--skip-download", oficial ? "--write-subs" : "--write-auto-subs", "--sub-langs", lang,
      "--sub-format", "vtt/srt/best", "--no-warnings", "-o", alvo + ".%(ext)s", v.url]);
    const f = fs.readdirSync(dir).find((x) => x.startsWith(`${v.id}.${lang}.`) && /\.(vtt|srt)$/i.test(x));
    if (!f) continue;
    const cues = parseLegenda(fs.readFileSync(path.join(dir, f), "utf8"));
    if (!cues.length) continue;
    const palavras = juntarPalavras(cues);
    const chapters = (info.chapters || []).map((c) => ({ ini: c.start_time, titulo: c.title }));
    const paras = emParagrafos(palavras, chapters.map((c) => c.ini));
    return {
      id: v.id, titulo: info.title, canal: info.uploader || info.channel || "",
      publicado: info.upload_date || null, duracao: info.duration || 0, url: info.webpage_url || v.url,
      lang, oficial, palavras: palavras.length, descricao: (info.description || "").slice(0, 1500),
      capitulos: chapters, paragrafos: paras,
    };
  }
  return { id: v.id, erro: "sem legenda utilizavel" };
}

const only = (() => { const i = process.argv.indexOf("--only"); return i >= 0 ? process.argv[i + 1] : null; })();
const sel = JSON.parse(fs.readFileSync(SEL, "utf8")).filter((v) => !only || v.id === only);
console.log(`extraindo ${sel.length} video(s)...\n`);
for (const v of sel) {
  const out = await extrai(v);
  if (out.erro) { console.log(`  x ${v.id}  ${out.erro}  (${v.title.slice(0, 40)})`); continue; }
  fs.writeFileSync(path.join(ACERVO, `${out.id}.json`), JSON.stringify(out, null, 2));
  console.log(`  ok ${out.id}  [${out.lang}${out.oficial ? "" : " auto"}] ${out.palavras}pal ${out.paragrafos.length}par  ${out.titulo.slice(0, 42)}`);
}
console.log(`\nacervo: ${ACERVO}`);
