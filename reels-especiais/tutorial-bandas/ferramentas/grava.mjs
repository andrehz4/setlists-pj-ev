// Grava a página real da banda, um bloco por vez. Uso: BANDA=<slug> node ferramentas/grava.mjs <bloco>
// (saída em gravacoes/<bloco>/ na Blaymorphed, gravacoes/<slug>/<bloco>/ nas outras)
import { abrir, dorme, montar } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
import { B } from './banda.mjs';
const BL = B.URL;
const IB = 'https://somaisumfadepearljam.com.br/setlist-ibirapuera/';
const bloco = process.argv[2]; const D = B.G + bloco, FALTA = B.falta || 'stones';
// Guarda o que a página mandaria pro WhatsApp e não deixa sair da página.
const ESPIA = `navigator.share = async (d) => { window.__share = { text: d.text, title: d.title, files: (d.files||[]).length };
    if (d.files && d.files[0]) { const r = new FileReader(); r.onload = () => { window.__img = r.result; }; r.readAsDataURL(d.files[0]); } };
  navigator.canShare = () => true; window.open = (u) => { window.__open = u; return null; };
  try { navigator.clipboard.writeText = async (t) => { window.__clip = t; }; } catch (e) {}`;
// Data adiantada (Blaymorphed: 01/12, só o Stones Bar na agenda).
const DEPOIS = `(() => { const R = Date, off = new R('${B.dataSimulada}') - R.now();
  class D extends R { constructor(...a) { if (a.length) super(...a); else super(R.now() + off); } static now() { return R.now() + off; } }
  window.Date = D; })();`;
