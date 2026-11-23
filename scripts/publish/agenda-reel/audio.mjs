// Som do reel da agenda (mesma mistura da prévia aprovada, reels-especiais/agenda-semana/design/montar.mjs):
// fala de cada cena 0,15 s depois do início, whoosh em cada corte, trilha própria baixa por baixo, -14 LUFS.
import { spawnSync } from "node:child_process";
import { naRaiz } from "../../config.mjs";
import { trilhaPropria } from "../trilha/ligar.mjs";

export const WHOOSH = naRaiz("media/agenda/voz/whoosh.mp3");

// marcas = marcasDeAudio(tempos); falas = [{ chave, arquivo }] (vazio = só música).
export function montarAudio({ marcas, falas = [], total, semente, saida, trilhaSaida, env = process.env }) {
  const trilha = trilhaPropria({ uso: "reel", semente, plano: [{ de: 0, ate: total, nivel: "cheio" }], duracao: total,
    saida: trilhaSaida, env: { ...env, TRILHA_PROPRIA: "1" } });
  if (!trilha) throw new Error("trilha própria não montou");
  const ins = [], f = [], ent = [];
  const comFala = falas.map((fa) => ({ ...fa, em: marcas.falas.find((m) => m.chave === fa.chave)?.em })).filter((fa) => fa.em != null);
  comFala.forEach((fa, i) => {
    ins.push("-i", fa.arquivo);
    const ms = Math.round(fa.em * 1000);
    f.push(`[${i}:a]adelay=${ms}|${ms},aformat=channel_layouts=stereo[f${i}]`); ent.push(`[f${i}]`);
  });
  const iT = comFala.length;
  ins.push("-i", trilha.path);
  f.push(`[${iT}:a]volume=0.25,afade=t=out:st=${(total - 1.2).toFixed(2)}:d=1.2[m]`); ent.push("[m]");
  marcas.whoosh.forEach((t, j) => {
    ins.push("-i", WHOOSH);
    const ms = Math.round(Math.max(0, t - 0.25) * 1000);
    f.push(`[${iT + 1 + j}:a]volume=0.5,adelay=${ms}|${ms},aformat=channel_layouts=stereo[w${j}]`); ent.push(`[w${j}]`);
  });
  f.push(`${ent.join("")}amix=inputs=${ent.length}:duration=longest:normalize=0,atrim=0:${total.toFixed(3)},loudnorm=I=-14:TP=-1.5[a]`);
  const r = spawnSync("ffmpeg", ["-y", "-hide_banner", "-loglevel", "error", ...ins, "-filter_complex", f.join(";"), "-map", "[a]",
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100", "-t", total.toFixed(3), saida], { stdio: "inherit" });
  if (r.status) throw new Error("ffmpeg do áudio falhou");
  return { saida, trilha: trilha.name };
}
