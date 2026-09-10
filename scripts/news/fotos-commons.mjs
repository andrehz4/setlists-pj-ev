// Busca fotos de alta resolução no Wikimedia Commons (LICENÇA LIVRE: CC/domínio
// público) pra ampliar o acervo de fotos da banda. Monta uma galeria local com
// botão de descartar (igual a curadoria de thumbs), guardando autor + licença
// pra o crédito. As aprovadas depois são baixadas pro acervo (--baixar).
//
// Uso:
//   node scripts/news/fotos-commons.mjs            (busca + galeria pra curar)
//   node scripts/news/fotos-commons.mjs --baixar   (baixa as APROVADAS pro acervo)
//
// Só usa foto de fonte adequada (Commons). Nada de Getty/Google (copyright).

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = new URL("../..", import.meta.url).pathname;
const META = "/tmp/commons-fotos.json";
const APROV = "/tmp/commons-aprovadas.json";
const SUBJECTS = path.join(ROOT, "media/band/subjects");

// Cada integrante tem seus termos de busca e sua pasta de destino. O prefixo
// entra no nome do arquivo pra deixar claro de onde a foto veio.
const ALVOS = [
  { subject: "eddie-vedder", prefixo: "ev", termos: ["Eddie Vedder", "Eddie Vedder live", "Eddie Vedder guitar", "Eddie Vedder concert"] },
  { subject: "mike-mccready", prefixo: "mm", termos: ["Mike McCready", "Mike McCready guitar", "Mike McCready Pearl Jam"] },
  { subject: "jeff-ament", prefixo: "ja", termos: ["Jeff Ament", "Jeff Ament bass", "Jeff Ament Pearl Jam"] },
  { subject: "stone-gossard", prefixo: "sg", termos: ["Stone Gossard", "Stone Gossard guitar"] },
  { subject: "matt-cameron", prefixo: "mc", termos: ["Matt Cameron", "Matt Cameron drums", "Matt Cameron Soundgarden"] },
  { subject: "boom-gaspar", prefixo: "bg", termos: ["Boom Gaspar"] },
  { subject: "banda", prefixo: "pj", termos: ["Pearl Jam concert", "Pearl Jam live", "Pearl Jam band"] },
];
const UA = { "User-Agent": "smufdpj-acervo/1.0 (fan project; contato eng.andrehz@gmail.com)" };

async function buscar() {
  const vistos = new Map();
  for (const alvo of ALVOS) for (const q of alvo.termos) {
    const url = `https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=440`;
    try {
      const j = await (await fetch(url, { headers: UA })).json();
      for (const p of Object.values(j?.query?.pages || {})) {
        const ii = p.imageinfo?.[0]; if (!ii || vistos.has(p.title)) continue;
        if (ii.width < 1500) continue; // alta resolução
        const em = ii.extmetadata || {};
        vistos.set(p.title, {
          subject: alvo.subject, prefixo: alvo.prefixo,
          title: p.title.replace(/^File:/, ""),
          w: ii.width, h: ii.height,
          lic: (em.LicenseShortName?.value || "?"),
          author: (em.Artist?.value || "?").replace(/<[^>]*>/g, "").trim().slice(0, 40),
          full: ii.url, thumb: ii.thumburl,
        });
      }
    } catch (e) { console.warn(`busca "${q}": ${e.message}`); }
    await new Promise((r) => setTimeout(r, 250)); // educado com a API do Commons
  }
  return [...vistos.values()].sort((a, b) => b.w - a.w);
}

function slug(s) {
  const ext = (s.match(/\.[a-z0-9]+$/i) || [""])[0];
  const base = s.slice(0, s.length - ext.length)
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w.-]/g, "-").replace(/-+/g, "-").slice(0, 50 - ext.length);
  return base + ext; // truncar sem comer a extensao
}

