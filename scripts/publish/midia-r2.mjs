// Mídia de publicação no Cloudflare R2 (bucket smufdpj-midia). O IG e o FB não
// recebem o arquivo: baixam por um link público na hora de publicar. Antes o
// link era o raw do GitHub, então todo MP4 entrava no histórico do git (repo
// passou de 1 GB). Agora o vídeo sobe pro R2, o IG baixa de lá e o próprio R2
// apaga em 3 dias (regra de ciclo de vida do bucket, não é código nosso).
//
// Liga sozinho quando os secrets existem: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY, R2_MIDIA_BUCKET, R2_MIDIA_PUBLIC_BASE. Sem eles (ou se o
// envio falhar) o chamador volta pro jeito antigo (commit + raw do GitHub).
// Assinatura S3 SigV4 feita à mão (sem SDK), igual ao backend/app/contrib/r2.py.

import fs from "node:fs/promises";
import crypto from "node:crypto";

const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");
const hmac = (k, s) => crypto.createHmac("sha256", k).update(s).digest();

export function configR2(env = process.env) {
  const c = {
    conta: env.R2_ACCOUNT_ID, chave: env.R2_ACCESS_KEY_ID, segredo: env.R2_SECRET_ACCESS_KEY,
    bucket: env.R2_MIDIA_BUCKET, publico: (env.R2_MIDIA_PUBLIC_BASE || "").replace(/\/+$/, ""),
  };
  return Object.values(c).every(Boolean) ? c : null;
}

// Cabeçalhos assinados (SigV4, região "auto", payload com hash real).
export function assinar({ metodo, host, caminho, corpo = Buffer.alloc(0), tipo = "", chave, segredo, agora = new Date() }) {
  const amz = agora.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dia = amz.slice(0, 8);
  const hashCorpo = sha256(corpo);
  const cab = { host, "x-amz-content-sha256": hashCorpo, "x-amz-date": amz, ...(tipo ? { "content-type": tipo } : {}) };
  const nomes = Object.keys(cab).sort();
  const canonico = [metodo, caminho, "", ...nomes.map((n) => `${n}:${cab[n]}`), "", nomes.join(";"), hashCorpo].join("\n");
  const escopo = `${dia}/auto/s3/aws4_request`;
  const aAssinar = ["AWS4-HMAC-SHA256", amz, escopo, sha256(canonico)].join("\n");
  const k = hmac(hmac(hmac(hmac(`AWS4${segredo}`, dia), "auto"), "s3"), "aws4_request");
  const assinatura = crypto.createHmac("sha256", k).update(aAssinar).digest("hex");
  return { ...cab, authorization: `AWS4-HMAC-SHA256 Credential=${chave}/${escopo}, SignedHeaders=${nomes.join(";")}, Signature=${assinatura}` };
}

const TIPOS = { ".mp4": "video/mp4", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png" };

// Sobe o arquivo e devolve a URL pública. chaveObjeto ex: "reels/2026-W40.mp4".
export async function enviarR2(arquivoLocal, chaveObjeto, { env = process.env, fetchImpl = fetch } = {}) {
  const c = configR2(env);
  if (!c) throw new Error("R2 não configurado");
  const corpo = await fs.readFile(arquivoLocal);
  const tipo = TIPOS[(chaveObjeto.match(/\.[a-z0-9]+$/i) || [""])[0].toLowerCase()] || "application/octet-stream";
  const host = `${c.conta}.r2.cloudflarestorage.com`;
  const caminho = `/${c.bucket}/${chaveObjeto.split("/").map(encodeURIComponent).join("/")}`;
  const headers = assinar({ metodo: "PUT", host, caminho, corpo, tipo, chave: c.chave, segredo: c.segredo });
  const res = await fetchImpl(`https://${host}${caminho}`, { method: "PUT", headers, body: corpo, signal: AbortSignal.timeout(120000) });
  if (!res.ok) throw new Error(`R2 PUT ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return `${c.publico}/${chaveObjeto}`;
}

// Espera o link público responder (o IG baixa na hora; link quebrado = post recusado).
export async function aguardarPublico(url, { tentativas = 10, fetchImpl = fetch } = {}) {
  for (let i = 0; i < tentativas; i++) {
    try { const r = await fetchImpl(url, { method: "HEAD" }); if (r.ok) return true; } catch { /* tenta de novo */ }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return false;
}

// Atalho pros publicadores: tenta o R2; se não der, devolve null e o chamador
// segue no caminho antigo (commit + raw do GitHub).
export async function publicarViaR2(arquivoLocal, chaveObjeto, opts = {}) {
  if (!configR2(opts.env)) return null;
  try {
    const url = await enviarR2(arquivoLocal, chaveObjeto, opts);
    if (!(await aguardarPublico(url, opts))) throw new Error(`link público não respondeu: ${url}`);
    console.log(`[r2] ${chaveObjeto} -> ${url}`);
    return url;
  } catch (e) {
    console.warn(`[r2] falhou, volta pro GitHub: ${e.message}`);
    return null;
  }
}
