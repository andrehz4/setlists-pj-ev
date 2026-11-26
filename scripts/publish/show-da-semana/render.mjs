// Renderiza o carrossel do Show da Semana (modelo do Claude Design em media/carrossel/show/modelo.html)
// em 4 JPGs 1080x1350. Sem ficha, renderiza o exemplo que veio do Design (Porto Alegre 2015).
//   node scripts/publish/show-da-semana/render.mjs <pasta-saida> [ficha.json]
// O pôster da ficha é copiado pra media/carrossel/show/uploads/ (fora do git) pra o modelo achar.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import sharp from "sharp";
import { RAIZ } from "../../config.mjs";

const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
export const MODELO = path.join(RAIZ, "media/carrossel/show/modelo.html");
export const SLIDES = ["01 capa", "02 historia", "03 setlist", "04 fecho"];
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function dataPorExtenso(iso) {
  const [a, m, d] = iso.split("-").map(Number);
  return `${d} de ${MESES[m - 1]} de ${a}`;
}

// Ficha (ficha.mjs) -> post no formato do DATA do modelo.
export function postDaFicha(f, posterNoModelo) {
  const raro = new Set(f.destaques || []);
  const marca = (m) => (raro.has(m) ? `*${m}` : m);
  const blocos = f.setlist.blocos?.length
    ? f.setlist.blocos
    : [{ label: "SHOW", songs: f.setlist.show }, ...(f.setlist.bis?.length ? [{ label: "BIS", songs: f.setlist.bis }] : [])];
  return {
    num: f.numero, city: f.cidade, venue: f.local, date: dataPorExtenso(f.data),
    poster: posterNoModelo, posterCredit: f.poster.credito,
    story: f.historia.texto, source: `Fonte: ${f.historia.rotuloFonte || "Fanviews do fórum oficial do Pearl Jam"}`,
    setlist: blocos.map((b) => ({ label: b.label, songs: b.songs.map(marca) })),
  };
}

// Troca o DATA do modelo por um post só e esconde tudo que não é o slide pedido.
export function htmlDoSlide(modelo, rotulo, post) {
  let html = modelo;
  if (post) {
    const ini = html.indexOf("static DATA = ");
    const fim = html.indexOf("\n  };", ini);
    if (ini < 0 || fim < 0) throw new Error("modelo sem 'static DATA = {...};' (o Design mudou o formato?)");
    html = html.slice(0, ini) + `static DATA = ${JSON.stringify({ posts: [post] })}` + html.slice(fim + 4);
  }
  const alvo = `[data-screen-label="${rotulo}"]`;
  const css = `<style>html,body{margin:0!important;background:#000!important;overflow:hidden!important}
body *{visibility:hidden!important} ${alvo}, ${alvo} *{visibility:visible!important}
${alvo}{position:fixed!important;left:0!important;top:0!important;z-index:2147483647!important;margin:0!important}
${alvo} ~ ${alvo}{display:none!important}</style>`;
  return html.replace("</head>", `${css}</head>`);
}

export async function renderizar(saida, ficha) {
  const modelo = fs.readFileSync(MODELO, "utf8");
  const dir = path.dirname(MODELO);
  let post = null;
  if (ficha) {
    const origem = path.isAbsolute(ficha.poster.arquivo) ? ficha.poster.arquivo : path.join(RAIZ, ficha.poster.arquivo);
    const nome = `poster-${ficha.id}${path.extname(origem)}`;
    fs.mkdirSync(path.join(dir, "uploads"), { recursive: true });
    fs.copyFileSync(origem, path.join(dir, "uploads", nome));
    post = postDaFicha(ficha, `uploads/${nome}`);
  }
  fs.mkdirSync(saida, { recursive: true });
  const gerados = [];
  for (const [i, rotulo] of SLIDES.entries()) {
    const tmp = path.join(dir, `._render-${i}.html`);
    const png = path.join(saida, `._${i}.png`);
    fs.writeFileSync(tmp, htmlDoSlide(modelo, rotulo, post));
    try {
      // o Chrome headless falha de vez em quando sem motivo (2 em 64 slides em 26/11): tenta de novo
      for (let t = 1; ; t++) {
        try {
          execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=1080,1350",
            "--virtual-time-budget=10000", `--screenshot=${png}`, `file://${tmp}`], { stdio: "ignore" });
          break;
        } catch (e) { if (t >= 3) throw e; }
      }
    } finally { fs.rmSync(tmp, { force: true }); }
    const jpg = path.join(saida, `${String(i + 1).padStart(2, "0")}.jpg`);
    await sharp(png).jpeg({ quality: 93 }).toFile(jpg);
    fs.rmSync(png, { force: true });
    gerados.push(jpg);
  }
  return gerados;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [saida, arqFicha] = process.argv.slice(2);
  if (!saida) { console.error("uso: render.mjs <pasta-saida> [ficha.json]"); process.exit(1); }
  const ficha = arqFicha ? JSON.parse(fs.readFileSync(arqFicha, "utf8")) : null;
  for (const f of await renderizar(path.resolve(saida), ficha)) console.log(f);
}
