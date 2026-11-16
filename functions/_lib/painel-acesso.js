// Porta do painel do contador: HTTP Basic Auth (o navegador pede usuário e senha). As credenciais ficam nos segredos
// PAINEL_USUARIO e PAINEL_SENHA do Cloudflare Pages, nunca no git. Sem os dois configurados o painel não abre (503).
export const DESAFIO = 'Basic realm="Painel", charset="UTF-8"';

// Cabeçalho "Authorization: Basic <base64 de usuario:senha>" vira { usuario, senha } ou null.
export function credenciais(cabecalho) {
  const m = /^Basic\s+([A-Za-z0-9+/=]+)\s*$/i.exec(cabecalho || "");
  if (!m) return null;
  try {
    const texto = new TextDecoder("utf-8", { fatal: true }).decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0)));
    const i = texto.indexOf(":");
    return i < 0 ? null : { usuario: texto.slice(0, i), senha: texto.slice(i + 1) };
  } catch (e) { return null; }
}

// Compara sem vazar tempo nem tamanho: os dois lados viram SHA-256 e a diferença é somada byte a byte.
export async function igual(dado, certo) {
  const resumo = async (t) => new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(t))));
  const [a, b] = await Promise.all([resumo(dado), resumo(certo)]);
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a[i] ^ b[i];
  return dif === 0;
}

// "falta" = segredos não configurados, "negado" = sem credencial ou credencial errada, "ok" = pode entrar.
export async function acesso(request, env) {
  const usuario = env?.PAINEL_USUARIO, senha = env?.PAINEL_SENHA;
  if (typeof usuario !== "string" || !usuario || typeof senha !== "string" || !senha) return "falta";
  const c = credenciais(request.headers.get("Authorization"));
  // Confere os dois sempre (sem atalho), pra resposta levar o mesmo tempo com usuário certo ou errado.
  const [u, s] = await Promise.all([igual(c?.usuario ?? "", usuario), igual(c?.senha ?? "", senha)]);
  return c && u && s ? "ok" : "negado";
}
