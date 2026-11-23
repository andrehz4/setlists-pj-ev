// Trilha de vídeo que fica POR BAIXO do desenho do Design: cortes do Pearl Jam na abertura, trechos das covers nos
// dias (cada show com a sua banda) e o corte da banda em tela cheia antes de cada show. Mapa e fecho têm fundo
// próprio no Design (opaco), então ali vai preto. Clipes sempre mudos (o som é trilha própria + narração).
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { carregarTransicoes, recorte } from "../reel/transicoes.mjs";
import { materializar } from "../reel/acervo-r2.mjs";
import { trechosAprovados, arquivoDa } from "./covers-r2.mjs";

// Abertura aprovada em 22/11 (os mesmos 4 cortes da prévia).
export const ABERTURA_PJ = ["even-flow-stage-dive.mp4", "even-flow-bateria-cabelo.mp4", "alive-acao11.mp4", "alive-t11.mp4"];
const PEDACO = 2.4; // máximo de um trecho de cover na tela
const hash = (s) => parseInt(crypto.createHash("sha1").update(s).digest("hex").slice(0, 8), 16);

// Trechos bons da banda (nota 3+, sem marca de terceiros), close primeiro; rodízio por semana (mesma semana = mesmo reel).
export function filaDaBanda(conta, semente, aprovados = trechosAprovados) {
  const lista = aprovados(conta).filter((c) => (c.nota || 0) >= 3 && !(c.tags || []).some((t) => String(t).startsWith("marca:")))
    .sort((a, b) => (b.broll?.plano === "close") - (a.broll?.plano === "close") || (b.nota || 0) - (a.nota || 0) || a.file.localeCompare(b.file));
  if (!lista.length) return lista;
  const k = hash(`${semente}|${conta}`) % lista.length;
  return [...lista.slice(k), ...lista.slice(0, k)];
}

// Plano de pedaços: [{ dur, fonte: { tipo: "pj"|"cover"|"preto", trecho } }] cobrindo o vídeo inteiro, em ordem.
export function planoDoFundo({ segs }, shows, { semente, aprovados = trechosAprovados, abertura = ABERTURA_PJ } = {}) {
  const porCena = new Map();
  for (const s of shows) (porCena.get(s.data) || porCena.set(s.data, []).get(s.data)).push(s);
  const filas = new Map(), usados = new Set();
  const proximo = (conta, durMin, preferirClose) => {
    if (!filas.has(conta)) filas.set(conta, filaDaBanda(conta, semente, aprovados));
    const f = filas.get(conta);
    const ok = (c) => !usados.has(c.file) && (c.dur || 0) >= Math.min(durMin, 2);
    const c = (preferirClose && f.find((x) => ok(x) && x.broll?.plano === "close")) || f.find(ok) || f[0];
    if (c) usados.add(c.file);
    return c || null;
  };
  const pedacos = [];
  for (const s of segs) {
    const d = s.tipo === "punch" ? s.dur : s.ate - s.de;
    if (s.cena === "Abertura") {
      abertura.forEach((file) => pedacos.push({ dur: d / abertura.length, fonte: { tipo: "pj", file } }));
      continue;
    }
    const show = s.data ? porCena.get(s.data)?.[s.show] : null;
    if (!show) { pedacos.push({ dur: d, fonte: { tipo: "preto" } }); continue; }
    if (s.tipo === "punch") { pedacos.push({ dur: d, fonte: { tipo: "cover", trecho: proximo(show.banda, d, true) } }); continue; }
    const n = Math.max(1, Math.ceil(d / PEDACO));
    for (let k = 0; k < n; k++) {
      const trecho = proximo(show.banda, d / n, false);
      pedacos.push({ dur: d / n, fonte: trecho ? { tipo: "cover", trecho } : { tipo: "preto" } });
    }
  }
  return pedacos;
}

// Renderiza o plano num MP4 mudo 1080x1920 30 fps. Trecho que não baixar vira preto (o reel não cai por um clipe).
export function renderizarFundo(pedacos, saida) {
  const pj = materializar(carregarTransicoes().filter((t) => pedacos.some((p) => p.fonte.file === t.file)));
  const ins = [], f = [];
  pedacos.forEach((p, i) => {
    const D = p.dur.toFixed(3);
    let arq = null, vf = "scale=1080:1920";
    if (p.fonte.tipo === "pj") { const t = pj.find((x) => x.file === p.fonte.file); if (t) { arq = t.arq; vf = `${recorte(t)},scale=1080:1920`; } }
    if (p.fonte.tipo === "cover" && p.fonte.trecho) arq = arquivoDa(p.fonte.trecho);
    if (arq) {
      ins.push("-ss", "0.05", "-t", D, "-an", "-i", arq);
      f.push(`[${ins.filter((x) => x === "-i").length - 1}:v]${vf},fps=30,setsar=1,tpad=stop_mode=clone:stop_duration=3,trim=duration=${D},setpts=PTS-STARTPTS,format=yuv420p[p${i}]`);
    } else f.push(`color=black:s=1080x1920:r=30:d=${D},setsar=1,format=yuv420p[p${i}]`);
  });
  f.push(`${pedacos.map((_, i) => `[p${i}]`).join("")}concat=n=${pedacos.length}:v=1:a=0[v]`);
  const total = pedacos.reduce((a, p) => a + p.dur, 0);
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...ins, "-filter_complex", f.join(";"), "-map", "[v]",
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "16", "-pix_fmt", "yuv420p", "-r", "30", "-t", total.toFixed(3), saida], { stdio: "inherit" });
  if (r.status) throw new Error("ffmpeg do fundo falhou");
  return saida;
}
