// Grava o fluxo real do gerador em 390x844 (DPR 2) via CDP screencast. Saída: frames/ + toques.json
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const DIR = process.argv[2]; const URL = 'https://somaisumfadepearljam.com.br/setlist-ibirapuera/';
mkdirSync(DIR + '/frames', { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9334',
  '--autoplay-policy=no-user-gesture-required', '--user-data-dir=/private/tmp/claude-501/cdp-grava-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 180000);
let ws; for (let i = 0; i < 40; i++) { try { const j = await (await fetch('http://127.0.0.1:9334/json')).json(); const p = j.find((t) => t.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await dorme(250); }
const s = new WebSocket(ws); await new Promise((r) => (s.onopen = r));
let id = 0; const pend = {}; const frames = []; let t0 = 0;
s.onmessage = (m) => { const d = JSON.parse(m.data);
  if (d.method === 'Page.screencastFrame') { const n = frames.length; writeFileSync(`${DIR}/frames/${String(n).padStart(5, '0')}.jpg`, Buffer.from(d.params.data, 'base64'));
    frames.push(d.params.metadata.timestamp); cmd('Page.screencastFrameAck', { sessionId: d.params.sessionId }); }
  if (pend[d.id]) { pend[d.id](d.result); delete pend[d.id]; } };
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; s.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
const agora = () => Date.now() / 1000 - t0;
const toques = []; const marcas = {};
async function toca(sel, rotulo) {
  const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'nearest'}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  if (!r) throw new Error('sem ' + sel);
  toques.push({ t: agora(), x: r.x, y: r.y, rotulo }); console.log('toque', rotulo, agora().toFixed(2));
  await dorme(350);
  for (const type of ['mousePressed', 'mouseReleased']) await cmd('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
}
await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DIR + '/dl' });
await cmd('Page.enable');
await cmd('Page.navigate', { url: URL + '?r=' + Date.now() });
await dorme(1200);
await ev(`localStorage.clear()`);
await cmd('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 });
t0 = Date.now() / 1000;
await dorme(4500); marcas.chegada = agora();
await toca('#abrir-sorteio', 'cartao'); await dorme(1300);
await toca('#nome', 'nome'); await dorme(400); marcas.digita = agora();
for (const c of 'SMUFDPJ') { await cmd('Input.insertText', { text: c }); await ev(`document.querySelector('#nome').dispatchEvent(new Event('input',{bubbles:true}))`); await dorme(170); }
await dorme(700);
await toca('#shows [data-show="2"]', 'noite'); await dorme(1100);
await toca('#sortear', 'sortear'); marcas.sorteou = agora();
await dorme(14000); marcas.folhaPronta = agora();
const sorte = await ev(`document.querySelector('#sorte')?.innerText`);
const lista = await ev(`document.querySelector('#lidas')?.innerText || document.querySelector('#lista')?.innerText`);
// rola até as cartas de sorte, devagar
const alvoY = await ev(`document.querySelector('#sorte').getBoundingClientRect().top + scrollY - 120`);
const y0 = await ev('scrollY'); marcas.rolaCartas = agora();
for (let i = 1; i <= 40; i++) { await ev(`scrollTo(0, ${y0 + (alvoY - y0) * (1 - Math.cos(Math.PI * i / 40)) / 2})`); await dorme(40); }
await dorme(3500);
const yb = await ev(`document.querySelector('#story-video').getBoundingClientRect().top + scrollY - 500`);
const y1 = await ev('scrollY');
for (let i = 1; i <= 30; i++) { await ev(`scrollTo(0, ${y1 + (yb - y1) * (1 - Math.cos(Math.PI * i / 30)) / 2})`); await dorme(40); }
await dorme(900);
await toca('#story-video', 'baixar'); marcas.baixar = agora();
let pronto = false;
for (let i = 0; i < 120 && !pronto; i++) { await dorme(500); pronto = await ev(`[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Postar no story' && b.offsetParent)`); }
marcas.videoPronto = agora(); await dorme(1500);
await ev(`window.__p=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Postar no story'); window.__p.id='postar-x'`);
await toca('#postar-x', 'postar'); await dorme(6000); marcas.fim = agora();
await cmd('Page.stopScreencast'); await dorme(300);
writeFileSync(DIR + '/toques.json', JSON.stringify({ frames: frames.map((t) => t - frames[0]), base: frames[0] - t0, toques, marcas, sorte, lista }, null, 1));
console.log('frames', frames.length, 'sorte:\n' + sorte); chrome.kill(); process.exit(0);
