// Curadoria por IA dos posts de colaboradores. Roda no cron contrib-curadoria.yml.
//
// 1. Avisa o Andre no Telegram de pedidos de acesso novos.
// 2. Pega a fila (/contrib/bot/fila), prepara a mídia, pede a análise ao Gemini,
//    aplica as travas de veredito.mjs e grava o veredito no backend.
// Falha num envio não trava os outros: ele continua "enviado" e volta na próxima rodada.
//
// Uso: node scripts/contrib/curar.mjs [--dry]   (--dry mostra o veredito e não grava nada)

import { avaliar } from "./gemini-curador.mjs";
import { prepararMidia } from "./midia.mjs";
import { decidir, resumoTelegram } from "./veredito.mjs";
import { bot, telegram } from "./api.mjs";

const CHAVE = process.env.CONTRIB_BOT_KEY;
const DRY = process.argv.includes("--dry");
const ORIGEM = "https://setlists-pj-ev.pages.dev";

const horaBrt = (iso) => {
  const d = new Date(new Date(iso).getTime() - 3 * 3600e3);
  return `${d.getUTCHours()}h${String(d.getUTCMinutes()).padStart(2, "0")}`;
};

async function main() {
  if (!CHAVE) return console.log("CONTRIB_BOT_KEY ausente: curadoria de colaboradores desligada.");
  let fila;
  try {
    fila = await bot("/fila");
  } catch (e) {
    if ([403, 404].includes(e.status)) return console.log(`Painel de colaboradores desligado (${e.status}).`);
    throw e;
  }

  if (!DRY) {
    for (const p of await bot("/pedidos")) {
      await telegram(`🙋 Pedido de acesso de colaborador: ${p.nome || "sem nome"} (${p.email}).\nAprovar em ${ORIGEM}/colaborar (aba Pessoas).`);
    }
  }

  console.log(`Fila de curadoria: ${fila.length} envio(s).`);
  let falhas = 0;
  for (const envio of fila) {
    try {
      const partes = await prepararMidia(envio);
      const v = decidir(envio, await avaliar(envio, partes));
      console.log(`${envio.id} -> ${v.decisao}${v.motivo ? `: ${v.motivo}` : ""}`);
      if (DRY) { console.log(JSON.stringify(v, null, 2)); continue; }
      await bot(`/veredito/${envio.id}`, {
        decisao: v.decisao, titulo: v.titulo, texto: v.texto, legendas: v.legendas, motivo: v.motivo, analise: v.analise,
      });
      await telegram(resumoTelegram(envio, v, horaBrt(envio.scheduled_at)));
    } catch (e) {
      falhas++;
      console.error(`${envio.id} falhou:`, e.message);
      if (e.status !== 409) await telegram(`⚠️ Curadoria de colaborador falhou (${envio.title}): ${e.message}. Tento de novo na próxima rodada.`);
    }
  }
  if (falhas) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
