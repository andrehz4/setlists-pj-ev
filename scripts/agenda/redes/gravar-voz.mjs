// Grava as falas fixas do story por banda que ainda não existem (workflow agenda-voz.yml, com o secret da conta do
// projeto). Confere o saldo antes e para se a gravação passar do que sobra.
import fs from "node:fs/promises";
import { naRaiz } from "../../config.mjs";
import { lerEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { sintetizar, saldo } from "../../publish/narracao/elevenlabs.mjs";
import { spawnSync } from "node:child_process";
import { VOZES, IDIOMA, DIR_VOZ, arquivoDaFala, falasNecessarias, FINAIS, FRASE_SEM_HORA } from "./voz.mjs";
import { encaixar } from "./story-banda/encaixe.mjs";

const DRY = process.argv.includes("--dry-run");
const apiKey = process.env.ELEVENLABS_API_KEY;
const { bandas } = await lerEstado(naRaiz("media/agenda/bandas.json"), { bandas: [] });
await fs.mkdir(DIR_VOZ, { recursive: true });
const existe = (f) => fs.stat(f).then(() => true, () => false);
const faltam = [];
const { shows } = await lerEstado(naRaiz("media/agenda/shows.json"), { shows: [] });
const ufs = [...new Set(shows.map((s) => s.uf).filter(Boolean))];
const SO = process.env.VOZ_SO; // gravar só uma voz (ex: VOZ_SO=Bella), pra dividir o gasto entre meses
for (const voz of VOZES.filter((v) => !SO || v.nome === SO))
  for (const t of falasNecessarias(bandas.map((b) => b.nome), ufs)) if (!(await existe(arquivoDaFala(t, voz)))) faltam.push({ t, voz });
const custo = faltam.reduce((a, f) => a + f.t.length, 0);
console.log(`[voz] ${faltam.length} fala(s) faltando, ~${custo} caracteres`);
faltam.forEach((f) => console.log(`  - [${f.voz.nome}] ${f.t}`));
if (DRY || !faltam.length) process.exit(0);
if (!apiKey) throw new Error("falta ELEVENLABS_API_KEY");
const s = await saldo({ apiKey });
if (s && s.restante < custo + 500) throw new Error(`saldo baixo: ${s.restante} caracteres sobrando, precisa de ${custo}`);
for (const { t, voz } of faltam) {
  await sintetizar(t, { vozId: voz.id, apiKey, destino: arquivoDaFala(t, voz), idioma: IDIOMA });
  // mede na hora: frase que não cabe no story de 21,3 s nem acelerada é avisada já na gravação
  const d = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", arquivoDaFala(t, voz)]).stdout.toString());
  const tipo = FINAIS.includes(t) ? "final" : /^O show é/.test(t) ? "estado" : /^E começa/.test(t) || t === FRASE_SEM_HORA ? "hora" : "abertura";
  const e = encaixar({ [tipo]: d });
  const [r] = Object.values(e);
  console.log(`[voz] ok: ${t} (${d.toFixed(2)} s${r.atempo > 1 ? `, acelera ${r.atempo}x` : ""}${r.cabe ? "" : ", NÃO CABE: encurtar a frase"})`);
}
await commitAndPush(["media/agenda/voz/"], `agenda: ${faltam.length} fala(s) fixa(s) do story por banda`);
