// Story avulso (aviso pontual aprovado pelo Andre). IMAGEM: arte commitada em media/news/stories-avulsos/. VÍDEO: link
// do R2 (midia.../especiais/<nome>.mp4) no mesmo input "imagem" do story-avulso.yml (mexer no YAML exige escopo workflow).
//   node scripts/publish/story-avulso/run.mjs --imagem media/news/stories-avulsos/x.jpg --marcar conta1,conta2
import fs from "node:fs";
import { publishImageStory } from "../instagram.mjs";
import { publishVideoStory } from "../ig/story-video.mjs";
import { naRaiz } from "../../config.mjs";
import { enviarTelegram } from "../../lib/telegram.mjs";

const arg = (nome) => { const i = process.argv.indexOf(`--${nome}`); return i >= 0 ? process.argv[i + 1] || "" : ""; };
const imagem = arg("imagem");
const contas = arg("marcar").split(",").map((c) => c.trim().replace(/^@/, "")).filter(Boolean);
const REPO = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

export const VIDEO_R2 = /^https:\/\/midia\.somaisumfadepearljam\.com\.br\/especiais\/[\w.-]+\.mp4(\?v=\d+)?$/;
const video = VIDEO_R2.test(imagem);
if (!video && !/^media\/news\/stories-avulsos\/[\w.-]+\.jpe?g$/.test(imagem)) throw new Error(`imagem inválida: ${imagem}`);
if (!video && !fs.existsSync(naRaiz(imagem))) throw new Error(`imagem não existe no repo: ${imagem}`);

const url = video ? imagem : `${REPO}/${imagem}`;
console.log(`[story-avulso] ${video ? "vídeo" : "imagem"} ${url} | marcar ${contas.join(", ") || "(ninguém)"}`);
const r = video ? await publishVideoStory({ videoUrl: url, contas }) : await publishImageStory({ imageUrl: url, contas });
console.log(`[story-avulso] OK postId=${r.postId} marcou=${r.marcou}`);
await enviarTelegram(`📣 Story avulso publicado (${imagem.split("/").pop().split("?")[0]}), postId ${r.postId}${r.marcou ? "" : ", sem marcação"}`,
  { prefixo: "[story]" }).catch((e) => console.warn(`[story-avulso] telegram falhou: ${e.message}`));
