// Cliente mínimo do ElevenLabs (text-to-speech). Modelo Eleven v4 em
// português: pronuncia nome em inglês (Pearl Jam, Eddie Vedder) sozinho, numa
// fala só, sem emenda. Plano grátis: uso não comercial, com crédito na legenda.

import fs from "node:fs/promises";

const API = "https://api.elevenlabs.io/v1";
export const MODELO = "eleven_v4";

// Vozes da própria conta (o plano grátis não usa vozes da biblioteca pela API).
// Aprovadas pelo Andre em 2026-09-30; revezam por semana ISO.
export const VOZES = [
  { nome: "Jessica", id: "cgSgspJ2msm6clMCkdW9" },
  { nome: "Liam", id: "TX3LPaxmHKxFdv7VOQHJ" },
];

// "2026-W40" -> semana par = Jessica, ímpar = Liam.
export function vozDaSemana(weekKey) {
  const n = Number(String(weekKey).split("-W")[1]) || 0;
  return VOZES[n % VOZES.length];
}

// Saldo da conta: { usados, limite, restante } ou null (sem permissão/erro de rede).
export async function saldo({ apiKey, fetchImpl = fetch }) {
  try {
    const res = await fetchImpl(`${API}/user/subscription`, { headers: { "xi-api-key": apiKey }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const s = await res.json();
    const usados = Number(s.character_count), limite = Number(s.character_limit);
    if (!Number.isFinite(usados) || !Number.isFinite(limite)) return null;
    return { usados, limite, restante: limite - usados };
  } catch { return null; }
}

// Grava o MP3 da fala em destino. fetchImpl injetável pros testes.
export async function sintetizar(texto, { vozId, apiKey, destino, fetchImpl = fetch, tentativas = 2 }) {
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const res = await fetchImpl(`${API}/text-to-speech/${vozId}?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ text: texto, model_id: MODELO, language_code: "pt" }),
        signal: AbortSignal.timeout(60000),
      });
      if (!res.ok) {
        const corpo = (await res.text()).slice(0, 200);
        const erro = new Error(`ElevenLabs HTTP ${res.status}: ${corpo}`);
        if (res.status < 500 && res.status !== 429) throw Object.assign(erro, { definitivo: true });
        throw erro;
      }
      await fs.writeFile(destino, Buffer.from(await res.arrayBuffer()));
      return destino;
    } catch (e) {
      ultimoErro = e;
      if (e.definitivo) break; // 401/402/422: repetir não adianta
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
  throw ultimoErro;
}
