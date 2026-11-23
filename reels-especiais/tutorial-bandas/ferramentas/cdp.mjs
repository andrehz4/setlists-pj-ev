// Chrome headless via CDP: abre, grava screencast em frames/ e registra toques reais (390x844, DPR 2).
import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
export const dorme = (ms) => new Promise((r) => setTimeout(r, ms));
let porta = 9340 + Math.floor(Math.random() * 600); // porta sorteada: o Chrome da gravação anterior pode ainda estar fechando
export async function abrir(DIR, { antes = '' } = {}) {
  mkdirSync(DIR + '/frames', { recursive: true });
  const p = porta++;
  const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', `--remote-debugging-port=${p}`,
    '--autoplay-policy=no-user-gesture-required', '--user-data-dir=/private/tmp/claude-501/cdp-bl-' + Date.now() + p, 'about:blank'], { stdio: 'ignore' });
  let ws; for (let i = 0; i < 40; i++) { try { const j = await (await fetch(`http://127.0.0.1:${p}/json`)).json(); const pg = j.find((t) => t.type === 'page'); if (pg) { ws = pg.webSocketDebuggerUrl; break; } } catch {} await dorme(250); }
  const s = new WebSocket(ws); await new Promise((r) => (s.onopen = r));
  let id = 0; const pend = {}; const frames = []; let t0 = 0;
  const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend[i] = r; s.send(JSON.stringify({ id: i, method, params })); });
  s.onmessage = (m) => { const d = JSON.parse(m.data);
    if (d.method === 'Page.screencastFrame') { writeFileSync(`${DIR}/frames/${String(frames.length).padStart(5, '0')}.jpg`, Buffer.from(d.params.data, 'base64'));
      frames.push(d.params.metadata.timestamp); cmd('Page.screencastFrameAck', { sessionId: d.params.sessionId }); }
    if (pend[d.id]) { pend[d.id](d.result); delete pend[d.id]; } };
  const ev = async (expr) => (await cmd('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result?.value;
  const agora = () => Date.now() / 1000 - t0;
  const toques = []; const marcas = {};
  await cmd('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 2, mobile: true });
  await cmd('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: DIR + '/dl' });
  await cmd('Page.enable');
  if (antes) await cmd('Page.addScriptToEvaluateOnNewDocument', { source: antes });
  const api = {
    cmd, ev, agora, marcas, toques,
    async ir(url) { await cmd('Page.navigate', { url }); await dorme(1500); },
    async gravar() { await cmd('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 780, maxHeight: 1688, everyNthFrame: 1 }); t0 = Date.now() / 1000; },
    marca(n) { marcas[n] = agora(); console.log('marca', n, agora().toFixed(2)); },
    async toca(sel, rotulo = sel) {
      const r = await ev(`(()=>{const e=${sel.startsWith('js:') ? sel.slice(3) : `document.querySelector(${JSON.stringify(sel)})`}; if(!e) return null; e.scrollIntoView({block:'nearest'}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
      if (!r) throw new Error('sem ' + sel);
      await dorme(350); toques.push({ t: agora(), x: r.x, y: r.y, rotulo }); console.log('toque', rotulo, agora().toFixed(2));
      for (const type of ['mousePressed', 'mouseReleased']) await cmd('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
    },
    async digita(sel, txt, ms = 170) { for (const c of txt) { await cmd('Input.insertText', { text: c }); await dorme(ms); } },
    async rola(alvoExpr, passos = 36, ms = 40) {
      const alvo = await ev(alvoExpr); const y0 = await ev('scrollY');
      for (let i = 1; i <= passos; i++) { await ev(`scrollTo(0, ${y0 + (alvo - y0) * (1 - Math.cos(Math.PI * i / passos)) / 2})`); await dorme(ms); }
    },
    async fechar() {
      await cmd('Page.stopScreencast'); await dorme(300);
      writeFileSync(DIR + '/toques.json', JSON.stringify({ frames: frames.map((t) => t - frames[0]), base: frames[0] - t0, toques, marcas }, null, 1));
      console.log('frames', frames.length); chrome.kill();
    },
    matar() { chrome.kill(); },
  };
  return api;
}
// Monta frames/ + toques.json em video.mp4 de 30 fps respeitando o tempo real de cada quadro.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
export function montar(DIR) {
  const j = JSON.parse(readFileSync(DIR + '/toques.json'));
  let lista = ''; j.frames.forEach((t, i) => { const d = (j.frames[i + 1] ?? t + 0.5) - t; lista += `file 'frames/${String(i).padStart(5, '0')}.jpg'\nduration ${d.toFixed(4)}\n`; });
  lista += `file 'frames/${String(j.frames.length - 1).padStart(5, '0')}.jpg'\n`;
  writeFileSync(DIR + '/frames.txt', lista);
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', DIR + '/frames.txt', '-vf', 'fps=30,scale=780:1688:force_original_aspect_ratio=decrease,pad=780:1688:(ow-iw)/2:0', '-c:v', 'libx264', '-crf', '18', '-pix_fmt', 'yuv420p', DIR + '/video.mp4']);
}
