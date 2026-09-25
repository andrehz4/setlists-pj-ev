// Teste de fumaça da curadoria com o Gemini DE VERDADE (roda no Actions, onde está a chave).
// Gera 2 vídeos com fala em português: um limpo e outro com melodia de fundo.
// Esperado: limpo passa na regra 1 (música); com melodia, a regra 1 é violada ou incerta.
// Uso: node scripts/contrib/smoke.mjs   (precisa de ffmpeg e espeak-ng)

import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { avaliar } from "./gemini-curador.mjs";
import { decidir } from "./veredito.mjs";

const run = promisify(execFile);
const FALA = "Em agosto de mil novecentos e noventa e um saiu o Ten. Pouca gente lembra, mas a banda se chamava Mookie Blaylock, nome de um jogador de basquete.";
const MELODIA = "0.25*sin(2*PI*(220*pow(2,floor(mod(t*3,8))/12))*t)+0.15*sin(2*PI*110*t)*(mod(t,0.5)<0.1)";

async function montar(pasta, nome, comMusica) {
  const voz = join(pasta, "voz.wav");
  await run("espeak-ng", ["-v", "pt-br", "-s", "150", "-w", voz, FALA]);
  const saida = join(pasta, `${nome}.mp4`);
  const audio = comMusica
    ? ["-f", "lavfi", "-i", `aevalsrc=${MELODIA}:s=44100:d=12`, "-filter_complex", "[1:a][2:a]amix=inputs=2:duration=shortest[a]", "-map", "0:v", "-map", "[a]"]
    : ["-map", "0:v", "-map", "1:a"];
  await run("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x3b2d20:s=480x854:r=24:d=12", "-i", voz,
    ...audio, "-shortest", "-c:v", "libx264", "-crf", "32", "-c:a", "aac", saida]);
  return { inlineData: { mimeType: "video/mp4", data: (await readFile(saida)).toString("base64") } };
}

const envio = (titulo) => ({
  id: titulo, title: titulo, body: "Gravei uma curiosidade sobre o comecinho da banda, antes do primeiro disco.",
  media: [{ key: "x.mp4" }],
  video: { estilo: "palavra", trim_start: 0, trim_end: 12, legendas: [{ start: 0, end: 5, text: "Em agosto de 1991 saiu o Ten." }, { start: 5, end: 11, text: "A banda se chamava Mookie Blaylock." }] },
});

const pasta = await mkdtemp(join(tmpdir(), "smoke-"));
let ok = true;
for (const [nome, comMusica] of [["so-voz", false], ["voz-com-musica", true]]) {
  const e = envio(nome);
  const ia = await avaliar(e, [await montar(pasta, nome, comMusica)]);
  const v = decidir(e, ia);
  console.log(`\n== ${nome}: regra 1 = ${ia.regras?.musica?.status} (${ia.regras?.musica?.obs || ""}) -> ${v.decisao}`);
  console.log(`   IA: ${ia.resumo}`);
  const musicaOk = ia.regras?.musica?.status === "ok";
  if (comMusica === musicaOk) {
    ok = false;
    console.log(`   ✗ esperado regra 1 ${comMusica ? "violada/incerta" : "ok"}`);
  } else console.log("   ✓ como esperado");
}
process.exitCode = ok ? 0 : 1;
