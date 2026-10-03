// Rastreio de rosto pro recorte vertical 9:16 do reel (Apple Vision, só no Mac; no
// GitHub não roda e nem precisa: a trilha fica gravada no transicoes.json).
//   node scripts/publish/reel/rosto/rosto.mjs <video> [--passo 0.1]    -> imprime a trilha
//   node scripts/publish/reel/rosto/rosto.mjs --acervo                  -> grava focoTrilha nos trechos sem trilha
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { naRaiz } from "../../../config.mjs";

const SWIFT = path.join(path.dirname(new URL(import.meta.url).pathname), "rosto.swift");
const BIN = path.join(os.tmpdir(), "smufdpj-rosto");
export const MIN_COBERTURA = 0.5; // rosto em menos da metade dos quadros = não confiável (público, cabelo)

// Compila uma vez (o `swift` interpretado é lento) e roda o detector.
export function detectar(video, passo = 0.1) {
  if (!fs.existsSync(BIN) || fs.statSync(BIN).mtimeMs < fs.statSync(SWIFT).mtimeMs) {
    const c = spawnSync("swiftc", ["-O", SWIFT, "-o", BIN], { encoding: "utf8" });
    if (c.status !== 0) throw new Error(`swiftc: ${c.stderr.slice(-300)}`);
  }
  const r = spawnSync(BIN, [video, String(passo)], { encoding: "utf8", maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`rosto: ${r.stderr.slice(-300)}`);
  return JSON.parse(r.stdout);
}

// Centro do rosto (0 a 1 na largura) -> foco do recorte, com o rosto no meio do 9:16.
export const focoDoCentro = (x, larguraCorte) => Math.min(1, Math.max(0, (x - larguraCorte / 2) / (1 - larguraCorte)));

// Pontos do detector -> trilha suave: preenche os buracos interpolando, segura nas pontas,
// suaviza ida e volta (sem atraso) e limita a velocidade (sem chicote). null = nenhum rosto.
export function trilhaSuave(pontos, { larguraCorte = 0.3164, minConf = 0.5, alfa = 0.35, maxPorSeg = 0.9 } = {}) {
  const ok = pontos.filter((p) => Number.isFinite(p.x) && (p.conf ?? 1) >= minConf);
  if (!ok.length) return null;
  const alvo = pontos.map((p) => {
    const antes = [...ok].reverse().find((k) => k.t <= p.t), depois = ok.find((k) => k.t >= p.t);
    const x = !antes ? depois.x : !depois ? antes.x : antes.t === depois.t ? antes.x
      : antes.x + (depois.x - antes.x) * (p.t - antes.t) / (depois.t - antes.t);
    return focoDoCentro(x, larguraCorte);
  });
  const ida = [], volta = [];
  alvo.forEach((v, i) => ida.push(i ? ida[i - 1] + alfa * (v - ida[i - 1]) : v));
  for (let i = ida.length - 1; i >= 0; i--) volta[i] = i === ida.length - 1 ? ida[i] : volta[i + 1] + alfa * (ida[i] - volta[i + 1]);
  const out = [];
  volta.forEach((v, i) => {
    const dt = i ? pontos[i].t - pontos[i - 1].t : 0;
    const f = i ? out[i - 1].foco + Math.max(-maxPorSeg * dt, Math.min(maxPorSeg * dt, v - out[i - 1].foco)) : v;
    out.push({ t: Math.round(pontos[i].t * 1000) / 1000, foco: Math.round(f * 1000) / 1000 });
  });
  return out;
}

function larguraDoCorte(video) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], { encoding: "utf8" });
  const [w, h] = r.stdout.trim().split(",").map(Number);
  return (h * 9 / 16) / w;
}

function main() {
  const a = process.argv.slice(2);
  if (a[0] === "--acervo") {
    const pasta = naRaiz("media/reels-clips/transicoes"), arq = path.join(pasta, "transicoes.json");
    const doc = JSON.parse(fs.readFileSync(arq, "utf8"));
    for (const t of doc.transicoes) {
      if (Array.isArray(t.focoTrilha)) { console.log(`[rosto] ${t.file}: já tem trilha`); continue; }
      const video = path.join(pasta, t.file), pts = detectar(video);
      const trilha = trilhaSuave(pts, { larguraCorte: larguraDoCorte(video) });
      const achou = pts.filter((p) => Number.isFinite(p.x)).length;
      const cobertura = achou / pts.length;
      if (trilha && cobertura >= MIN_COBERTURA) { t.focoTrilha = trilha; t.rosto = { achou: true, cobertura: Math.round(achou / pts.length * 100) / 100 }; }
      console.log(`[rosto] ${t.file}: rosto em ${achou}/${pts.length} quadros${trilha && cobertura >= MIN_COBERTURA ? `, foco ${trilha[0].foco} -> ${trilha.at(-1).foco}` : ", pouco rosto (fica no foco/centro)"}`);
    }
    fs.writeFileSync(arq, JSON.stringify(doc, null, 2) + "\n");
    return;
  }
  const passo = a.includes("--passo") ? Number(a[a.indexOf("--passo") + 1]) : 0.1;
  console.log(JSON.stringify(trilhaSuave(detectar(a[0], passo), { larguraCorte: larguraDoCorte(a[0]) })));
}

if (import.meta.url === `file://${process.argv[1]}`) main();
