// Imagem da cápsula no site (card e página da notícia): a FOTO usada na capa (cap.img, retrato da pasta
// media/band/), e não a capa pronta do Instagram (que tem moldura, título e textura e vira um recorte estranho
// no card). Sem foto local, cai pra capa como antes.
import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../../config.mjs";

export async function imagemDoSite(cap, capaPronta, destino) {
  const foto = cap.img && !/^https?:/.test(cap.img) ? naRaiz(cap.img.replace(/^\//, "")) : null;
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  if (foto && fs.existsSync(foto)) {
    const { default: sharp } = await import("sharp");
    await sharp(foto).rotate().resize({ width: 1280, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(destino);
    return "foto";
  }
  fs.copyFileSync(capaPronta, destino);
  return "capa";
}
