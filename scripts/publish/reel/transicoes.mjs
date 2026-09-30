// Transições do reel (flag REEL_TRANSICOES=1): em cada troca de cena entra um
// trecho curto de clipe (acervo media/reels-clips/transicoes/, sempre mudo),
// POR CIMA do vídeo pronto. Não muda a duração: a narração segue sincronizada.
// Falhou ou acervo vazio = o reel sai sem transição (nunca derruba a publicação).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

export const PASTA = path.resolve("media/reels-clips/transicoes");
export const DUR = 0.7; // segundos de clipe em cada troca
const FADE = 0.08;
// Recorte vertical 9:16; foco (0 a 1, vindo do baixa-clipehz) = onde a ação está na horizontal.
export const recorte = (foco) => `crop=ih*9/16:ih:x=(iw-ih*9/16)*${Number.isFinite(foco) ? Math.min(1, Math.max(0, foco)) : 0.5}`;

export function carregarTransicoes(pasta = PASTA) {
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(pasta, "transicoes.json"), "utf8"));
    return (doc.transicoes || []).filter((t) => fs.existsSync(path.join(pasta, t.file))).map((t) => ({ ...t, arq: path.join(pasta, t.file) }));
  } catch { return []; }
}

// Um trecho por troca de cena, em rodízio determinístico pela semana (sem repetir
// enquanto houver trecho novo). Trocas = início de cada cena menos a primeira.
export function planejarTransicoes(scenes, lista, semente = "") {
  if (!lista.length) return [];
  let h = 0;
  for (const ch of String(semente)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return scenes.slice(1).map((s, i) => ({ t: Math.max(0, s.start - DUR / 2), trecho: lista[(h + i) % lista.length] }));
}

export function filtroFfmpeg(plano) {
  const partes = [];
  let base = "[0:v]";
  plano.forEach(({ t, trecho }, i) => {
    const ini = Math.max(0, ((trecho.dur || DUR) - DUR) / 2); // miolo do trecho, onde tem mais ação
    const fim = (t + DUR).toFixed(3);
    partes.push(`[${i + 1}:v]trim=${ini.toFixed(3)}:${(ini + DUR).toFixed(3)},setpts=PTS-STARTPTS+${t.toFixed(3)}/TB,` +
      `${recorte(trecho.foco)},scale=1080:1920,setsar=1,format=yuva420p,` +
      `fade=in:st=${t.toFixed(3)}:d=${FADE}:alpha=1,fade=out:st=${(t + DUR - FADE).toFixed(3)}:d=${FADE}:alpha=1[t${i}]`);
    const saida = i === plano.length - 1 ? "[v]" : `[b${i}]`;
    partes.push(`${base}[t${i}]overlay=eof_action=pass:enable='between(t,${t.toFixed(3)},${fim})'${saida}`);
    base = saida;
  });
  return partes.join(";");
}

// Aplica e devolve quantas transições entraram (0 = nada feito, vídeo intacto).
export function aplicarTransicoes(videoPath, { scenes, semente, lista = carregarTransicoes() }) {
  const plano = planejarTransicoes(scenes, lista, semente);
  if (!plano.length) return 0;
  const tmp = videoPath.replace(/\.mp4$/, ".trans.mp4");
  const args = ["-v", "error", "-y", "-i", videoPath, ...plano.flatMap((p) => ["-i", p.trecho.arq]),
    "-filter_complex", filtroFfmpeg(plano), "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "20",
    "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tmp];
  const r = spawnSync("ffmpeg", args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) { fs.rmSync(tmp, { force: true }); throw new Error((r.stderr || "").split("\n").slice(-3).join(" ")); }
  fs.renameSync(tmp, videoPath);
  return plano.length;
}

// Abertura com clipe: sequência rápida de N trechos de 0,9 s, em 9:16 e mudo. O trecho
// marcado com "capa" (segundo do melhor quadro) cai no slot da capa do reel, com o quadro
// exato em CAPA_S. Os outros não repetem o da 1a transição, que vem logo depois.
export const CAPA_S = 2.4;
const SLOT = 0.9;
export function trechosDaAbertura(lista, semente = "", n = 4) {
  if (!lista.length) return [];
  let h = 0;
  for (const ch of String(semente)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const capas = lista.filter((t) => Number.isFinite(t.capa));
  const capa = capas.length ? capas[h % capas.length] : null;
  const resto = lista.filter((t) => t !== capa);
  const qtd = Math.min(n - (capa ? 1 : 0), Math.max(1, resto.length - 1));
  const sel = Array.from({ length: qtd }, (_, i) => resto[(h + 1 + i) % resto.length]);
  const slotCapa = Math.floor(CAPA_S / SLOT); // slot que contém o instante da capa
  if (capa) sel.splice(Math.min(slotCapa, sel.length), 0, { ...capa, iniAbertura: Math.max(0, capa.capa - (CAPA_S - slotCapa * SLOT)) });
  return sel;
}

export function montarAbertura(tmpDir, { semente, lista = carregarTransicoes() } = {}) {
  const trechos = trechosDaAbertura(lista, semente);
  if (!trechos.length) return null;
  const saida = path.join(tmpDir, "abertura-clipe.mp4");
  // 0,9 s de cada trecho (miolo, ou o ponto da capa): 4 trechos cabem na abertura (~3 a 4 s)
  const f = trechos.map((t, i) => { const ini = (t.iniAbertura ?? Math.max(0, ((t.dur || 1.5) - SLOT) / 2)).toFixed(2);
    return `[${i}:v]trim=${ini}:${(+ini + SLOT).toFixed(2)},setpts=PTS-STARTPTS,${recorte(t.foco)},scale=1080:1920,setsar=1,fps=30[a${i}]`; }).join(";") +
    ";" + trechos.map((_, i) => `[a${i}]`).join("") + `concat=n=${trechos.length}:v=1:a=0[v]`;
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...trechos.flatMap((t) => ["-i", t.arq]), "-filter_complex", f,
    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", saida], { encoding: "utf8" });
  return r.status === 0 ? saida : null;
}

// Capa do reel (thumb_offset) com abertura de clipe: quadro da abertura já com a marca
// e "as notícias da semana" montados, sobre o clipe (chama mais clique que a manchete).
export const capaNaAbertura = (coldDur) => Math.round(Math.min(CAPA_S, Math.max(1.8, coldDur - 0.6)) * 1000);
