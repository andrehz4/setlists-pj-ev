// Publica um reel especial já pronto (feito à mão em reels-especiais/<pasta>/), sem renderizar nada.
// O vídeo já está no R2 (link fixo); reels-especiais/<pasta>/publicar.json traz videoUrl, legenda e capa.
// Idempotente: se publicar.json já tem "publicado", não posta de novo.
//   node scripts/publish/reel/especial.mjs <pasta> [--dry-run]
// Workflow: .github/workflows/publish-reel-especial.yml (disparado pelo TriggerAll no horário).
import path from "node:path";
import { lerEstado, gravarEstado } from "../../lib/estado.mjs";
import { commitAndPush } from "../../lib/git.mjs";
import { enviarTelegram, escHtml } from "../../lib/telegram.mjs";
import { naRaiz } from "../../config.mjs";
import { publishReelComFallback } from "./fallback.mjs";
import { espelharNoFacebook } from "./registro.mjs";

const valida = (d) => (d.videoUrl && d.legenda ? null : "publicar.json sem videoUrl ou legenda");

export async function publicarEspecial(pasta, { dry = false, deps = {} } = {}) {
  const arq = naRaiz(path.join("reels-especiais", pasta, "publicar.json"));
  const doc = await lerEstado(arq, null, { valida });
  if (!doc) throw new Error(`não achei ${arq}`);
  if (doc.publicado) {
    console.log(`[especial] ${pasta} já publicado (${doc.publicado.postId}), nada a fazer`);
    return doc.publicado;
  }
  console.log(`[especial] ${pasta}: ${doc.videoUrl} (legenda ${doc.legenda.length} caracteres)`);
  if (dry) return null;

  const publicar = deps.publishReelComFallback || publishReelComFallback;
  const espelhar = deps.espelharNoFacebook || espelharNoFacebook;
  const avisar = deps.enviarTelegram || enviarTelegram;
  try {
    const pub = await publicar({ videoUrl: doc.videoUrl, caption: doc.legenda, shareToFeed: true, thumbOffsetMs: doc.thumbOffsetMs ?? 0 });
    const fbPostId = await espelhar(doc.videoUrl, doc.legenda);
    doc.publicado = { postId: pub.postId, containerId: pub.containerId, fbPostId: fbPostId || null, em: new Date().toISOString() };
    await gravarEstado(arq, doc);
    await (deps.commitAndPush || commitAndPush)([arq], `publish-reel-especial: ${pasta} postado (IG ${pub.postId})`);
    await avisar(`🎬 <b>Reel especial no ar</b>: ${escHtml(pasta)}\nIG ${escHtml(pub.postId)}${fbPostId ? `\nFB ${escHtml(fbPostId)}` : ""}`);
    return doc.publicado;
  } catch (e) {
    await avisar(`⚠️ <b>Reel especial FALHOU</b>: ${escHtml(pasta)}\n${escHtml(e.message)}`).catch(() => {});
    throw e;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const [pasta] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  if (!pasta) { console.error("uso: especial.mjs <pasta> [--dry-run]"); process.exit(1); }
  publicarEspecial(pasta, { dry: process.argv.includes("--dry-run") })
    .catch((e) => { console.error(`[especial] FALHA: ${e.message}`); process.exit(1); });
}
