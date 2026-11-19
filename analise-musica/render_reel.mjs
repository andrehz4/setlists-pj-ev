// Renderiza o reel do Claude Design quadro a quadro (Chrome headless via DevTools Protocol, sem dependências).
// Uso: node render_reel.mjs <html> <saida.mp4> [fps=30]
// Cada quadro: evento de seek do modelo (data-om-seek-to-time-frame) -> espera os <video> acharem o quadro -> print.
import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const [html, saida, fpsArg] = process.argv.slice(2);
const FPS = Number(fpsArg || 30);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORTA = 9333;
const quadros = path.join(path.dirname(saida), "quadros");
fs.rmSync(quadros, { recursive: true, force: true });
fs.mkdirSync(quadros, { recursive: true });

const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORTA}`, "--allow-file-access-from-files",
  "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars", "--mute-audio", "--window-size=1080,1920",
  `--user-data-dir=${path.join(path.dirname(saida), ".chrome")}`, "about:blank"], { stdio: "ignore" });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let alvo;
for (let i = 0; i < 50 && !alvo; i++) {
  await espera(200);
  alvo = await fetch(`http://127.0.0.1:${PORTA}/json/list`).then((r) => r.json()).then((l) => l.find((t) => t.type === "page")).catch(() => null);
}
const ws = new WebSocket(alvo.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pend = new Map();
ws.addEventListener("message", (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const cdp = (method, params = {}) => new Promise((r) => { const id = ++seq; pend.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const avaliar = async (expr) => (await cdp("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;

await cdp("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await cdp("Page.navigate", { url: "file://" + path.resolve(html) });
for (let i = 0; i < 100; i++) { await espera(200); if (await avaliar("!!document.querySelector('[data-om-exportable-video-with-duration-secs]')")) break; }
await avaliar("document.fonts.ready.then(()=>true)");
await espera(1500);
const info = await avaliar(`(()=>{const e=document.querySelector('[data-om-exportable-video-with-duration-secs]');const r=e.getBoundingClientRect();return {d:+e.getAttribute('data-om-exportable-video-with-duration-secs'),x:r.x,y:r.y,w:r.width,h:r.height}})()`);
console.log("[render] palco", JSON.stringify(info));
const total = Math.round(info.d * FPS);
const SEEK = (t) => `(async()=>{const e=document.querySelector('[data-om-exportable-video-with-duration-secs]');
  e.dispatchEvent(new CustomEvent('data-om-seek-to-time-frame',{detail:{time:${t},sync:true}}));
  for(let i=0;i<2;i++) await new Promise(r=>requestAnimationFrame(r));
  const vs=[...document.querySelectorAll('video')]; const t0=performance.now();
  while(vs.some(v=>v.src&&(v.seeking||v.readyState<2)) && performance.now()-t0<3000) await new Promise(r=>setTimeout(r,15));
  await new Promise(r=>requestAnimationFrame(r)); return true})()`;
for (let f = 0; f < total; f++) {
  await avaliar(SEEK((f / FPS).toFixed(4)));
  const shot = await cdp("Page.captureScreenshot", { format: "jpeg", quality: 92,
    clip: { x: info.x, y: info.y, width: info.w, height: info.h, scale: 1080 / info.w } });
  fs.writeFileSync(path.join(quadros, String(f).padStart(5, "0") + ".jpg"), Buffer.from(shot.result.data, "base64"));
  if (f % 150 === 0) console.log(`[render] ${f}/${total}`);
}
ws.close(); chrome.kill();
execFileSync("ffmpeg", ["-v", "error", "-y", "-framerate", String(FPS), "-i", path.join(quadros, "%05d.jpg"),
  "-c:v", "libx264", "-crf", "18", "-pix_fmt", "yuv420p", "-vf", "scale=1080:1920", saida]);
console.log(`[render] ${total} quadros -> ${saida}`);
