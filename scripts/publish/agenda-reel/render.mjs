// Reel "Agenda da semana" AUTOMÁTICO: o desenho aprovado do Claude Design (media/agenda/reel-design/, 4 layouts x
// 3 paletas, rodízio por semana ISO) fotografado quadro a quadro no Chrome headless por cima das covers, com corte da
// banda antes de cada show, narração e trilha própria. Mapa da pasta no README.md daqui.
// Uso: node scripts/publish/agenda-reel/render.mjs --inicio 2026-11-24 [--layout A --paleta azul] [--saida x.mp4]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { semanaDoReel, estiloDaSemana, semanaIso } from "./semana.mjs";
import { montarTempos, tempoDesign, marcasDeAudio } from "./tempos.mjs";
import { falasDoReel } from "./falas.mjs";
import { gravarFalas } from "./voz.mjs";
import { planoDoFundo, renderizarFundo } from "./fundo.mjs";
import { montarAudio } from "./audio.mjs";
import { abrirReel } from "./quadros.mjs";

const FPS = 30;

export async function renderizarReelAgenda({ inicio, saida, layout, paleta, env = process.env, tmpDir } = {}) {
  const weekKey = semanaIso(inicio);
  const estilo = { ...estiloDaSemana(weekKey, env), ...(layout ? { layout } : {}), ...(paleta ? { paleta } : {}) };
  const { shows, week, logos } = semanaDoReel(inicio);
  if (!shows.length) return { pulou: "nenhum show de terça a domingo" };
  const tmp = tmpDir || fs.mkdtempSync(path.join(os.tmpdir(), "agenda-reel-"));

  // 1) narração (define quanto dura cada cena)
  const narr = await gravarFalas(falasDoReel(shows), { tmpDir: tmp, env });
  const durFala = Object.fromEntries((narr.falas || []).map((f) => [f.chave, f.dur]));
  // 2) linha do tempo: dias do Design + corte da banda (só de banda com trecho de vídeo)
  const dias = [...new Set(shows.map((s) => s.data))].map((data) => {
    const doDia = week.shows.filter((s) => s.data === data);
    return { data, n: doDia.length, punch: doDia.map((s) => !s.semClipe) };
  });
  const tempos = montarTempos(dias, durFala);
  const scenes = tempos.cenas.map((c) => ({ name: c.nome, dur: c.dur, desc: "" }));
  // 3) fundo (covers) e som
  const fundo = renderizarFundo(planoDoFundo(tempos, shows, { semente: weekKey }), path.join(tmp, "fundo.mp4"));
  const som = montarAudio({ marcas: marcasDeAudio(tempos), falas: narr.falas, total: tempos.total, semente: `agenda-${inicio}`,
    saida: path.join(tmp, "audio.m4a"), trilhaSaida: path.join(tmp, "trilha.m4a"), env });
  // 4) desenho do Design quadro a quadro por cima
  const reel = await abrirReel({ week, scenes, logos, ...estilo });
  if (Math.abs(reel.duracao - tempos.totalDesign) > 0.05) { reel.fechar(); throw new Error(`Design com ${reel.duracao}s, esperado ${tempos.totalDesign}s`); }
  const destino = saida || path.join(tmp, `agenda-${weekKey}.mp4`);
  const nQuadros = Math.round(tempos.total * FPS);
  const ff = spawn("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "png", "-i", "-",
    "-i", fundo, "-i", som.saida, "-filter_complex", "[1:v][0:v]overlay=format=auto:shortest=1,format=yuv420p[v]",
    "-map", "[v]", "-map", "2:a", "-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p", "-b:v", "8M", "-maxrate", "10M",
    "-bufsize", "16M", "-c:a", "copy", "-movflags", "+faststart", "-t", tempos.total.toFixed(3), destino], { stdio: ["pipe", "inherit", "inherit"] });
  const fim = new Promise((ok, erro) => ff.on("close", (c) => (c ? erro(new Error(`ffmpeg final saiu com ${c}`)) : ok())));
  const escrever = (buf) => new Promise((ok) => (ff.stdin.write(buf) ? ok() : ff.stdin.once("drain", ok)));
  let vazio = null;
  try {
    for (let i = 0; i < nQuadros; i++) {
      const T = tempoDesign(tempos.segs, i / FPS);
      if (T == null) vazio ||= await transparente(reel);
      await escrever(T == null ? vazio : await reel.quadro(T));
      if (i % 150 === 0) console.log(`[agenda-reel] quadro ${i}/${nQuadros}`);
    }
  } finally { ff.stdin.end(); reel.fechar(); }
  await fim;
  const erros = reel.erros();
  if (erros.length) console.warn(`[agenda-reel] avisos da página: ${erros.slice(0, 3).join(" | ")}`);
  console.log(`[agenda-reel] ${destino} | ${tempos.total.toFixed(1)} s | ${estilo.layout}/${estilo.paleta} | ${narr.aviso} | trilha ${som.trilha}`);
  return { arquivo: destino, weekKey, ...estilo, duracao: tempos.total, shows, aviso: narr.aviso };
}

// Quadro vazio (transparente) pro corte da banda: só o clipe aparece.
async function transparente() {
  const sharp = (await import("sharp")).default;
  return sharp({ create: { width: 1080, height: 1920, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).png().toBuffer();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const arg = (n) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
  const inicio = arg("inicio");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inicio || "")) { console.error("uso: render.mjs --inicio AAAA-MM-DD (terça) [--layout A-D] [--paleta amarelo|laranja|azul] [--saida x.mp4]"); process.exit(1); }
  renderizarReelAgenda({ inicio, saida: arg("saida") && path.resolve(arg("saida")), layout: arg("layout"), paleta: arg("paleta") })
    .then((r) => { if (r.pulou) console.log(`[agenda-reel] pulou: ${r.pulou}`); })
    .catch((e) => { console.error(e); process.exit(1); });
}
