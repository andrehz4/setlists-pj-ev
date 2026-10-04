// Foto do card de cada banda em /agenda/: a foto de perfil do Instagram (vem na leitura da API), salva em preto e
// branco 640x480 em media/agenda/fotos/<conta>.jpg. A cor do card entra por CSS (duotone), então a mesma foto
// serve no tema claro e no escuro. Foto que a banda mandar: salvar como media/agenda/fotos/<conta>-manual.jpg
// (qualquer tamanho), que ela passa na frente da foto de perfil. Falha aqui nunca derruba a coleta.
import fs from "node:fs";
import path from "node:path";
import { naRaiz } from "../config.mjs";

export const PASTA_FOTOS = naRaiz("media/agenda/fotos");
// logo: foto de perfil do IG (quadrada, quase sempre o logo) entra inteira, 400x400 centrada sobre preto em 640x480.
// Sem logo (foto manual da banda): recorte 640x480 pelo ponto de interesse.
export async function tratarFoto(entrada, destino, { logo = false } = {}) {
  const { default: sharp } = await import("sharp"); // só aqui: sem sharp, falha a foto, não a coleta
  const img = sharp(entrada).rotate();
  if (logo) img.resize(400, 400, { fit: "contain", background: "#000" })
    .extend({ top: 40, bottom: 40, left: 120, right: 120, background: "#000" });
  else img.resize(640, 480, { fit: "cover", position: "attention" });
  await img.grayscale().normalise().jpeg({ quality: 78, mozjpeg: true }).toFile(destino);
  return destino;
}

// Devolve true se a foto da banda ficou disponível (manual tem prioridade; sem url e sem manual = false).
export async function atualizarFoto(conta, url, { fetchImpl = fetch } = {}) {
  fs.mkdirSync(PASTA_FOTOS, { recursive: true });
  const destino = path.join(PASTA_FOTOS, `${conta}.jpg`);
  const manual = path.join(PASTA_FOTOS, `${conta}-manual.jpg`);
  try {
    if (fs.existsSync(manual)) await tratarFoto(manual, destino);
    else if (url) {
      const r = await fetchImpl(url, { signal: AbortSignal.timeout(20000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      await tratarFoto(Buffer.from(await r.arrayBuffer()), destino, { logo: true });
    }
  } catch (e) {
    console.warn(`[agenda] foto de @${conta} não atualizada: ${e.message}`);
  }
  return fs.existsSync(destino);
}

// Mapa conta -> URL pública das fotos que existem (pra página).
export const fotosExistentes = (bandas) => Object.fromEntries(bandas
  .filter((b) => fs.existsSync(path.join(PASTA_FOTOS, `${b.conta}.jpg`)))
  .map((b) => [b.conta, `/media/agenda/fotos/${b.conta}.jpg`]));
