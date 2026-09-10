// Galeria de curadoria: baixa as thumbnails dos candidatos (descobre.mjs) e
// monta um HTML local com botão de descartar em cada card, contador e um
// exportador da lista das que sobraram (pra colar de volta e seguir a extração).
//
// As thumbnails ficam em /tmp (referência de curadoria, não vão pro repo). O
// HTML é autocontido (thumbs embutidas em base64) e salva a escolha no navegador.
//
// Uso:
//   node scripts/news/youtube/galeria.mjs
//   node scripts/news/youtube/galeria.mjs --in /tmp/yt-candidatos.json --html /tmp/yt-galeria.html

import fs from "node:fs";
import { spawnSync } from "node:child_process";

const base = new URL("../../..", import.meta.url).pathname;
const sharp = (await import(`${base}node_modules/sharp/lib/index.js`)).default;

function arg(nome, def) {
  const i = process.argv.indexOf(`--${nome}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const IN = arg("in", "/tmp/yt-candidatos.json");
const HTML = arg("html", "/tmp/yt-galeria.html");
const THUMBS = "/tmp/yt-thumbs";

const vids = JSON.parse(fs.readFileSync(IN, "utf8"));
fs.mkdirSync(THUMBS, { recursive: true });
const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

// baixa thumbs (maxres, fallback hqdefault) que ainda não tem
for (const v of vids) {
  const dest = `${THUMBS}/${v.id}.jpg`;
  if (fs.existsSync(dest)) continue;
  for (const q of ["maxresdefault", "hqdefault"]) {
    try {
      const r = await fetch(`https://i.ytimg.com/vi/${v.id}/${q}.jpg`);
      if (r.ok) { const b = Buffer.from(await r.arrayBuffer()); if (b.length > 3000) { fs.writeFileSync(dest, b); break; } }
    } catch {}
  }
}

const data = [];
const cards = [];
for (let i = 0; i < vids.length; i++) {
  const v = vids[i];
  let uri = "";
  try { uri = `data:image/jpeg;base64,${(await sharp(`${THUMBS}/${v.id}.jpg`).resize(420, null).jpeg({ quality: 70 }).toBuffer()).toString("base64")}`; } catch {}
  data.push({ n: i + 1, id: v.id, title: v.title, dur: fmt(v.duration), ch: v.channel || "?" });
  cards.push(`<div class="c" data-n="${i + 1}"><div class="n">${i + 1}</div><button class="del" onclick="descarta(${i + 1})">✕ descartar</button>${uri ? `<img src="${uri}">` : '<div class="noimg">sem thumb</div>'}<div class="meta"><div class="t">${v.title.replace(/</g, "&lt;")}</div><div class="s">${fmt(v.duration)} · ${(v.channel || "?").replace(/</g, "&lt;")}</div><a href="https://youtu.be/${v.id}" target="_blank">youtu.be/${v.id}</a></div></div>`);
}

const html = `<!doctype html><meta charset="utf8"><title>Cápsulas PJ · ${vids.length} vídeos</title>
<style>body{background:#0f1115;color:#e8e6e0;font-family:system-ui,sans-serif;margin:0;padding:0 24px 40px}
.bar{position:sticky;top:0;background:#0f1115ee;backdrop-filter:blur(8px);padding:16px 0;border-bottom:1px solid #262b35;z-index:10;margin-bottom:20px}
h1{font-size:19px;margin:0 0 8px}.tools{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
button.act{background:#c1272d;color:#fff;border:0;padding:8px 14px;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer}
button.ghost{background:#222732;color:#cdd3dc}#count{color:#8b93a0;font-size:13px}
textarea{width:100%;height:110px;margin-top:10px;background:#111;color:#9fe0a0;border:1px solid #262b35;border-radius:8px;padding:10px;font-family:ui-monospace,monospace;font-size:11px;display:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px}
.c{background:#181b22;border-radius:10px;overflow:hidden;position:relative;border:1px solid #262b35}
.c.gone{display:none}.c img{width:100%;display:block;aspect-ratio:16/9;object-fit:cover}
.noimg{aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;color:#555;background:#111}
.n{position:absolute;top:8px;left:8px;background:#c1272d;color:#fff;font-weight:700;padding:2px 9px;border-radius:6px;font-size:14px}
.del{position:absolute;top:8px;right:8px;background:#000a;color:#fff;border:1px solid #ffffff33;padding:4px 9px;border-radius:6px;font-size:11px;cursor:pointer}
.del:hover{background:#c1272d}.meta{padding:10px 12px}.t{font-size:13px;line-height:1.3;font-weight:600;margin-bottom:5px}
.s{font-size:11px;color:#8b93a0;margin-bottom:6px}a{font-size:11px;color:#5a9bd4;text-decoration:none}</style>
<div class="bar"><h1>Cápsulas do YouTube · curadoria</h1>
<div class="tools"><button class="act" onclick="lista()">📋 Gerar lista das que sobraram</button>
<button class="act ghost" onclick="reset()">↺ Restaurar todas</button><span id="count"></span></div>
<textarea id="out" readonly onclick="this.select()"></textarea></div>
<div class="grid">${cards.join("")}</div>
<script>
const DATA = ${JSON.stringify(data)};
const KEY = "pj-capsulas-descartadas";
let fora = new Set(JSON.parse(localStorage.getItem(KEY) || "[]"));
function render(){ DATA.forEach(d => { const el = document.querySelector('.c[data-n="'+d.n+'"]'); if(el) el.classList.toggle("gone", fora.has(d.n)); });
  document.getElementById("count").textContent = (DATA.length-fora.size)+" de "+DATA.length+" mantidas · "+fora.size+" descartadas";
  localStorage.setItem(KEY, JSON.stringify([...fora])); }
function descarta(n){ fora.add(n); render(); }
function reset(){ fora.clear(); document.getElementById("out").style.display="none"; render(); }
function lista(){ const m = DATA.filter(d => !fora.has(d.n));
  const t = "APROVADAS ("+m.length+"):\\n"+m.map(d => d.n+" | youtu.be/"+d.id+" | "+d.title).join("\\n");
  const ta = document.getElementById("out"); ta.value=t; ta.style.display="block"; ta.select();
  try { navigator.clipboard.writeText(t); } catch(e){} }
render();
</script>`;
fs.writeFileSync(HTML, html);
console.log(`galeria: ${HTML} (${(html.length / 1024 / 1024).toFixed(1)} MB, ${vids.length} cards)`);
try { spawnSync("open", [HTML]); } catch {}
