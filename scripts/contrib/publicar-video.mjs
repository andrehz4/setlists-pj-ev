// Fase 5: vídeo do colaborador vira Reel. Renderiza (corte + legenda queimada + 9:16),
// sobe o MP4 pro R2 pela URL assinada do backend (vídeo não vai pro git), publica no IG
// como Reel (share_to_feed) e no FB como Reel. A miniatura vira a imagem do post no site.

import fs from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { publishReel } from "../publish/instagram.mjs";
import { publishVideoReel } from "../publish/facebook.mjs";
import { bot } from "./api.mjs";
import { renderizar } from "./render.mjs";

async function baixar(url, destino) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`download do vídeo falhou: HTTP ${r.status}`);
  await writeFile(destino, Buffer.from(await r.arrayBuffer()));
}

async function subir(putUrl, arquivo) {
  const r = await fetch(putUrl, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: await readFile(arquivo) });
  if (!r.ok) throw new Error(`upload do vídeo renderizado falhou: HTTP ${r.status}`);
}

// Devolve { postId, fbPostId, recuperado }. `id` = id do post no site (colab-xxxxxxxx).
export async function publicarVideo(envio, id, caption, { dry = false, imgDir = "media/news/img" } = {}) {
  const pasta = await mkdtemp(join(tmpdir(), "contrib-reel-"));
  try {
    const entrada = join(pasta, "original");
    await baixar(envio.media[0].url, entrada);
    const { mp4, miniatura, dur } = await renderizar(envio, entrada, pasta);
    await sharp(miniatura).resize(1080, 1920, { fit: "inside" }).jpeg({ quality: 86 }).toFile(join(imgDir, `${id}.jpg`));
    console.log(`[contrib] reel ${id}: ${dur.toFixed(1)}s, ${(fs.statSync(mp4).size / 1e6).toFixed(1)} MB`);
    if (dry) return { postId: null, fbPostId: null };

    const destino = await bot(`/render/${envio.id}`, {});
    await subir(destino.put_url, mp4);
    await bot(`/publicando/${envio.id}`, { caption });
    const ig = await publishReel({ videoUrl: destino.get_url, caption, shareToFeed: true, thumbOffsetMs: 1500 });

    let fbPostId = null;
    if (process.env.PUBLISH_FB === "1" && process.env.FB_PAGE_ID) {
      try { fbPostId = (await publishVideoReel({ videoUrl: destino.get_url, description: caption })).postId; }
      catch (e) { console.error(`[contrib] FB reel falhou (IG ok, seguindo): ${e.message}`); }
    }
    return { postId: ig.postId, fbPostId, recuperado: !!ig.recovered };
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
}
