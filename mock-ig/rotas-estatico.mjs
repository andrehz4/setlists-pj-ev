// Front buildado (mock-ig/web/dist) servido como fallback: SPA, rota desconhecida cai no index.
import fs from "node:fs";
import path from "node:path";
import { MIME, send } from "./http-util.mjs";

export async function rotasEstatico(c) {
  const { req, res, pathname, query, method } = c;
  // ---------- front buildado (dist/) como fallback ----------
  // Se o front foi buildado (mock-ig/web/dist), serve-o aqui, pra rodar o
  // preview sem o dev server do Vite. SPA: rotas desconhecidas caem no index.
  if (method === "GET") {
    const webDist = path.join(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "web", "dist");
    const rel = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    const candidate = path.join(webDist, rel);
    if (candidate.startsWith(webDist + path.sep) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      const ext = path.extname(candidate).toLowerCase();
      return send(res, 200, fs.readFileSync(candidate), { "Content-Type": MIME[ext] || "application/octet-stream" });
    }
    const indexHtml = path.join(webDist, "index.html");
    if (fs.existsSync(indexHtml)) {
      return send(res, 200, fs.readFileSync(indexHtml), { "Content-Type": MIME[".html"] });
    }
  }

  return false;
}
