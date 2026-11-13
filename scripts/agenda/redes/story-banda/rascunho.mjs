// Rascunho dos layouts do story por banda, sem publicar nada: folha de contato (1 quadro por cena, 1 linha por banda
// de exemplo) e, com --mp4, o vídeo mudo de 21,3 s (sem clipe: o b-roll vira tela cinza).
// Uso: AGENDA_LAYOUTS_NOVOS=1 node scripts/agenda/redes/story-banda/rascunho.mjs --layouts A,G [--tema ocre] [--mp4] [--saida DIR]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { naRaiz } from "../../../config.mjs";
import { storiesDoDia } from "./dados.mjs";
import { quadroSvg, logoDaFoto } from "./render.mjs";
import { COR, TEMAS } from "./pecas.mjs";
import { LAYOUTS, temaDoLayout } from "./layouts/index.mjs";
import { DURACAO } from "./tempo.mjs";

const { default: sharp } = await import("sharp");
const arg = (n, pad) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : pad; };
const layouts = arg("layouts", ["A", ...Object.keys(LAYOUTS)].join(",")).split(",");
const tema = arg("tema", "azul");
const saida = arg("saida", path.join(os.tmpdir(), "rascunho-story-banda"));
const DIA = "2026-11-14";
const CENAS = [1.6, 4.6, 8.4, 12.6, 18]; // segundos reais: abertura, logo, mapa, shows, final

// bandas reais (nome, desde, cidade, logo) com shows de exemplo: 1, 2 e 3 shows (um sem hora e sem casa)
const SHOWS = [
  { banda: "pjnoventa", cidade: "Bragança Paulista", uf: "SP", hora: "23:00", casa: "brasilbeerfest" },
  { banda: "blackcirclepj", cidade: "Rio de Janeiro", uf: "RJ", hora: "21:00", casa: "blackdogbar" },
  { banda: "blackcirclepj", cidade: "Niterói", uf: "RJ", hora: "17:30", casa: "sesc_niteroi" },
  { banda: "pearljamcoverribeirao", cidade: "Ribeirão Preto", uf: "SP", hora: "20:00", casa: "pinguimbar" },
  { banda: "pearljamcoverribeirao", cidade: "Franca", uf: "SP", hora: "22:30", casa: "rockhouse" },
  { banda: "pearljamcoverribeirao", cidade: "Uberaba", uf: "MG" },
].map((s) => ({ ...s, data: DIA }));

const corDe = (v) => (LAYOUTS[v] ? temaDoLayout(v, tema)
  : { bg: TEMAS[tema], pin: tema === "vermelho" ? COR.tinta : COR.pin, strip: tema === "vermelho" ? COR.tinta : COR.pin });

async function main() {
  const { bandas } = JSON.parse(fs.readFileSync(naRaiz("media/agenda/bandas.json"), "utf8"));
  const stories = storiesDoDia(SHOWS, bandas, DIA);
  fs.mkdirSync(saida, { recursive: true });
  const logos = await Promise.all(stories.map((st) => {
    const f = naRaiz(`media/agenda/fotos/${st.contaPura}.jpg`);
    return fs.existsSync(f) ? logoDaFoto(f) : null;
  }));
  const W = 270, H = 480, G = 12;
  for (const v of layouts) {
    const cor = corDe(v), pecas = [];
    for (const [j, st] of stories.entries()) for (const [i, r] of CENAS.entries()) {
      const fundo = { create: { width: 1080, height: 1920, channels: 3, background: cor.bg } };
      const png = await sharp(fundo).composite([{ input: Buffer.from(quadroSvg(r, st, cor, logos[j], v)) }]).png().toBuffer();
      pecas.push({ input: await sharp(png).resize(W, H).toBuffer(), left: G + i * (W + G), top: G + j * (H + G) });
    }
    const folha = path.join(saida, `folha-${v}-${tema}.png`);
    await sharp({ create: { width: G + CENAS.length * (W + G), height: G + stories.length * (H + G), channels: 3, background: "#222" } })
      .composite(pecas).png().toFile(folha);
    console.log(`[rascunho] ${v}: ${folha}`);
    if (process.argv.includes("--mp4")) await video(v, cor, stories[stories.length - 1], logos[stories.length - 1]);
  }
}

async function video(v, cor, st, logoUri) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "rascunho-q-"));
  const total = Math.round(DURACAO * 30);
  for (let i = 0; i < total; i++) await sharp(Buffer.from(quadroSvg(i / 30, st, cor, logoUri, v))).png({ compressionLevel: 1 })
    .toFile(path.join(tmp, `q${String(i).padStart(4, "0")}.png`));
  const mp4 = path.join(saida, `story-${v}-${tema}-${st.contaPura}.mp4`);
  const r = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", `color=c=#555555:s=1080x1920:r=30:d=${DURACAO}`,
    "-framerate", "30", "-i", path.join(tmp, "q%04d.png"), "-filter_complex", "[0:v][1:v]overlay=format=auto[v]", "-map", "[v]",
    "-t", String(DURACAO), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "veryfast", "-crf", "22", mp4], { stdio: "inherit" });
  fs.rmSync(tmp, { recursive: true, force: true });
  if (r.status) throw new Error("ffmpeg falhou");
  console.log(`[rascunho] ${v} mp4: ${mp4}`);
}

main().catch((e) => { console.error("[rascunho] FATAL:", e); process.exit(1); });
