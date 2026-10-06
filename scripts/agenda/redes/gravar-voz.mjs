// Grava as falas fixas do story por banda que ainda não existem (workflow agenda-voz.yml, com o secret da conta do
// projeto). Confere o saldo antes e para se a gravação passar do que sobra.
import fs from "node:fs/promises";
import { naRaiz } from "../../config.mjs";
import { lerEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { sintetizar, saldo } from "../../publish/narracao/elevenlabs.mjs";
import { VOZ, IDIOMA, DIR_VOZ, arquivoDaFala, falasNecessarias } from "./voz.mjs";

const DRY = process.argv.includes("--dry-run");
const apiKey = process.env.ELEVENLABS_API_KEY;
const { bandas } = await lerEstado(naRaiz("media/agenda/bandas.json"), { bandas: [] });
await fs.mkdir(DIR_VOZ, { recursive: true });
const existe = (f) => fs.stat(f).then(() => true, () => false);
const faltam = [];
for (const t of falasNecessarias(bandas.map((b) => b.nome))) if (!(await existe(arquivoDaFala(t)))) faltam.push(t);
const custo = faltam.reduce((a, t) => a + t.length, 0);
console.log(`[voz] ${faltam.length} fala(s) faltando, ~${custo} caracteres`);
faltam.forEach((t) => console.log(`  - ${t}`));
if (DRY || !faltam.length) process.exit(0);
if (!apiKey) throw new Error("falta ELEVENLABS_API_KEY");
const s = await saldo({ apiKey });
if (s && s.restante < custo + 500) throw new Error(`saldo baixo: ${s.restante} caracteres sobrando, precisa de ${custo}`);
for (const t of faltam) {
  await sintetizar(t, { vozId: VOZ.id, apiKey, destino: arquivoDaFala(t), idioma: IDIOMA });
  console.log(`[voz] ok: ${t}`);
}
await commitAndPush(["media/agenda/voz/"], `agenda: ${faltam.length} fala(s) fixa(s) do story por banda`);