setTimeout(() => { console.log('TIMEOUT'); process.exit(1); }, 240000);
const b = await abrir(D, { antes: ESPIA + (bloco === FALTA && B.dataSimulada ? DEPOIS : '') });
const rect = (sel) => b.ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
const topo = (sel, m = 100) => `document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top + scrollY - ${m}`;
const extra = {};
// Recorte dos botões de show (cena 9), em 2x.
const fotoShows = async () => { const r = await rect('#shows');
  const f = await b.cmd('Page.captureScreenshot', { format: 'png', clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(D + '/shows.png', Buffer.from(f.data, 'base64')); };

if (bloco === 'ibira') {
  await b.ir(IB + '?r=' + Date.now()); await b.gravar(); await dorme(6000);
}
if (bloco === 'chegada') {
  await b.ir(BL + '?r=' + Date.now()); await b.ev('localStorage.clear()'); await b.ir(BL + '?r=' + Date.now());
  await b.gravar(); await dorme(9000);
}
if (bloco === 'sorteio') {
  await b.ir(BL + '?r=' + Date.now()); await b.ev('localStorage.clear()'); await b.ir(BL + '?r=' + Date.now());
  await b.gravar(); await dorme(2500); b.marca('chegada');
  await b.toca('#abrir-sorteio', 'cartao'); await dorme(1300);
  await b.toca('#nome', 'nome'); b.marca('digita'); await b.digita('#nome', 'SMUFDPJ'); await dorme(700);
  for (const [i, p] of (B.toquesShows || [1, 0]).entries()) { await b.toca(`#shows [data-palco="${p}"]`, 'show' + p); await dorme(i ? 1000 : 900); }
  await fotoShows();
  await b.toca('#sortear', 'sortear'); b.marca('sorteou');
  await dorme(13000); b.marca('folhaPronta');
  await b.rola(topo('#sorte', 130)); b.marca('cartas'); await dorme(4500);
  await b.rola(topo('#bloco-lidas', 90)); b.marca('lidas'); await dorme(1200);
  await b.toca('#lidas .toca', 'play'); b.marca('play'); await dorme(4500);
  await b.rola(topo('#ver-spotify', 380)); b.marca('aquece'); await dorme(2500);
  await b.rola(topo('#acoes', 260)); b.marca('acoes'); await dorme(1800);
  await b.toca('#story', 'instagram'); b.marca('instagram'); await dorme(5000);
  extra.clip = await b.ev('window.__clip'); extra.shareIg = await b.ev('window.__share');
  await b.ev(`document.querySelector('.fechar:not([hidden])')?.click(); document.querySelector('dialog[open]')?.close()`); await dorme(800);
  await b.rola(topo('#acoes', 260), 10); await dorme(600);
  await b.ev('window.__share = null');
  await b.toca('#compartilhar', 'whats'); b.marca('whats'); await dorme(2500);
  extra.share = await b.ev('window.__share'); extra.open = await b.ev('window.__open');
  // imagem que vai junto no compartilhar (o story com a folha)
  const img = await b.ev('window.__img'); if (img) writeFileSync(D + '/story.' + (img.startsWith('data:image/png') ? 'png' : 'jpg'), Buffer.from(img.split(',')[1], 'base64'));
  await b.rola(topo('#acoes', 260), 10); await dorme(600);
  await b.toca('#story-video', 'video'); b.marca('video');
  let pronto = false;
  for (let i = 0; i < 120 && !pronto; i++) { await dorme(500); pronto = await b.ev(`[...document.querySelectorAll('button')].some(x=>/Postar no story/.test(x.textContent) && x.offsetParent)`); }
  b.marca('videoPronto'); await dorme(3000);
}
if (bloco === 'montar') {
  await b.ir(BL + '?r=' + Date.now()); await b.ev('localStorage.clear()'); await b.ir(BL + '?r=' + Date.now());
  await b.gravar(); await dorme(1500);
  await b.toca('#ir-montar', 'montar'); b.marca('montar'); await dorme(1500);
  // Outras bandas: buscas que não mostram nome de outra banda ("black" traz Spin the Black Circle e o disco Lost Dogs).
  const BUSCAS = B.base ? [['release', 'release'], ['corduroy', 'corduroy'], ['black', 'black'], ['alive', 'alive']]
    : [['release', 'release'], ['corduroy', 'corduroy'], ['daughter', 'daughter'], ['given', 'given to fly']];
  for (const [q, k] of BUSCAS) {
    await b.toca('#busca', 'busca'); await b.ev(`document.querySelector('#busca').value=''; document.querySelector('#busca').dispatchEvent(new Event('input',{bubbles:true}))`);
    // Outras bandas: a palavra entra inteira (letra por letra, "g", "gi"... mostram o disco Lost Dogs na lista).
    if (B.base) await b.digita('#busca', q, 120); else await b.cmd('Input.insertText', { text: q });
    await dorme(B.base ? 600 : 1100);
    await b.toca(`#catalogo button.add[data-k="${k}"]`, 'add-' + k); await dorme(700);
  }
  b.marca('lista'); await b.toca('#abrir-gaveta', 'gaveta'); await dorme(2500);
  await b.toca('#gerar-d', 'gerar'); b.marca('gerar'); await dorme(9000);
}
if (bloco === 'nome') {
  await b.ir(BL + '?r=' + Date.now()); await b.ev('localStorage.clear()'); await b.ir(BL + '?r=' + Date.now());
  await b.gravar(); await dorme(1000);
  await b.toca('#abrir-sorteio', 'cartao'); await dorme(1500);
  extra.campo = await rect('#nome');
  await b.toca('#nome', 'nome'); b.marca('barrado'); await b.digita('#nome', 'merda', 220); b.marca('barradoFim'); await dorme(3000);
  b.marca('ana'); await b.digita('#nome', 'Ana', 260); await dorme(900);
  await b.toca('#sortear', 'sortear'); b.marca('sorteou'); await dorme(6000); b.marca('titulo');
}
if (bloco === FALTA) {
  await b.ir(BL + '?r=' + Date.now()); await b.ev('localStorage.clear()'); await b.ir(BL + '?r=' + Date.now());
  await b.gravar(); await dorme(1500);
  await b.toca('#abrir-sorteio', 'cartao'); b.marca('gaveta'); await dorme(3000);
  extra.shows = await b.ev(`document.querySelector('#shows').innerText`);
  await b.toca('#sortear', 'sortear'); b.marca('sorteou'); await dorme(6000);
  extra.topo = await b.ev(`document.querySelector('#r-show')?.innerText`);
  await b.rola(topo('#acoes', 260)); await dorme(800);
  await b.toca('#compartilhar', 'whats'); b.marca('whats'); await dorme(2000);
  extra.share = await b.ev('window.__share'); extra.open = await b.ev('window.__open');
}
await b.fechar(); writeFileSync(D + '/extra.json', JSON.stringify(extra, null, 1)); console.log(JSON.stringify(extra));
montar(D); process.exit(0);
