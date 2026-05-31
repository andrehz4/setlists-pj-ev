// Fase 3: publica um STORY contra o mock reusando um MP4 ja existente em
// media/news/instagram-stories/. Exercita o caminho REAL de publicacao de
// story do instagram.mjs (createStoryContainer -> waitContainerReady com
// polling de status -> publishContainer), sem depender de ffmpeg (a geracao
// do video, buildStoryVideo, e a outra metade do pipeline e precisa de
// ffmpeg instalado; aqui validamos a metade que fala com o "Instagram").
//
// Uso: node mock-ig/story-mock.mjs [nome-do-mp4]
//   sem argumento, usa o MP4 mais recente da pasta.
// Pressupoe o mock server rodando (npm run mock:server).

import fs from "node:fs";
import path from "node:path";

const PORT = process.env.MOCK_IG_PORT || "8788";
const base = `http://127.0.0.1:${PORT}`;
process.env.IG_API_BASE ||= base;
process.env.REPO_PUBLIC_BASE ||= base;
process.env.IG_USER_ID ||= "mock_user";
process.env.IG_ACCESS_TOKEN ||= "mock_token";

const STORIES_DIR = path.resolve("media/news/instagram-stories");

function pickMp4(arg) {
  if (arg) return arg;
  const files = fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith(".mp4")).sort();
  if (!files.length) throw new Error(`nenhum MP4 em ${STORIES_DIR}. Gere um story real (com ffmpeg) ou coloque um .mp4 ali.`);
  return files[files.length - 1];
}

const { publishStory } = await import("../scripts/publish/instagram.mjs");

const name = pickMp4(process.argv[2]);
const videoUrl = `${process.env.REPO_PUBLIC_BASE}/media/news/instagram-stories/${name}`;
console.log(`[story-mock] publicando ${name} via ${process.env.IG_API_BASE}`);
console.log(`[story-mock] videoUrl=${videoUrl}`);

try {
  const { postId, containerId } = await publishStory({ videoUrl });
  console.log(`[story-mock] OK postId=${postId} containerId=${containerId}`);
  console.log(`[story-mock] confira em ${base}/_mock/stories`);
} catch (e) {
  const detail = typeof e.toDetailString === "function" ? e.toDetailString() : e.message;
  console.error(`[story-mock] FALHA: ${detail}`);
  process.exit(1);
}
