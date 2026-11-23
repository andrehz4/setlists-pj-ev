// Cliente mínimo do Chrome DevTools Protocol (sem puppeteer): sobe o Chrome headless, abre uma aba e manda comandos.
// Usado pra fotografar o reel do Claude Design quadro a quadro (quadros.mjs).
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const CANDIDATOS = [process.env.CHROME_BIN, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium-browser", "/usr/bin/chromium"].filter(Boolean);
export const chromeBin = () => CANDIDATOS.find((c) => fs.existsSync(c)) || null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

export async function abrirChrome({ largura = 1080, altura = 1920 } = {}) {
  const bin = chromeBin();
  if (!bin) throw new Error("Chrome não encontrado (defina CHROME_BIN)");
  const perfil = fs.mkdtempSync(path.join(os.tmpdir(), "agenda-reel-chrome-"));
  const proc = spawn(bin, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${perfil}`, "--no-first-run",
    "--hide-scrollbars", "--mute-audio", "--disable-gpu", "--no-sandbox", `--window-size=${largura},${altura}`, "about:blank"],
  { stdio: "ignore" });
  const arqPorta = path.join(perfil, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(arqPorta); i++) await espera(100);
  if (!fs.existsSync(arqPorta)) { proc.kill(); throw new Error("Chrome não abriu a porta de depuração"); }
  const [porta, caminho] = fs.readFileSync(arqPorta, "utf8").trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${porta}${caminho}`);
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro; });

  let seq = 0;
  const pendentes = new Map(), ouvintes = [];
  ws.onmessage = (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pendentes.has(msg.id)) {
      const { ok, erro } = pendentes.get(msg.id);
      pendentes.delete(msg.id);
      msg.error ? erro(new Error(`${msg.error.message} ${msg.error.data || ""}`)) : ok(msg.result);
    } else if (msg.method) ouvintes.forEach((f) => f(msg));
  };
  const enviar = (method, params = {}, sessionId) => new Promise((ok, erro) => {
    const id = ++seq;
    pendentes.set(id, { ok, erro });
    ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
  });

  const { targetId } = await enviar("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await enviar("Target.attachToTarget", { targetId, flatten: true });
  const aba = (method, params) => enviar(method, params, sessionId);
  await aba("Page.enable");
  await aba("Runtime.enable");
  // Render 100% local: CDN e Google Fonts bloqueados (o servidor local 127.0.0.1 segue liberado); se faltar arquivo, falha aqui.
  await aba("Network.enable");
  await aba("Network.setBlockedURLs", { urls: ["*unpkg.com*", "*jsdelivr.net*", "*cdnjs.cloudflare.com*", "*googleapis.com*", "*gstatic.com*"] });
  await aba("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: 1, mobile: false });
  // fundo transparente: o PNG sai com alfa e o clipe real entra por baixo no ffmpeg
  await aba("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });

  const logs = [];
  ouvintes.push((m) => {
    if (m.method === "Runtime.exceptionThrown") logs.push(m.params.exceptionDetails?.exception?.description || "erro na página");
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") logs.push(m.params.args.map((a) => a.value ?? a.description).join(" "));
  });

  async function avaliar(expr) {
    const r = await aba("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  }
  async function esperarAte(expr, ms = 60000) {
    const fim = Date.now() + ms;
    while (Date.now() < fim) { if (await avaliar(expr)) return; await espera(150); }
    throw new Error(`tempo esgotado esperando: ${expr}\n${logs.slice(-5).join("\n")}`);
  }
  async function foto({ x = 0, y = 0, w = largura, h = altura } = {}) {
    const { data } = await aba("Page.captureScreenshot", { format: "png", clip: { x, y, width: w, height: h, scale: 1 }, fromSurface: true });
    return Buffer.from(data, "base64");
  }
  const navegar = (url) => aba("Page.navigate", { url });
  const fechar = () => { try { ws.close(); } catch {} proc.kill();
    setTimeout(() => { try { fs.rmSync(perfil, { recursive: true, force: true }); } catch {} }, 500).unref(); };
  return { aba, avaliar, esperarAte, foto, navegar, fechar, logs };
}
