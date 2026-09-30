// Assinatura OAuth 1.0a (HMAC-SHA1) das chamadas à API do X, feita à mão (sem
// SDK). É o método pra um robô postar na PRÓPRIA conta: 4 chaves do app
// (API Key/Secret + Access Token/Secret da seção "OAuth 1.0 Keys" do painel).
// Secrets: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET.

import crypto from "node:crypto";

// RFC 3986 (o encodeURIComponent deixa passar !'()*).
export const pct = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function credenciaisX(env = process.env) {
  const c = { chave: env.X_API_KEY, segredo: env.X_API_SECRET, token: env.X_ACCESS_TOKEN, tokenSegredo: env.X_ACCESS_SECRET };
  return Object.values(c).every(Boolean) ? c : null;
}

// Cabeçalho Authorization. `params` = query string + campos de formulário
// url-encoded (corpo JSON e multipart NÃO entram na assinatura).
export function assinaturaOAuth1({ metodo, url, params = {}, cred, nonce = crypto.randomBytes(16).toString("hex"), ts = Math.floor(Date.now() / 1000) }) {
  const oauth = {
    oauth_consumer_key: cred.chave, oauth_nonce: nonce, oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: String(ts), oauth_token: cred.token, oauth_version: "1.0",
  };
  const u = new URL(url);
  const todos = { ...Object.fromEntries(u.searchParams), ...params, ...oauth };
  const base = Object.keys(todos).sort().map((k) => `${pct(k)}=${pct(todos[k])}`).join("&");
  const baseUrl = `${u.origin}${u.pathname}`;
  const texto = [metodo.toUpperCase(), pct(baseUrl), pct(base)].join("&");
  const chaveHmac = `${pct(cred.segredo)}&${pct(cred.tokenSegredo)}`;
  oauth.oauth_signature = crypto.createHmac("sha1", chaveHmac).update(texto).digest("base64");
  return "OAuth " + Object.keys(oauth).sort().map((k) => `${pct(k)}="${pct(oauth[k])}"`).join(", ");
}
