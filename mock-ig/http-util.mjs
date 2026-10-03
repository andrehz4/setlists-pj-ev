// Utilitários HTTP do mock: respostas (devolvem true = requisição atendida), uso horário e mídia local.
import fs from "node:fs";
import path from "node:path";
import { hourlyUsage } from "./uso.mjs";

export { USERS, HOURLY_LIMIT, ALARM_PCT, bumpCall, hourlyUsage } from "./uso.mjs";

export const PORT = Number(process.env.MOCK_IG_PORT || 8788);
export const SERVE_ROOT = path.resolve(process.env.MOCK_SERVE_ROOT || process.cwd());

export const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".mp4": "video/mp4", ".webp": "image/webp", ".gif": "image/gif",
  ".json": "application/json; charset=utf-8", ".html": "text/html; charset=utf-8",
  // o front buildado (dist/) referencia JS/CSS como modulos: precisam do MIME
  // certo ou o navegador recusa (strict MIME pra module scripts).
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

export function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, { "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store", ...headers });
  res.end(payload);
  return true;
}

export function sendJson(res, status, obj) {
  return send(res, status, obj, { "Content-Type": "application/json; charset=utf-8" });
}

// Resposta Graph COM o header x-app-usage (como a Meta real manda). call_count
// e o % do uso horario no mock. Assim o pipeline pode ler o header e logar.
export function sendGraph(res, status, obj, store) {
  const u = hourlyUsage(store);
  const appUsage = JSON.stringify({ call_count: u.pct, total_time: u.pct, total_cputime: Math.round(u.pct / 2) });
  return send(res, status, obj, { "Content-Type": "application/json; charset=utf-8", "x-app-usage": appUsage });
}

// Erro tipado da Graph API. code 4 = limite da app (rate limit), code 100 =
// objeto inexistente, etc. Formato exato que o cliente (classifyIGError) le.
// Com store, manda tambem o x-app-usage (a Meta real manda header de uso
// inclusive em respostas de erro).
export function graphError(res, status, { code, subcode, message }, store) {
  const headers = { "Content-Type": "application/json; charset=utf-8" };
  if (store) {
    const u = hourlyUsage(store);
    headers["x-app-usage"] = JSON.stringify({ call_count: u.pct, total_time: u.pct, total_cputime: Math.round(u.pct / 2) });
  }
  return send(res, status, {
    error: {
      message: message || "Mock Graph API error",
      type: "OAuthException",
      code,
      error_subcode: subcode,
      fbtrace_id: "mock-trace",
    },
  }, headers);
}

// Modo de falha: query ?fail= (por request) > store.control (setado via
// POST /_mock/fail) > env MOCK_IG_FAIL. Permite testar cooldown, quota,
// erro de video.
export function failMode(store, query) {
  if (query.fail) return query.fail;
  if (store.control && store.control.fail) return store.control.fail;
  return process.env.MOCK_IG_FAIL || null;
}

export async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString("utf8");
  // o cliente manda form (application/x-www-form-urlencoded via got form:)
  const params = new URLSearchParams(raw);
  const obj = {};
  for (const [k, v] of params) obj[k] = v;
  return obj;
}

// Serve um arquivo do disco sob SERVE_ROOT (o "IG" busca a imagem/video aqui).
export function serveFile(res, urlPath) {
  const rel = decodeURIComponent(urlPath.replace(/^\/+/, ""));
  const filePath = path.join(SERVE_ROOT, rel);
  // path.sep no sufixo evita o bypass de prefixo irmao (/repo vs /repo-x)
  if (!filePath.startsWith(SERVE_ROOT + path.sep)) return send(res, 403, "forbidden");
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, "not found: " + urlPath);
    const ext = path.extname(filePath).toLowerCase();
    send(res, 200, fs.readFileSync(filePath), { "Content-Type": MIME[ext] || "application/octet-stream" });
  });
  return true; // resposta sai no callback do stat
}

// Valida que a midia do container e alcancavel, como o IG real faz (ele baixa
// a image_url/video_url na criacao do container; URL quebrada = erro 9004).
// So checa URLs locais (o proprio mock servindo do disco): URL externa ou de
// host fake (http://x/...) passa sem checagem, pra nao bater na internet nem
// quebrar testes unitarios que usam URLs de mentira de hosts nao-locais.
// Retorna null se OK/pulado, ou a string de erro.
export async function checkLocalMedia(mediaUrl) {
  if (!mediaUrl) return null;
  let u;
  try { u = new URL(mediaUrl); } catch { return `URL invalida: ${mediaUrl}`; }
  if (u.hostname !== "127.0.0.1" && u.hostname !== "localhost") return null;
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 3000);
    const r = await fetch(mediaUrl, { method: "HEAD", signal: ctl.signal });
    clearTimeout(timer);
    if (r.status >= 400) return `HTTP ${r.status} ao buscar ${mediaUrl}`;
    return null;
  } catch (e) {
    return `falha ao buscar ${mediaUrl}: ${e.message}`;
  }
}
