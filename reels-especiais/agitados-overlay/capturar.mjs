// node capturar.mjs <html> <saida_dir> <t0> <t1> <fps>  -> PNG transparentes 1080x1920 (window.reel.seek)
import { spawn } from "node:child_process";
import fs from "node:fs";
const [html, out, t0, t1, fps] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const port = 9300 + Math.floor(Math.random() * 500);
const ch = spawn("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", ["--headless=new", `--remote-debugging-port=${port}`, "--user-data-dir=" + out + "/_perfil", "--hide-scrollbars", "--force-device-scale-factor=1", "--window-size=1080,1920", "about:blank"], { stdio: "ignore" });
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
let alvo;
for (let i = 0; i < 50 && !alvo; i++) { await espera(200); try { alvo = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((x) => x.type === "page"); } catch {} }
const ws = new WebSocket(alvo.webSocketDebuggerUrl); await new Promise((r) => (ws.onopen = r));
let id = 0; const pend = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } };
const cmd = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
await cmd("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await cmd("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await cmd("Page.navigate", { url: "file://" + html + "?raw" });
const ev = async (e) => (await cmd("Runtime.evaluate", { expression: e, awaitPromise: true, returnByValue: true })).result?.result?.value;
for (let i = 0; i < 100 && !(await ev("!!(window.reel && document.fonts.status==='loaded')")); i++) await espera(200);
await espera(800);
const a = +t0, b = +t1, f = +fps; let n = 0;
for (let t = a; t <= b + 1e-6; t = a + (++n) / f) {
  await ev(`window.reel.seek(${t.toFixed(4)}); new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
  const s = await cmd("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } });
  fs.writeFileSync(`${out}/f${String(n).padStart(5, "0")}.png`, Buffer.from(s.result.data, "base64"));
}
console.log("quadros:", n); ws.close(); ch.kill();
