// Fase 4: publica um REEL contra o mock reusando um MP4 existente. O pipeline
// ainda nao gera reels; este helper exercita o contrato media_type=REELS no
// mock (mesmo caminho de video: createContainer -> poll status -> publish),
// pra o front ja ter o que mostrar na aba Reels e o contrato ficar pronto pra
// quando o pipeline ganhar reels de verdade.
//
// Uso: node mock-ig/reel-mock.mjs [nome-do-mp4]
// Pressupoe o mock server rodando (npm run mock:server).

import fs from "node:fs";
import path from "node:path";
import got from "got";

const PORT = process.env.MOCK_IG_PORT || "8788";
const base = `http://127.0.0.1:${PORT}`;
const REPO = base;
const UID = process.env.IG_USER_ID || "mock_user";
const TOKEN = process.env.IG_ACCESS_TOKEN || "mock_token";
const STORIES_DIR = path.resolve("media/news/instagram-stories");

function pickMp4(arg) {
  if (arg) return arg;
  const files = fs.readdirSync(STORIES_DIR).filter((f) => f.endsWith(".mp4")).sort();
  if (!files.length) throw new Error(`nenhum MP4 em ${STORIES_DIR}`);
  return files[files.length - 1];
}

const name = pickMp4(process.argv[2]);
const videoUrl = `${REPO}/media/news/instagram-stories/${name}`;
const api = `${base}/v21.0`; // o mock ignora o prefixo de versao, casa /media

// cria container REELS
const c = await got.post(`${base}/${UID}/media`, {
  form: { media_type: "REELS", video_url: videoUrl, caption: `reel mock: ${name}`, access_token: TOKEN },
  responseType: "json",
}).json();
// poll status (caminho feliz = FINISHED na 1a)
let status = "IN_PROGRESS", tries = 0;
while (status !== "FINISHED" && tries < 10) {
  const st = await got(`${base}/${c.id}`, { searchParams: { fields: "status_code,status", access_token: TOKEN }, responseType: "json" }).json();
  status = st.status_code; tries++;
  if (status === "ERROR") throw new Error("reel container ERROR");
}
// publica
const pub = await got.post(`${base}/${UID}/media_publish`, {
  form: { creation_id: c.id, access_token: TOKEN }, responseType: "json",
}).json();

console.log(`[reel-mock] OK postId=${pub.id} container=${c.id} (${name})`);
console.log(`[reel-mock] confira em ${base}/_mock/reels`);
