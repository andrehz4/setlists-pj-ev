// Fotografa o reel do Claude Design (media/agenda/reel-design/) quadro a quadro, com os dados da semana.
// O próprio protótipo tem o protocolo de exportação de vídeo (evento data-om-seek-to-time-frame com sync: true):
// cada quadro é função só do tempo T, então o PNG sai idêntico ao que o Design exporta, com fundo transparente
// onde entra o clipe (abertura e dias). Uso: const r = await abrirReel({...}); const png = await r.quadro(4.2);
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { naRaiz } from "../../config.mjs";
import { abrirChrome } from "./cdp.mjs";

const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".jsx": "text/plain", ".jpg": "image/jpeg", ".png": "image/png",
  ".ttf": "font/ttf", ".svg": "image/svg+xml", ".json": "application/json" };
const LIBERADO = /^\/(media\/agenda\/reel-design|media\/agenda\/fotos|media\/fonts)\//;

// Servidor estático só das pastas que a página usa (o support.js carrega os .jsx por XHR, file:// não serve).
function servir() {
  const raiz = naRaiz(".");
  const srv = http.createServer((req, res) => {
    const url = decodeURIComponent(req.url.split(/[?#]/)[0]);
    const arq = path.join(raiz, url);
    if (!LIBERADO.test(url) || !arq.startsWith(raiz) || !fs.existsSync(arq)) { res.writeHead(404).end(); return; }
    res.writeHead(200, { "content-type": TIPOS[path.extname(arq)] || "application/octet-stream" });
    fs.createReadStream(arq).pipe(res);
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

const SVG = "document.querySelector('svg[data-om-exportable-video-with-duration-secs]')";

export async function abrirReel({ week, scenes, layout, paleta, logos = {} }) {
  const srv = await servir();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const cr = await abrirChrome();
  try {
    const dados = encodeURIComponent(JSON.stringify({ week, scenes, layout, paleta }));
    await cr.navegar(`${base}/media/agenda/reel-design/render.html#${dados}`);
    await cr.esperarAte(`!!window.RC && !!${SVG} && ${SVG}.hasAttribute('data-om-sync-seek')`);
    // logo de cada banda (fundo do dia sem clipe e o redondo do card): caminho servido aqui
    await cr.avaliar(`Object.assign(window.RC.LOGOS, ${JSON.stringify(logos)}); true`);
    await cr.avaliar("document.fonts.ready.then(() => true)");
    const duracao = await cr.avaliar(`Number(${SVG}.getAttribute('data-om-exportable-video-with-duration-secs'))`);
    const seek = (t) => cr.avaliar(`(() => { const el = ${SVG};
      el.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame', { detail: { time: ${t}, sync: true } }));
      return Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; })))
        .then(() => new Promise((r) => requestAnimationFrame(() => r(true)))); })()`);
    await seek(0.01); // monta tudo uma vez (imagens carregam aqui)
    return {
      duracao,
      async quadro(t) { await seek(t); return cr.foto(); },
      erros: () => cr.logs.slice(),
      fechar() { cr.fechar(); srv.close(); },
    };
  } catch (e) { cr.fechar(); srv.close(); throw e; }
}
