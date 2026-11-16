// Tira os prints do gerador (390x844, DPR 3) pra montar o carrossel tutorial.
// Uso: node prints.mjs [url]   (padrão: servidor local na 8123, pra não sujar o painel de uso)
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
const URL = process.argv[2] || 'http://localhost:8123/setlist-ibirapuera/';
const DIR = new globalThis.URL('./prints/', import.meta.url).pathname;
mkdirSync(DIR + 'dl-pamela', { recursive: true });
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=9335',
  '--autoplay-policy=no-user-gesture-required', '--user-data-dir=/private/tmp/claude-501/cdp-prints-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
setTimeout(() => { console.log('TIMEOUT'); chrome.kill(); process.exit(1); }, 150000);
let ws; for (let i = 0; i < 40; i++) { try { const j = await (await fetch('http://127.0.0.1:9335/json')).json(); const p = j.find((t) => t.type === 'page'); if (p) { ws = p.webSocketDebuggerUrl; break; } } catch {} await dorme(250); }
const s = new WebSocket(ws); await new Promise((r) => (s.onopen = r));
let id = 0; const pend = {};
s.onmessage = (m) => { const d = JSON.parse(m.data); if (pend[d.id]) { pend[d.id](d.result); delete pend[d.id]; } };
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; s.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => (await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
async function toca(sel) {
  const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)}); if(!e) return null; e.scrollIntoView({block:'nearest'}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  if (!r) throw new Error('sem ' + sel);
  for (const type of ['mousePressed', 'mouseReleased']) await cmd('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
}
async function print(nome) {
  const r = await cmd('Page.captureScreenshot', { format: 'png' });
  writeFileSync(DIR + nome + '.png', Buffer.from(r.data, 'base64')); console.log('print', nome);
}
async function rola(sel, folga) { await ev(`scrollTo(0, document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect().top + scrollY - ${folga})`); await dorme(900); }

await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DIR + 'dl-pamela' });
await cmd('Page.enable');
await cmd('Page.navigate', { url: URL + '?r=' + Date.now() });
await dorme(1200); await ev(`localStorage.clear()`);
await dorme(5500); await print('1-chegada');
await toca('#abrir-sorteio'); await dorme(1300);
await toca('#nome'); await dorme(300);
for (const c of 'PAMELA') { await cmd('Input.insertText', { text: c }); await ev(`document.querySelector('#nome').dispatchEvent(new Event('input',{bubbles:true}))`); await dorme(120); }
await toca('#shows [data-show="1"]'); await dorme(1200); await print('2-nome-noite');
await toca('#sortear'); await dorme(15000); await ev('scrollTo(0,0)'); await dorme(800); await print('3-folha');
await rola('#lidas', 90); await print('4-lista');
await rola('#sorte', 90); await print('5-sorte');
await rola('#story', 420); await print('6-baixar');
await toca('#story'); await dorme(6000);
writeFileSync(DIR + 'sorte.txt', String(await ev(`document.querySelector('#sorte')?.innerText`)));
// tela de montar à mão, numa visita nova
await cmd('Page.navigate', { url: URL + '?m=' + Date.now() }); await dorme(5000);
await toca('#ir-montar'); await dorme(1500); await print('7-montar');
chrome.kill(); process.exit(0);
