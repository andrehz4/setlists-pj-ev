// Transições do reel (flag REEL_TRANSICOES=1): em cada troca de cena entra um
// trecho curto de clipe (acervo media/reels-clips/transicoes/, sempre mudo),
// POR CIMA do vídeo pronto. Não muda a duração: a narração segue sincronizada.
// Falhou ou acervo vazio = o reel sai sem transição (nunca derruba a publicação).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { materializar } from "./acervo-r2.mjs";

export const PASTA = path.resolve("media/reels-clips/transicoes");
export const DUR = 0.7; // segundos de clipe em cada troca
const FADE = 0.08;
// Recorte vertical 9:16. foco (0 a 1, do baixa-clipehz) = onde a ação está na horizontal.
// focoTrilha [{t, foco}] (rastreio de rosto do baixa) = o recorte anda junto, interpolado
// entre os pontos; t é o tempo DENTRO do corte (por isso o crop vem antes do setpts).
const lim = (f) => Math.min(1, Math.max(0, f));
export function exprFoco(trilha) {
  const p = trilha.filter((k) => Number.isFinite(k.t) && Number.isFinite(k.foco)).sort((a, b) => a.t - b.t);
  let e = lim(p.at(-1).foco).toFixed(3);
  for (let i = p.length - 2; i >= 0; i--) {
    const [a, b] = [p[i], p[i + 1]];
    const lerp = `${lim(a.foco).toFixed(3)}+(${(lim(b.foco) - lim(a.foco)).toFixed(3)})*(t-${a.t})/${Math.max(0.001, b.t - a.t)}`;
    e = `if(lt(t\\,${b.t})\\,${lerp}\\,${e})`;
  }
  return p[0].t > 0 ? `if(lt(t\\,${p[0].t})\\,${lim(p[0].foco).toFixed(3)}\\,${e})` : e;
}
export const recorte = (trecho = {}) => {
  const trilha = Array.isArray(trecho.focoTrilha) && trecho.focoTrilha.length >= 2 ? trecho.focoTrilha : null;
  const f = trilha ? exprFoco(trilha) : (Number.isFinite(trecho.foco) ? lim(trecho.foco) : 0.5);
  return `crop=ih*9/16:ih:x=(iw-ih*9/16)*(${f})`;
};

export function carregarTransicoes(pasta = PASTA) {
  try {
    const doc = JSON.parse(fs.readFileSync(path.join(pasta, "transicoes.json"), "utf8"));
    // arq = MP4 local quando existe (Mac); senão null e o materializar baixa do R2 só os sorteados
    return (doc.transicoes || []).map((t) => ({ ...t, arq: fs.existsSync(path.join(pasta, t.file)) ? path.join(pasta, t.file) : null }));
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
    partes.push(`[${i + 1}:v]trim=${ini.toFixed(3)}:${(ini + DUR).toFixed(3)},${recorte(trecho)},` +
      `setpts=PTS-STARTPTS+${t.toFixed(3)}/TB,scale=1080:1920,setsar=1,format=yuva420p,` +
      `fade=in:st=${t.toFixed(3)}:d=${FADE}:alpha=1,fade=out:st=${(t + DUR - FADE).toFixed(3)}:d=${FADE}:alpha=1[t${i}]`);
    const saida = i === plano.length - 1 ? "[v]" : `[b${i}]`;
    partes.push(`${base}[t${i}]overlay=eof_action=pass:enable='between(t,${t.toFixed(3)},${fim})'${saida}`);
    base = saida;
  });
  return partes.join(";");
}

