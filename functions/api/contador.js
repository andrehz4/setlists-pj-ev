// POST /api/contador: soma um evento do gerador de setlist do Ibirapuera (ver functions/_lib/contador.js).
// Módulo apartado: sem o binding CONTADOR_DB responde 204 e não faz nada. Nunca guarda IP nem cookie.
// O nome digitado no gerador (e o que o filtro barrou) vai pra tabela nomes: functions/_lib/contador-nomes.js.
import { validar, pedidoValido, somar, MAX_CORPO } from "../_lib/contador.js";
import { nomesDoCorpo, gravarNomes } from "../_lib/contador-nomes.js";

const vazio = (status) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });

export async function onRequestPost({ request, env, waitUntil }) {
  if (!env?.CONTADOR_DB) return vazio(204);
  if (Number(request.headers.get("Content-Length") || 0) > MAX_CORPO) return vazio(413);
  if (!pedidoValido(request)) return vazio(204); // robô ou outro site: finge que contou
  const texto = (await request.text()).slice(0, MAX_CORPO + 1);
  const ev = validar(texto);
  if (!ev) return vazio(400);
  // Responde já; a gravação termina por trás. Banco fora do ar não vira erro pro visitante.
  const grava = Promise.all([
    somar(env.CONTADOR_DB, ev).catch((e) => console.log("contador: não gravou", e?.message)),
    gravarNomes(env.CONTADOR_DB, ev, nomesDoCorpo(texto, ev.e)).catch((e) => console.log("contador: nome não gravou", e?.message)),
  ]);
  if (waitUntil) waitUntil(grava); else await grava;
  return vazio(204);
}
