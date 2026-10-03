// HTTP da Graph API do Instagram: base da API, URL pública dos slides, POST/GET e leitura dos
// cabeçalhos de uso (rate limit). IG_API_BASE aponta pro mock local (mock-ig/) sem mudar a lógica.
import got from "got";
import { GRAPH_IG } from "../../config.mjs";
import { classifyIGError } from "./erros.mjs";

const API_BASE = process.env.IG_API_BASE || GRAPH_IG;
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// URL pública do slide (o IG baixa a imagem pelo raw do GitHub).
export function slideUrlFor(itemId, suffix = "") {
  return `${REPO_PUBLIC_BASE}/media/news/instagram-slides/${encodeURIComponent(itemId)}${suffix}.jpg`;
}

// Credenciais: argumento explícito ou env.
export function credenciais({ igUserId, accessToken } = {}, quem = "IG") {
  const uid = igUserId || process.env.IG_USER_ID;
  const token = accessToken || process.env.IG_ACCESS_TOKEN;
  if (!uid || !token) throw new Error(`${quem}: IG_USER_ID e IG_ACCESS_TOKEN obrigatorios`);
  return { igUserId: uid, accessToken: token };
}

// Cabeçalhos de rate limit que a Meta manda: x-app-usage (limite da app, code 4) e
// x-business-use-case-usage (BUC do Instagram, code 80002). call_count é % do limite (0-100).
export function logUsageHeaders(headers, path) {
  if (!headers) return null;
  let out = null;
  try {
    const app = headers["x-app-usage"];
    if (app) {
      const u = typeof app === "string" ? JSON.parse(app) : app;
      if (u && u.call_count != null) {
        console.log(`[ig-usage] x-app-usage em ${path}: call_count=${u.call_count}% total_time=${u.total_time}% cputime=${u.total_cputime}%`);
      } else {
        console.log(`[ig-usage] x-app-usage em ${path} (cru, parse vazio): ${typeof app === "string" ? app : JSON.stringify(app)}`);
      }
      out = { ...(out || {}), app: u };
    }
    const buc = headers["x-business-use-case-usage"];
    if (buc) {
      console.log(`[ig-usage] x-business-use-case-usage em ${path} (cru): ${typeof buc === "string" ? buc : JSON.stringify(buc)}`);
      const b = typeof buc === "string" ? JSON.parse(buc) : buc;
      for (const arr of Object.values(b)) {
        const ig = Array.isArray(arr) ? arr.find((x) => x.type === "instagram") : null;
        if (ig) {
          console.log(`[ig-usage] >> instagram BUC: call_count=${ig.call_count}% regain=${ig.estimated_time_to_regain_access ?? "?"}min`);
          out = { ...(out || {}), instagram: ig };
        }
      }
    }
    // Nenhum dos dois: lista os x-* relacionados (a Meta pode ter mudado o nome). 1 vez por run.
    if (!app && !buc && !logUsageHeaders._warned) {
      const xHeaders = Object.keys(headers).filter((k) => /usage|rate|limit|throttle/i.test(k));
      console.log(`[ig-usage] sem x-app-usage/x-business-use-case-usage. Headers relacionados: ${xHeaders.length ? xHeaders.join(", ") : "nenhum"}`);
      logUsageHeaders._warned = true;
    }
  } catch (e) {
    console.warn(`[ig-usage] falha ao ler headers: ${e.message}`);
  }
  return out;
}

async function tratar(res, path) {
  logUsageHeaders(res.headers, path);
  if (res.statusCode >= 400) throw classifyIGError({ path, statusCode: res.statusCode, body: res.body });
  return res.body;
}

export async function postIG(path, body) {
  const res = await got.post(`${API_BASE}${path}`, {
    form: body,
    timeout: { request: 30000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  return tratar(res, path);
}

export async function getIG(path, searchParams) {
  const res = await got.get(`${API_BASE}${path}`, {
    searchParams,
    timeout: { request: 15000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  return tratar(res, path);
}
