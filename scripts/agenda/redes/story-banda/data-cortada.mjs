// A data vem do story diário: "Hoje é dez de outubro, e tem novidade do Pearl Jam." Corta na primeira pausa (a vírgula)
// e fica só "Hoje é dez de outubro". Sem pausa achada: null (o story sai sem a frase da data, a data está na tela).
import path from "node:path";
import { spawnSync } from "node:child_process";

export function primeiraPausa(saidaSilencedetect, depoisDe = 0.8) {
  const ini = [...String(saidaSilencedetect).matchAll(/silence_start: ([\d.]+)/g)].map((m) => +m[1]);
  return ini.find((t) => t > depoisDe) ?? null;
}

export function cortarData(arquivo, pastaTmp) {
  if (!arquivo) return null;
  const det = spawnSync("ffmpeg", ["-hide_banner", "-i", arquivo, "-af", "silencedetect=n=-35dB:d=0.18", "-f", "null", "-"]);
  const corte = primeiraPausa(det.stderr.toString());
  if (!corte || corte > 3) return null;
  const destino = path.join(pastaTmp, `data-${path.basename(arquivo)}`);
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", arquivo, "-t", String(corte + 0.02),
    "-af", `afade=t=out:st=${Math.max(0, corte - 0.08)}:d=0.1`, destino]);
  return r.status === 0 ? destino : null;
}
