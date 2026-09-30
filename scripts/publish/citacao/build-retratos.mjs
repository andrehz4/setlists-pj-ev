// Gera os retratos recortados (media/band/retratos/<slug>-<n>.jpg) a partir
// do retratos.json. Rodar só quando mudar foto ou crop; o resultado é
// versionado e o publish só lê os .jpg prontos.
//   node scripts/publish/citacao/build-retratos.mjs

import path from "node:path";
import sharp from "sharp";
import { carregarCatalogo, arquivoRetrato } from "./retratos.mjs";

const FONTE = path.resolve("media/band/subjects");
const LADO = 600;

for (const [slug, p] of Object.entries(carregarCatalogo())) {
  for (let i = 0; i < p.fotos.length; i++) {
    const { src, crop: [left, top, lado] } = p.fotos[i];
    const dest = arquivoRetrato(slug, i + 1);
    await sharp(path.join(FONTE, src))
      .extract({ left, top, width: lado, height: lado })
      .resize(LADO, LADO)
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(dest);
    console.log(`[retratos] ${path.basename(dest)} <- ${src}`);
  }
}
