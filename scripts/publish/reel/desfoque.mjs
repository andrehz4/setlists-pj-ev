// Desfoque atrás da manchete no reel (o mesmo do story, desfoque-faixa.mjs). Cena de foto: versão desfocada da
// base do Ken Burns, recortada junto em cada quadro (render.mjs). Cena de clipe: máscara cinza que o ffmpeg usa
// (midia.mjs). Cenas sem texto sobre imagem (abertura, papel, final, fundo fantasma) ficam como estão.
import fs from "node:fs/promises";
import path from "node:path";
import { W, H } from "./base.mjs";
import { faixaDoTexto } from "./cenas-blocos.mjs";
import { desfoqueNoReel, desfocar, mascaraAlfa, mascaraCinza } from "../desfoque-faixa.mjs";

export const BRILHO_REEL = 0.7; // o véu da cena cinética já escurece; aqui é mais leve que no story

export async function prepararDesfoque(scene, ctx, dir) {
  if (!desfoqueNoReel() || !scene.item || ctx.ghost) return;
  const faixa = faixaDoTexto(scene.kind, scene.item, ctx.layout);
  if (!faixa) return;
  const y0 = Math.max(0, Math.round(faixa.y0)), y1 = Math.min(H, Math.round(faixa.y1));
  if (ctx.mode === "photo") {
    ctx.desfoque = {
      base: await desfocar(ctx.zoom.base, { brilho: BRILHO_REEL, escala: ctx.zoom.maxZoom }),
      mascara: await mascaraAlfa(W, H, y0, y1),
    };
  } else if (ctx.mode === "overlay") {
    ctx.mascaraPath = path.join(path.dirname(dir), `${path.basename(dir)}-mascara.png`);
    await fs.writeFile(ctx.mascaraPath, await mascaraCinza(W, H, y0, y1));
  }
}
