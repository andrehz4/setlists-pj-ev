// Preview de rascunhos de cápsula: gera a capa (foto do acervo + design do
// projeto) de cada rascunho e monta um HTML local com a capa + a matéria lado a
// lado, pra o Andre ler e aprovar antes de enfileirar.
//
// Uso: node scripts/news/youtube/rascunhos-preview.mjs

import fs from "node:fs";
import path from "node:path";

const ROOT = new URL("../../..", import.meta.url).pathname;
const sharp = (await import(`${ROOT}node_modules/sharp/lib/index.js`)).default;
const { buildCoverSlide } = await import(`${ROOT}scripts/publish/slide-image.mjs`);

const rasc = JSON.parse(fs.readFileSync(path.join(ROOT, "media/news/youtube-acervo/_rascunhos.json"), "utf8"));
const SLIDES = path.join(ROOT, "media/news/instagram-slides");

const cards = [];
for (const r of rasc) {
  let uri = "";
  try {
    const destId = `_cap-preview-${r.id}`;
    await buildCoverSlide({ id: destId, title_pt: r.title_capa || r.title_pt, img: r.img, tags: r.tags, url: "" }, destId, "#141821");
    const buf = await sharp(path.join(SLIDES, `${destId}.jpg`)).resize(460, null).jpeg({ quality: 80 }).toBuffer();
    uri = `data:image/jpeg;base64,${buf.toString("base64")}`;
    fs.rmSync(path.join(SLIDES, `${destId}.jpg`), { force: true });
  } catch (e) { console.warn(`capa ${r.id}: ${e.message}`); }
  const body = (r.body_pt || "").split("\n\n").map((p) => `<p>${p.replace(/</g, "&lt;")}</p>`).join("");
  cards.push(`<div class="cap"><div class="capa">${uri ? `<img src="${uri}">` : "(sem capa)"}</div>
<div class="txt"><div class="tag">CÁPSULA · fonte: <a href="https://youtu.be/${r.videoId}" target="_blank">youtu.be/${r.videoId}</a></div>
<h2>${r.title_pt.replace(/</g, "&lt;")}</h2><p class="intro">${(r.intro_pt || "").replace(/</g, "&lt;")}</p>${body}
<div class="tags">${(r.tags || []).map((t) => "#" + t).join(" ")}</div></div></div>`);
}

const html = `<!doctype html><meta charset="utf8"><title>Rascunhos de cápsula</title>
<style>body{background:#0f1115;color:#e8e6e0;font-family:Georgia,serif;margin:0;padding:24px;max-width:1100px;margin:0 auto}
h1{font-family:system-ui;font-size:20px}.cap{display:flex;gap:24px;background:#181b22;border:1px solid #262b35;border-radius:12px;padding:20px;margin-bottom:22px}
.capa{flex:0 0 300px}.capa img{width:100%;border-radius:8px;display:block}
.txt{flex:1}.tag{font-family:system-ui;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#c1272d;margin-bottom:8px}
.tag a{color:#5a9bd4}h2{font-size:22px;line-height:1.2;margin:0 0 12px}.intro{font-size:16px;color:#c9cdd4;font-style:italic;margin-bottom:14px}
p{line-height:1.6;font-size:15px}.tags{font-family:ui-monospace,monospace;font-size:12px;color:#6b93b8;margin-top:12px}
@media(max-width:720px){.cap{flex-direction:column}.capa{flex:none}}</style>
<h1>Rascunhos de cápsula · ${rasc.length} pra revisar</h1>
${cards.join("")}`;
fs.writeFileSync("/tmp/yt-rascunhos.html", html);
console.log(`preview: /tmp/yt-rascunhos.html (${rasc.length} cápsulas)`);
import { spawnSync } from "node:child_process";
try { spawnSync("open", ["/tmp/yt-rascunhos.html"]); } catch {}
