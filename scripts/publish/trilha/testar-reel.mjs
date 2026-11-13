// Teste da trilha própria num reel JÁ RENDERIZADO: troca só o áudio (vídeo copiado), uma versão por cama.
// Uso: node scripts/publish/trilha/testar-reel.mjs <reel.mp4> <pasta-saida> [hz-pj-03b hz-pj-04a ...]
// Sem cama na linha de comando, gera com todas as camas do kit. Não publica nada.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { carregarKit, acharCama, iniciosCandidatos } from "./kit.mjs";
import { planoReel, golpesDoPlano } from "./plano.mjs";
import { montarTrilha, trocarAudio, escolherJanela } from "./mixar.mjs";

const [video, pasta, ...ids] = process.argv.slice(2);
if (!video || !pasta) {
  console.error("uso: node scripts/publish/trilha/testar-reel.mjs <reel.mp4> <pasta-saida> [cama ...]");
  process.exit(1);
}
const kit = carregarKit();
if (!kit) {
  console.error("trilha: kit não encontrado (SSD desligado?)");
  process.exit(1);
}
const dur = Number(spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video],
  { encoding: "utf8" }).stdout);
const plano = planoReel(8);
fs.mkdirSync(pasta, { recursive: true });
console.log(`reel ${path.basename(video)} ${dur.toFixed(1)} s | golpes em ${golpesDoPlano(plano).join(" s, ")} s`);
for (const id of ids.length ? ids : kit.camas.map((c) => c.id)) {
  const cama = acharCama(kit, id);
  const { inicio, magro } = escolherJanela(cama, plano, iniciosCandidatos(cama, plano[1].de, dur));
  const trilha = montarTrilha({ cama, plano, inicio, magro, duracao: dur, saida: path.join(pasta, `${id}.m4a`) });
  const saida = trocarAudio({ video, trilha: trilha.saida, saida: path.join(pasta, `reel-${id}.mp4`) });
  console.log(`${id} (${cama.titulo}) trecho da faixa a partir de ${inicio.toFixed(1)} s, calmo em ${trilha.magro} -> ${saida}`);
}
