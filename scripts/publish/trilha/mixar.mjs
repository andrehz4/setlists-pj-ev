// Mixa as pistas da cama seguindo o plano de níveis (ffmpeg): cada família ganha um envelope de volume no tempo.
// Subida para o cheio é seca (golpe, 60 ms); descida é suave (600 ms). Normaliza em -16 LUFS como a trilha antiga.
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { NIVEIS } from "./kit.mjs";

const SUBIDA = 0.06;
const DESCIDA = 0.6;
const MAGRO_DB = -6;                       // parte calma mais baixa que o médio: abre espaço para o golpe
const MELODICAS = ["teclado", "sintetizador", "cordas", "guitarra"];   // ordem de preferência no magro
const db2lin = (db) => (db == null ? 0 : Math.pow(10, db / 20));

export function familiaBase(chave) {
  return chave.split("-")[0];
}

// Pontos (t, ganho linear) da família ao longo do plano. `magro` = família que segura as partes calmas.
export function envelope(familia, plano, duracao, magro = "teclado") {
  const ganho = (nivel) => db2lin(nivel === "magro" ? (familia === magro ? MAGRO_DB : null) : NIVEIS[nivel][familia] ?? null);
  const pts = [[0, ganho(plano[0].nivel)]];
  for (let i = 1; i < plano.length; i++) {
    const de = ganho(plano[i - 1].nivel), para = ganho(plano[i].nivel), t = plano[i].de;
    if (de === para) continue;
    const rampa = para > de ? SUBIDA : DESCIDA;
    pts.push([t, de], [t + rampa, para]);
  }
  const fimFade = Math.max(duracao - 1.2, 0);
  const ultimo = pts[pts.length - 1][1];
  pts.push([fimFade, ultimo], [duracao, 0]);
  return pts.sort((a, b) => a[0] - b[0]);
}

// Expressão do filtro volume do ffmpeg a partir dos pontos (interpolação linear por trecho).
export function expressao(pts) {
  const partes = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const [a, ga] = pts[i], [b, gb] = pts[i + 1];
    if (b <= a) continue;
    partes.push(`between(t,${a.toFixed(3)},${b.toFixed(3)})*(${ga.toFixed(4)}+(${(gb - ga).toFixed(4)})*(t-${a.toFixed(3)})/${(b - a).toFixed(3)})`);
  }
  return `min(${partes.join("+")},1.5)`;
}

const pistasDa = (cama) => Object.entries(cama.pistas).filter(([k]) => NIVEIS.cheio[familiaBase(k)] !== undefined);

// Primeiro início (da lista) em que alguma família melódica toca em todos os trechos calmos do plano.
export function escolherJanela(cama, plano, candidatos) {
  let melhor = null;
  for (const inicio of candidatos) {
    const m = escolherMagro(pistasDa(cama), plano, inicio);
    if (m.pior > -40) return { inicio, magro: m.fam };
    if (!melhor || m.pior > melhor.pior) melhor = { inicio, magro: m.fam, pior: m.pior };
  }
  return melhor;
}

export function montarTrilha({ cama, plano, inicio, magro, duracao, saida }) {
  const pistas = pistasDa(cama);
  const args = ["-v", "error", "-y"];
  pistas.forEach(([, p]) => args.push("-ss", inicio.toFixed(3), "-t", duracao.toFixed(3), "-i", p.arquivo));
  const filtros = pistas.map(([k], i) =>
    `[${i}:a]aresample=48000,volume='${expressao(envelope(familiaBase(k), plano, duracao, magro))}':eval=frame[p${i}]`);
  filtros.push(`${pistas.map((_, i) => `[p${i}]`).join("")}amix=inputs=${pistas.length}:normalize=0[m]`);
  const bruto = saida.replace(/\.[^.]+$/, ".bruto.wav");
  args.push("-filter_complex", filtros.join(";"), "-map", "[m]", bruto);
  const r = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`trilha: ffmpeg falhou: ${(r.stderr || "").slice(-400)}`);
  // loudnorm no modo padrão comprime áudio curto e apaga o golpe: aqui é ganho fixo (medido) + limitador no pico.
  const ganho = -16 - medirLufs(bruto);
  const f = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", bruto, "-af", `volume=${ganho.toFixed(2)}dB,alimiter=limit=0.84:level=false`,
    "-c:a", "aac", "-b:a", "192k", saida], { encoding: "utf8" });
  fs.rmSync(bruto, { force: true });
  if (f.status !== 0) throw new Error(`trilha: ganho falhou: ${(f.stderr || "").slice(-400)}`);
  return { saida, familias: pistas.map(([k]) => k), magro, ganho_db: Number(ganho.toFixed(1)) };
}

// A família melódica que toca em TODOS os trechos calmos (piano primeiro). Sem isso a abertura pode sair muda.
// Nenhuma serve inteira: fica a que tem o trecho calmo mais fraco menos ruim.
function escolherMagro(pistas, plano, inicio) {
  const calmos = plano.filter((x) => x.nivel === "magro");
  const notas = MELODICAS.map((fam) => {
    const p = pistas.find(([k]) => familiaBase(k) === fam);
    const pior = p ? Math.min(...calmos.map((x) => volumeMedio(p[1].arquivo, inicio + x.de, x.ate - x.de))) : -99;
    return [fam, pior];
  });
  const [fam, pior] = notas.find(([, v]) => v > -40) || notas.sort((a, b) => b[1] - a[1])[0];
  return { fam, pior };
}

function volumeMedio(arquivo, inicio, duracao) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-ss", String(inicio), "-t", String(duracao), "-i", arquivo,
    "-af", "volumedetect", "-f", "null", "-"], { encoding: "utf8" });
  const m = (r.stderr || "").match(/mean_volume:\s*(-?[\d.]+)/);
  return m ? Number(m[1]) : -99;
}

function medirLufs(arquivo) {
  const r = spawnSync("ffmpeg", ["-hide_banner", "-i", arquivo, "-af", "loudnorm=print_format=json", "-f", "null", "-"], { encoding: "utf8" });
  const m = (r.stderr || "").match(/"input_i"\s*:\s*"(-?[\d.]+)"/);
  if (!m) throw new Error("trilha: não consegui medir a loudness");
  return Number(m[1]);
}

// Troca o áudio de um vídeo pronto pela trilha (vídeo copiado, sem renderizar de novo).
export function trocarAudio({ video, trilha, saida }) {
  const r = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", video, "-i", trilha, "-map", "0:v", "-map", "1:a",
    "-c:v", "copy", "-c:a", "copy", "-shortest", saida], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(`trilha: mux falhou: ${(r.stderr || "").slice(-400)}`);
  return saida;
}
