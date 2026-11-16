// Baixa TODOS os setlists do Eddie Vedder (solo) e do Pearl Jam no setlist.fm para <saida>/<artista>-p<N>.json.
// Roda no GitHub Actions (secret SETLISTFM_API_KEY), workflow estudo-setlistfm.yml. Retoma: pula página já salva.
// Limite da API: 2 req/s e 1440/dia; espera 600 ms entre pedidos.
//   SETLISTFM_API_KEY=... node reels-especiais/eddie-carreira/coletar.mjs <saida>
import fs from "node:fs";
import path from "node:path";

const KEY = process.env.SETLISTFM_API_KEY;
if (!KEY) { console.error("sem SETLISTFM_API_KEY"); process.exit(1); }
const SAIDA = process.argv[2] || "bruto";
fs.mkdirSync(SAIDA, { recursive: true });
const API = "https://api.setlist.fm/rest/1.0";
const HDR = { "x-api-key": KEY, Accept: "application/json",
  "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" };
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
let pedidos = 0;

async function get(url) {
  for (let t = 1; t <= 4; t++) {
    await dorme(600);
    pedidos++;
    const r = await fetch(url, { headers: HDR });
    if (r.ok) return r.json();
    if (r.status === 404) return null;
    console.log(`HTTP ${r.status} em ${url.replace(API, "")} (tentativa ${t})`);
    await dorme(3000 * t);
  }
  throw new Error(`falhou: ${url}`);
}

async function mbid(nome) {
  const d = await get(`${API}/search/artists?artistName=${encodeURIComponent(nome)}&sort=relevance`);
  const a = (d?.artist || []).find((x) => x.name.toLowerCase() === nome.toLowerCase());
  if (!a) throw new Error(`artista não achado: ${nome}`);
  return a.mbid;
}

const ARTISTAS = [["eddie-vedder", "Eddie Vedder"], ["pearl-jam", "Pearl Jam"]];
const mbids = {};
for (const [slug, nome] of ARTISTAS) {
  mbids[slug] = await mbid(nome);
  let total = Infinity;
  for (let p = 1; (p - 1) * 20 < total; p++) {
    const arq = path.join(SAIDA, `${slug}-p${String(p).padStart(3, "0")}.json`);
    if (fs.existsSync(arq)) { total = JSON.parse(fs.readFileSync(arq, "utf8")).total; continue; }
    const d = await get(`${API}/artist/${mbids[slug]}/setlists?p=${p}`);
    if (!d) break;
    fs.writeFileSync(arq, JSON.stringify(d));
    total = d.total;
    if (p % 10 === 0) console.log(`${slug}: página ${p} de ${Math.ceil(total / 20)}`);
  }
  console.log(`${slug}: ${total} setlists`);
}
fs.writeFileSync(path.join(SAIDA, "mbids.json"), JSON.stringify(mbids, null, 1));
console.log(`ok: ${pedidos} pedidos`);
