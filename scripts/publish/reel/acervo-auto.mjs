// Acervo automático do reel: de um clipe inteiro, acha TRANSIÇÕES (1,5 s com rosto e
// movimento) e CAPAS (4 s com rosto grande e estável, a abertura inteira do reel), com o
// recorte vertical seguindo o rosto. Gera folhas pra avaliar e depois importa os escolhidos.
//   node scripts/publish/reel/acervo-auto.mjs <video|link do YouTube> [--max 20]   (analisa, gera folhas; pula o que já está no acervo; --curto p/ clipe de corte rápido)
//   node scripts/publish/reel/acervo-auto.mjs <video> --importar t2,t5,c1 --musica "I Am Mine"
// Saída da análise: .momentos/<nome>/auto.json, auto-transicoes.jpg, auto-capas.jpg (gitignored).
// Depois de importar, preencher o "broll" de cada trecho no transicoes.json (ver README).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { analisarMovimento, pastaDo, folha } from "./momentos.mjs";
import { detectar, trilhaSuave } from "./rosto/rosto.mjs";
import { recorte } from "./transicoes.mjs";

const TIPOS = {
  t: { dur: 1.5, minCob: 0.7, minRosto: 0.07, espaco: 4, max: 12, nota: (c) => c.mov * (0.5 + c.cob) },
  c: { dur: 4, minCob: 0.9, minRosto: 0.12, espaco: 6, max: 6, nota: (c) => c.rosto * c.cob * (1 + c.mov / 40) },
  a: { dur: 1.5, minCob: 0, minRosto: 0, espaco: 4, max: 12, nota: (c) => c.mov * (1 - c.cob), minMov: 18 }, // ação sem rosto
};

// Janelas que não atravessam corte de cena, com rosto em boa parte dos quadros.
export function candidatos({ mov, cortes, rostos, tipo, fimVideo, usados = [], max, curto = false }) {
  // curto: clipe de corte rápido; transição/ação com 1 s (a transição só usa 0,7 s)
  const T = curto && tipo !== "c" ? { ...TIPOS[tipo], dur: 1, espaco: 2 } : TIPOS[tipo], res = [];
  const lim = max || T.max;
  const media = (a, b) => { const v = mov.filter(([x]) => x >= a && x < b).map(([, y]) => y); return v.reduce((s, y) => s + y, 0) / (v.length || 1); };
  for (let ini = 3; ini + T.dur <= fimVideo - 3; ini += 0.5) {
    const fim = ini + T.dur;
    if (cortes.some((c) => c > ini + 0.1 && c < fim - 0.1)) continue;
    if (usados.some(([a, b]) => ini < b + 1 && fim > a - 1)) continue; // já está no acervo
    const q = rostos.filter((p) => p.t >= ini && p.t < fim);
    const bons = q.filter((p) => Number.isFinite(p.x) && p.w >= T.minRosto && (p.conf ?? 1) >= 0.5);
    const cob = bons.length / (q.length || 1);
    if (cob < T.minCob || (T.minMov && media(ini, fim) < T.minMov)) continue;
    res.push({ ini, fim, cob: +cob.toFixed(2), mov: +media(ini, fim).toFixed(1), rosto: +(bons.reduce((s, p) => s + p.w, 0) / bons.length).toFixed(3) });
  }
  res.sort((a, b) => T.nota(b) - T.nota(a));
  const esc = [];
  for (const c of res) { if (esc.every((e) => Math.abs(e.ini - c.ini) > T.espaco)) esc.push(c); if (esc.length === lim) break; }
  return esc.sort((a, b) => a.ini - b.ini).map((c, i) => ({ id: `${tipo}${i + 1}`, ...c }));
}

const larguraCorte = (video) => {
  const [w, h] = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", video], { encoding: "utf8" }).stdout.trim().split(",").map(Number);
  return (h * 9 / 16) / w;
};

async function folhaVertical(video, cands, out, saida) {
  const tiras = [];
  for (const c of cands) {
    const arq = path.join(out, "rt", `${c.id}.jpg`);
    spawnSync("ffmpeg", ["-v", "error", "-y", "-ss", String(c.ini), "-i", video, "-t", String(c.fim - c.ini), "-filter_complex",
      `[0:v]${recorte({ focoTrilha: c.trilha })},fps=4/${c.fim - c.ini},scale=170:-2,tile=4x1:padding=3[v]`, "-map", "[v]", "-frames:v", "1", arq]);
    tiras.push({ n: c.id, arq });
  }
  if (tiras.length) await folha(tiras, saida);
}

// Trechos deste vídeo que já estão no acervo (pra não repetir).
function jaUsados(video) {
  try {
    const doc = JSON.parse(fs.readFileSync(path.resolve("media/reels-clips/transicoes/transicoes.json"), "utf8"));
    return doc.transicoes.filter((t) => t.origem === path.basename(video) && Number.isFinite(t.ini)).map((t) => [t.ini, t.fim ?? t.ini + (t.dur || 1.5)]);
  } catch { return []; }
}

