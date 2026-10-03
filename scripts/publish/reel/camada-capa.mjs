// Exporta a camada REAL da capa do reel (o quadro da abertura aos 2,4 s: véu escuro,
// "Só Mais um Fã de PEARL JAM", SMUFDPJ, tarja e linha da semana) como PNG transparente
// 1080x1920. O baixa-clipehz desenha o vídeo vertical e põe esta camada por cima, pra
// prévia da "Capa de reel" sair igual ao reel. Rodar de novo se a abertura mudar.
//   node scripts/publish/reel/camada-capa.mjs [saida.png]
import "../fontconfig-boot.mjs";
import path from "node:path";
import sharp from "sharp";
import { measureText, F_ANTON, F_INTER_SB, F_INTER_XB } from "./base.mjs";
import { coldOpenSvg } from "./cenas-abertura-final.mjs";
import { CAPA_S } from "./transicoes.mjs";
import { naRaiz } from "../../config.mjs";

export const SAIDA = naRaiz("media/marca/camada-capa-reel.png");

async function main() {
  const saida = process.argv[2] || SAIDA;
  const letterWidths = [];
  for (const L of "SMUFDPJ") letterWidths.push(await measureText(L, { size: 230, family: F_ANTON }));
  const svg = coldOpenSvg(CAPA_S, {
    accent: "#a87f2c", itemCount: 8, rangeLabel: "24 A 30 SET", dark: 0.6, letterWidths, showChip: true,
    tarjaTextW: await measureText("AS NOTÍCIAS DA SEMANA", { size: 32, family: F_INTER_XB, weight: 800, letterSpacing: 32 * 0.16 }),
    chipTextW: await measureText("CLIPE · MUDO", { size: 24, family: F_INTER_SB, weight: 600, letterSpacing: 3.4 }),
    dur: 3.6,
  });
  await sharp(Buffer.from(svg)).png().toFile(saida);
  console.log(`[camada-capa] ${saida}`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
