// Grava as falas fixas do story por banda que ainda não existem (workflow agenda-voz.yml, com o secret da conta do
// projeto). Confere o saldo antes e para se a gravação passar do que sobra.
import fs from "node:fs/promises";
import { naRaiz } from "../../config.mjs";
import { lerEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { sintetizar, saldo } from "../../publish/narracao/elevenlabs.mjs";
import { spawnSync } from "node:child_process";
import { VOZ, IDIOMA, DIR_VOZ, arquivoDaFala, falasNecessarias, FINAIS } from "./voz.mjs";
import { encaixar } from "./story-banda/encaixe.mjs";

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
  // mede na hora: frase que não cabe no story de 21,3 s nem acelerada é avisada já na gravação
  const d = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivoDaFala(t)]).stdout.toString());
  const e = encaixar({ [FINAIS.includes(t) ? "final" : "abertura"]: d });
  const [r] = Object.values(e);
  console.log(`[voz] ok: ${t} (${d.toFixed(2)} s${r.atempo > 1 ? `, acelera ${r.atempo}x` : ""}${r.cabe ? "" : ", NÃO CABE: encurtar a frase"})`);
}
await commitAndPush(["media/agenda/voz/"], `agenda: ${faltam.length} fala(s) fixa(s) do story por banda`);