async function analisar(video, max, curto = false) {
  const { out, mov, cortes } = analisarMovimento(video);
  fs.mkdirSync(path.join(out, "rt"), { recursive: true });
  const arqRostos = path.join(out, "rostos.json");
  const rostos = fs.existsSync(arqRostos) ? JSON.parse(fs.readFileSync(arqRostos, "utf8")) : detectar(video, 0.2);
  fs.writeFileSync(arqRostos, JSON.stringify(rostos));
  const lc = larguraCorte(video), fimVideo = mov.at(-1)?.[0] ?? 0;
  const res = {};
  const usados = jaUsados(video);
  for (const tipo of ["t", "c", "a"]) {
    res[tipo] = candidatos({ mov, cortes, rostos, tipo, fimVideo, usados, max, curto }).map((c) => ({ ...c,
      trilha: trilhaSuave(rostos.filter((p) => p.t >= c.ini && p.t < c.fim).map((p) => ({ ...p, t: +(p.t - c.ini).toFixed(3) })), { larguraCorte: lc }) }));
  }
  fs.writeFileSync(path.join(out, "auto.json"), JSON.stringify({ video: path.resolve(video), ...res }, null, 1));
  await folhaVertical(video, res.t, out, path.join(out, "auto-transicoes.jpg"));
  await folhaVertical(video, res.c, out, path.join(out, "auto-capas.jpg"));
  await folhaVertical(video, res.a, out, path.join(out, "auto-acao.jpg"));
  console.log(`[auto] ${res.t.length} transições, ${res.c.length} capas, ${res.a.length} ação sem rosto (${usados.length} já no acervo) -> ${out}`);
}

function importar(video, ids, musica) {
  const auto = JSON.parse(fs.readFileSync(path.join(pastaDo(video), "auto.json"), "utf8"));
  const slug = (musica || "clipe").toLowerCase().normalize("NFD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const arqJson = path.resolve("media/reels-clips/transicoes/transicoes.json");
  for (const id of ids) {
    const c = [...auto.t, ...auto.c, ...(auto.a || [])].find((x) => x.id === id);
    if (!c) { console.warn(`[auto] ${id} não existe`); continue; }
    const nome = `${slug}-${id[0] === "c" ? "capa" : id[0] === "a" ? "acao" : "t"}${id.slice(1)}`;
    const r = spawnSync(process.execPath, [path.resolve("scripts/publish/reel/importar-transicao.mjs"), video, nome, "--musica", musica || "",
      "--ini", String(c.ini), "--fim", String(c.fim)], { encoding: "utf8" });
    process.stdout.write(r.stdout || r.stderr);
    if (r.status !== 0) continue;
    const doc = JSON.parse(fs.readFileSync(arqJson, "utf8"));
    const t = doc.transicoes.find((x) => x.file === `${nome}.mp4`);
    if (c.trilha && c.cob >= 0.5) t.focoTrilha = c.trilha;
    t.rosto = { achou: true, cobertura: c.cob };
    if (id[0] === "c") t.capa = 0; // capa = abertura inteira, do começo
    fs.writeFileSync(arqJson, JSON.stringify(doc, null, 2) + "\n");
  }
}

// Link do YouTube: baixa só o vídeo (sem som, até 1080p) em .momentos/fontes/ e devolve o caminho.
// Já baixado = reaproveita. Precisa do yt-dlp no PATH (Mac: brew).
export function baixarLink(url) {
  const pasta = path.resolve(".momentos/fontes");
  fs.mkdirSync(pasta, { recursive: true });
  const r = spawnSync("yt-dlp", ["-f", "bv*[height<=1080][ext=mp4]/bv*[height<=1080]", "--remux-video", "mp4", "--no-playlist",
    "-o", path.join(pasta, "%(title)s.%(ext)s"), "--print", "after_move:filepath", url], { encoding: "utf8", maxBuffer: 1 << 26 });
  const arq = r.stdout.trim().split("\n").pop();
  if (r.status !== 0 || !arq || !fs.existsSync(arq)) throw new Error(`yt-dlp falhou: ${(r.stderr || "").slice(-300)}`);
  return arq;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2), op = (k) => (a.includes(k) ? a[a.indexOf(k) + 1] : null);
  if (/^https?:\/\//.test(a[0] || "")) { a[0] = baixarLink(a[0]); console.log(`[auto] baixado: ${a[0]}`); }
  if (!a[0] || !fs.existsSync(a[0])) { console.error("uso: acervo-auto.mjs <video> [--importar t1,c2 --musica X]"); process.exit(1); }
  if (op("--importar")) importar(a[0], op("--importar").split(","), op("--musica"));
  else await analisar(a[0], Number(op("--max")) || null, a.includes("--curto"));
}
