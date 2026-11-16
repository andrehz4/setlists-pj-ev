// Renderiza um carrossel feito no modelo (export do Claude Design) em JPGs 1080x1350 com a paleta escolhida.
// Uso: node scripts/publish/carrossel/render.mjs <arquivo.html> <pasta-saida> [paleta | '{"destaque":"#..."}']
// O HTML pode ser uma cópia de media/carrossel/<modelo>/modelo.html editada (fotos em uploads/ ao lado dela).
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { htmlDoSlide, resolverPaleta, rotulos } from "./paletas.mjs";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

export async function renderizar(arquivo, saida, entradaPaleta = "amarelo") {
  const html = fs.readFileSync(arquivo, "utf8");
  const paleta = resolverPaleta(entradaPaleta);
  const lista = rotulos(html);
  if (!lista.length) throw new Error(`nenhum data-screen-label em ${arquivo}`);
  fs.mkdirSync(saida, { recursive: true });
  const dir = path.dirname(path.resolve(arquivo));
  const gerados = [];
  for (const [i, rotulo] of lista.entries()) {
    // arquivo temporário AO LADO do modelo: assim uploads/ e support.js resolvem pelo caminho relativo
    const tmp = path.join(dir, `._render-${rotulo}.html`);
    const png = path.join(saida, `._${rotulo}.png`);
    fs.writeFileSync(tmp, htmlDoSlide(html, paleta, rotulo));
    try {
      execFileSync(CHROME, [
        "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1080,1350",
        "--virtual-time-budget=8000", `--screenshot=${png}`, `file://${tmp}`,
      ], { stdio: "ignore" });
    } finally {
      fs.rmSync(tmp, { force: true });
    }
    const jpg = path.join(saida, `${String(i + 1).padStart(2, "0")}.jpg`);
    await sharp(png).jpeg({ quality: 93 }).toFile(jpg);
    fs.rmSync(png, { force: true });
    gerados.push(jpg);
  }
  return gerados;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [arquivo, saida, p] = process.argv.slice(2);
  if (!arquivo || !saida) {
    console.error("uso: render.mjs <arquivo.html> <pasta-saida> [paleta|json]");
    process.exit(1);
  }
  const entrada = p?.startsWith("{") ? JSON.parse(p) : p || "amarelo";
  for (const f of await renderizar(arquivo, saida, entrada)) console.log(f);
}