// O Commons devolve HTML de erro com status 429/5xx quando aperta o passo.
// Sem checar isso, a pagina de erro era salva como se fosse a foto.
async function baixarArquivo(url, tentativas = 4) {
  for (let i = 0; i < tentativas; i++) {
    try {
      const r = await fetch(url, { headers: UA });
      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        const assinatura = buf.subarray(0, 4).toString("hex");
        const imagem = assinatura.startsWith("ffd8") || assinatura.startsWith("89504e47") || assinatura.startsWith("52494646");
        if (imagem && buf.length > 20000) return buf;
        throw new Error(`resposta nao e imagem (${buf.length} bytes)`);
      }
      throw new Error(`HTTP ${r.status}`);
    } catch (e) {
      if (i === tentativas - 1) throw e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

async function baixar() {
  if (!fs.existsSync(APROV)) { console.error("rode a galeria e exporte as aprovadas primeiro (salve em " + APROV + ")"); process.exit(1); }
  const idx = JSON.parse(fs.readFileSync(APROV, "utf8"));       // [3,7,12,...] indices aprovados
  const todas = JSON.parse(fs.readFileSync(META, "utf8"));       // metadados de todas
  const aprov = idx.map((i) => todas[i]).filter(Boolean);
  const porSubject = new Map();
  let n = 0;
  for (const f of aprov) {
    const subject = f.subject || "eddie-vedder";
    const dest = path.join(SUBJECTS, subject);
    fs.mkdirSync(dest, { recursive: true });
    const nome = `${f.prefixo || "ev"}-commons-${slug(f.title)}`;
    if (fs.existsSync(path.join(dest, nome))) { console.log(`  = ${subject}/${nome} (já existe)`); continue; }
    try {
      const buf = await baixarArquivo(f.full);
      fs.writeFileSync(path.join(dest, nome), buf);
      await new Promise((r) => setTimeout(r, 400)); // nao aperta o passo com o Commons
      if (!porSubject.has(subject)) porSubject.set(subject, []);
      porSubject.get(subject).push({ arquivo: nome, autor: f.author, licenca: f.lic, fonte: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(f.title)}` });
      n++;
      console.log(`  ok ${subject}/${nome} (${(buf.length / 1024 / 1024).toFixed(1)}MB)`);
    } catch (e) { console.warn(`  x ${f.title}: ${e.message}`); }
  }
  // registra créditos por integrante (obrigação das licenças CC)
  for (const [subject, creditos] of porSubject) {
    const credPath = path.join(SUBJECTS, subject, "_creditos.json");
    const prev = fs.existsSync(credPath) ? JSON.parse(fs.readFileSync(credPath, "utf8")) : [];
    fs.writeFileSync(credPath, JSON.stringify([...prev, ...creditos], null, 2));
  }
  console.log(`\n${n} fotos baixadas em ${porSubject.size} pastas de ${SUBJECTS}`);
}

if (process.argv.includes("--baixar")) { await baixar(); process.exit(0); }

// modo galeria
const fotos = await buscar();
fs.writeFileSync(META, JSON.stringify(fotos, null, 2));
console.log(`${fotos.length} fotos >=1500px encontradas`);

const cards = [];
for (let i = 0; i < fotos.length; i++) {
  const f = fotos[i];
  let uri = "";
  try { uri = `data:image/jpeg;base64,${Buffer.from(await (await fetch(f.thumb, { headers: UA })).arrayBuffer()).toString("base64")}`; } catch {}
  cards.push(`<div class="c" data-n="${i}"><div class="n">${i}</div><button class="del" onclick="descarta(${i})">✕</button>${uri ? `<img src="${uri}">` : "<div class=noimg>?</div>"}<div class="meta"><div class="s">${f.w}×${f.h} · ${f.lic}</div><div class="s" style="color:#63c295">${f.subject}</div><div class="a">${f.author.replace(/</g, "&lt;")}</div></div></div>`);
}
const html = `<!doctype html><meta charset="utf8"><title>Fotos do acervo · Commons</title>
<style>body{background:#0f1115;color:#e8e6e0;font-family:system-ui;margin:0;padding:0 20px 40px}
.bar{position:sticky;top:0;background:#0f1115ee;backdrop-filter:blur(8px);padding:16px 0;border-bottom:1px solid #262b35;z-index:9}
button.act{background:#c1272d;color:#fff;border:0;padding:8px 14px;border-radius:7px;font-weight:600;cursor:pointer;font-size:13px}
button.ghost{background:#222732;color:#cdd3dc}#count{color:#8b93a0;font-size:13px;margin-left:8px}
textarea{width:100%;height:90px;margin-top:10px;background:#111;color:#9fe0a0;border:1px solid #262b35;border-radius:8px;padding:10px;font:11px ui-monospace;display:none}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;margin-top:18px}
.c{background:#181b22;border:1px solid #262b35;border-radius:10px;overflow:hidden;position:relative}.c.gone{display:none}
.c img{width:100%;aspect-ratio:1/1;object-fit:cover;display:block}
.n{position:absolute;top:6px;left:6px;background:#000a;padding:1px 7px;border-radius:5px;font-size:12px;font-weight:700}
.del{position:absolute;top:6px;right:6px;background:#000a;color:#fff;border:1px solid #fff3;border-radius:5px;padding:3px 8px;cursor:pointer}.del:hover{background:#c1272d}
.meta{padding:8px 10px}.s{font-size:11px;color:#8b93a0}.a{font-size:10px;color:#6b7480;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}</style>
<div class="bar"><h1 style="font-size:18px;margin:0 0 8px">Fotos do Pearl Jam · Wikimedia Commons (licença livre)</h1>
<button class="act" onclick="lista()">📋 Lista das aprovadas</button><button class="act ghost" onclick="reset()">↺ Restaurar</button><span id="count"></span>
<textarea id="out" readonly onclick="this.select()"></textarea></div>
<div class="grid">${cards.join("")}</div>
<script>
const DATA=${JSON.stringify(fotos.map((f, i) => ({ i, title: f.title, full: f.full, author: f.author, lic: f.lic, subject: f.subject })))};
const KEY="pj-fotos-descartadas";let fora=new Set(JSON.parse(localStorage.getItem(KEY)||"[]"));
function render(){DATA.forEach(d=>{const e=document.querySelector('.c[data-n="'+d.i+'"]');if(e)e.classList.toggle("gone",fora.has(d.i))});document.getElementById("count").textContent=(DATA.length-fora.size)+" de "+DATA.length+" mantidas";localStorage.setItem(KEY,JSON.stringify([...fora]))}
function descarta(n){fora.add(n);render()}function reset(){fora.clear();document.getElementById("out").style.display="none";render()}
function lista(){const m=DATA.filter(d=>!fora.has(d.i)).map(d=>d.i);const t=JSON.stringify(m);const o=document.getElementById("out");o.value="APROVADAS ("+m.length+"): "+t;o.style.display="block";o.select();try{navigator.clipboard.writeText(t)}catch(e){}}
render();
</script>`;
fs.writeFileSync("/tmp/fotos-commons.html", html);
console.log("galeria: /tmp/fotos-commons.html");
try { spawnSync("open", ["/tmp/fotos-commons.html"]); } catch {}