// Aplica e devolve quantas transições entraram (0 = nada feito, vídeo intacto).
// capaInicioS: copia o quadro desse instante (a capa no auge) pro 1o quadro do vídeo,
// que é o que aparece com o vídeo parado.
export function aplicarTransicoes(videoPath, { scenes, semente, capaInicioS = null, lista = carregarTransicoes() }) {
  const sorteados = planejarTransicoes(scenes, lista, semente);
  const ok = new Set(materializar(sorteados.map((p) => p.trecho)));
  const plano = sorteados.filter((p) => ok.has(p.trecho));
  if (!plano.length) return 0;
  const tmp = videoPath.replace(/\.mp4$/, ".trans.mp4");
  let filtro = filtroFfmpeg(plano);
  const extra = [];
  if (Number.isFinite(capaInicioS)) {
    const png = videoPath.replace(/\.mp4$/, ".capa.png");
    if (spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(capaInicioS), "-i", videoPath, "-frames:v", "1", png]).status === 0) {
      extra.push("-i", png);
      filtro = filtro.replace(/\[v\]$/, "[vt]") + `;[vt][${plano.length + 1}:v]overlay=enable='lt(n,1)'[v]`;
    }
  }
  const args = ["-v", "error", "-y", "-i", videoPath, ...plano.flatMap((p) => ["-i", p.trecho.arq]), ...extra,
    "-filter_complex", filtro, "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-crf", "20",
    "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tmp];
  const r = spawnSync("ffmpeg", args, { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) { fs.rmSync(tmp, { force: true }); throw new Error((r.stderr || "").split("\n").slice(-3).join(" ")); }
  fs.renameSync(tmp, videoPath);
  fs.rmSync(videoPath.replace(/\.mp4$/, ".capa.png"), { force: true });
  return plano.length;
}

// Abertura com clipe, na duração exata dela (com voz até ~4 s, sem voz 3 s), 9:16 e mudo.
// - Tem capa feita à mão (o Andre corta começo, meio e fim; todo quadro serve): a abertura
//   É esse clipe, do começo. Se a abertura passar do clipe, segura o último quadro.
// - Sem capa: sequência rápida de N trechos iguais (não repete o da 1a transição).
export const CAPA_S = 2.4;
export function trechosDaAbertura(lista, semente = "", { dur = 3, n = 4 } = {}) {
  if (!lista.length) return [];
  let h = 0;
  for (const ch of String(semente)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const capas = lista.filter((t) => Number.isFinite(t.capa));
  if (capas.length) return [{ ...capas[h % capas.length], iniAbertura: 0, slot: dur }];
  const qtd = Math.min(n, Math.max(1, lista.length - 1));
  return Array.from({ length: qtd }, (_, i) => ({ ...lista[(h + 1 + i) % lista.length], slot: dur / qtd }));
}

export function montarAbertura(tmpDir, { semente, dur = 3, lista = carregarTransicoes() } = {}) {
  const trechos = materializar(trechosDaAbertura(lista, semente, { dur }));
  if (!trechos.length) return null;
  const saida = path.join(tmpDir, "abertura-clipe.mp4");
  // cada trecho com o tamanho do slot (do começo se for a capa); tpad segura o último quadro
  const f = trechos.map((t, i) => {
    const ini = (t.iniAbertura ?? Math.max(0, ((t.dur || 1.5) - t.slot) / 2)).toFixed(3);
    return `[${i}:v]trim=${ini}:${(+ini + t.slot).toFixed(3)},${recorte(t)},setpts=PTS-STARTPTS,` +
      `tpad=stop_mode=clone:stop_duration=1,trim=0:${t.slot.toFixed(3)},scale=1080:1920,setsar=1,fps=30[a${i}]`;
  }).join(";") + ";" + trechos.map((_, i) => `[a${i}]`).join("") + `concat=n=${trechos.length}:v=1:a=0[v]`;
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...trechos.flatMap((t) => ["-i", t.arq]), "-filter_complex", f,
    "-map", "[v]", "-an", "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", saida], { encoding: "utf8" });
  return r.status === 0 ? saida : null;
}

// Capa do reel (thumb_offset) com abertura de clipe: quadro da abertura já com a marca
// e "as notícias da semana" montados, sobre o clipe (chama mais clique que a manchete).
export const capaNaAbertura = (coldDur) => Math.round(Math.min(CAPA_S, Math.max(1.8, coldDur - 0.6)) * 1000);
