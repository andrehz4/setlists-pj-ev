// Grava de uma vez as aberturas e finais de todas as vozes (3 + 3 por voz) em
// media/news/instagram-reels/narracao/. Rodar só quando mudar frase ou voz:
//   ELEVENLABS_API_KEY="$(cat /Users/andrehz/.elevenlabs-key)" node scripts/publish/narracao/gravar-fixas.mjs
import fs from "node:fs/promises";
import { ABERTURAS, FINAIS } from "./fala.mjs";
import { VOZES, sintetizar } from "./elevenlabs.mjs";
import { arquivoFixo, DIR_FIXAS } from "./narracao.mjs";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) throw new Error("falta ELEVENLABS_API_KEY");
await fs.mkdir(DIR_FIXAS, { recursive: true });
for (const voz of VOZES) {
  for (const texto of [...ABERTURAS, ...FINAIS]) {
    const destino = arquivoFixo(texto, voz);
    if (await fs.stat(destino).then(() => true, () => false)) continue;
    await sintetizar(texto, { vozId: voz.id, apiKey, destino });
    console.log(`[fixas] ${voz.nome}: ${texto}`);
  }
}
