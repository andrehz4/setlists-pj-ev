// Pistas da trilha própria no R2 (bucket smufdpj-midia, pasta trilha/, sem regra de apagar). O Actions não vê o SSD:
// no git fica só o kit-publicado.json (o entrega-setlists.json do trilha-hz com caminhos relativos); o áudio
// (AAC 256k, uma pista por instrumento) fica no R2 e o publish baixa só a cama do dia.
//   node scripts/publish/trilha/r2.mjs subir     (Mac com o SSD: converte, sobe o que falta e regrava o kit publicado)
//   node scripts/publish/trilha/r2.mjs conferir  (lista pista do kit que não responde no R2)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { BUCKET, BASE_PUBLICA } from "../reel/acervo-r2.mjs";
import { carregarKit } from "./kit.mjs";

export const PREFIXO = "trilha";
export const KIT_PUBLICADO = new URL("./kit-publicado.json", import.meta.url).pathname;
const CACHE = path.join(os.tmpdir(), "smufdpj-trilha");

export const relativo = (camaId, chave) => `${PREFIXO}/${camaId}/${chave}.m4a`;
const urlDo = (rel) => `${BASE_PUBLICA}/${rel.split("/").map(encodeURIComponent).join("/")}`;
const semCache = (url) => `${url}?v=${Date.now()}`;
const responde = (url) => spawnSync("curl", ["-sfI", "--max-time", "20", semCache(url)]).status === 0;

export function lerKitPublicado(caminho = KIT_PUBLICADO) {
  return fs.existsSync(caminho) ? JSON.parse(fs.readFileSync(caminho, "utf8")) : null;
}

// Cópia da cama com `arquivo` absoluto (cache local), baixando do R2 o que faltar. Pista que não baixar = null
// (quem chama volta pra trilha antiga: cama pela metade soaria errada).
export function materializarCama(cama, { baixar = baixarCurl, cache = CACHE } = {}) {
  const pistas = {};
  for (const [chave, p] of Object.entries(cama.pistas)) {
    const destino = path.join(cache, p.arquivo);
    fs.mkdirSync(path.dirname(destino), { recursive: true });
    if (!fs.existsSync(destino) && !baixar(urlDo(p.arquivo), destino)) { console.warn(`[trilha] não baixou ${p.arquivo}`); return null; }
    pistas[chave] = { ...p, arquivo: destino };
  }
  return { ...cama, pistas };
}

function baixarCurl(url, destino) {
  const r = spawnSync("curl", ["-sfL", "--max-time", "120", "-o", destino, semCache(url)]);
  if (r.status !== 0) { fs.rmSync(destino, { force: true }); return false; }
  return true;
}

// Kit publicado = entrega do trilha-hz sem caminho do SSD (mix inteiro não sobe: o publish só usa as pistas).
export function kitParaPublicar(kit) {
  const camas = kit.camas.filter((c) => c.acr?.passou).map(({ mix, ...c }) => ({
    ...c, pistas: Object.fromEntries(Object.entries(c.pistas).map(([k, p]) => [k, { ...p, arquivo: relativo(c.id, k) }])),
  }));
  return { gerado_por: kit.gerado_por, licenca: kit.licenca, camas };
}

function subir() {
  const kit = carregarKit();
  if (!kit) throw new Error("trilha: kit não encontrado (SSD desligado?)");
  let novos = 0, falhas = 0;
  for (const c of kit.camas.filter((x) => x.acr?.passou)) {
    for (const [chave, p] of Object.entries(c.pistas)) {
      const rel = relativo(c.id, chave), local = path.join(CACHE, rel);
      if (responde(urlDo(rel))) continue;
      fs.mkdirSync(path.dirname(local), { recursive: true });
      const enc = spawnSync("ffmpeg", ["-v", "error", "-y", "-i", p.arquivo, "-c:a", "aac", "-b:a", "256k", local], { encoding: "utf8" });
      if (enc.status !== 0) { falhas++; console.warn(`[trilha] não converteu ${rel}: ${(enc.stderr || "").slice(-200)}`); continue; }
      const r = spawnSync("npx", ["--yes", "wrangler@latest", "r2", "object", "put", `${BUCKET}/${rel}`,
        "--file", local, "--content-type", "audio/mp4", "--remote"], { encoding: "utf8" });
      if (r.status === 0) { novos++; console.log(`[trilha] subiu ${rel}`); } else { falhas++; console.warn(`[trilha] falhou ${rel}: ${(r.stderr || "").slice(-200)}`); }
    }
  }
  fs.writeFileSync(KIT_PUBLICADO, JSON.stringify(kitParaPublicar(kit), null, 1) + "\n");
  console.log(`[trilha] ${novos} enviada(s), ${falhas} falha(s); kit publicado em ${KIT_PUBLICADO}`);
  return { novos, falhas };
}

function conferir() {
  const kit = lerKitPublicado();
  if (!kit) throw new Error("trilha: kit-publicado.json não existe (rode subir no Mac)");
  const faltam = kit.camas.flatMap((c) => Object.values(c.pistas).map((p) => p.arquivo)).filter((rel) => !responde(urlDo(rel)));
  console.log(faltam.length ? `[trilha] faltam no R2 (${faltam.length}): ${faltam.join(", ")}` : `[trilha] todas as pistas respondem no R2`);
  if (faltam.length) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2];
  if (cmd === "subir") { if (subir().falhas) process.exit(1); }
  else if (cmd === "conferir") conferir();
  else { console.error("uso: r2.mjs subir|conferir"); process.exit(1); }
}
