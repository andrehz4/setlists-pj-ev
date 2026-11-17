// Story avulso (aviso pontual aprovado pelo Andre). IMAGEM: arte commitada em media/news/stories-avulsos/. VÍDEO: link
// do R2 (midia.../especiais/<nome>.mp4) no mesmo input "imagem" do story-avulso.yml (mexer no YAML exige escopo workflow).
//   node scripts/publish/story-avulso/run.mjs --imagem media/news/stories-avulsos/x.jpg[,y.jpg...] --marcar conta1,conta2
import fs from "node:fs";
import { publishImageStory } from "../instagram.mjs";
import { publishVideoStory } from "../ig/story-video.mjs";
import { naRaiz } from "../../config.mjs";
import { enviarTelegram } from "../../lib/telegram.mjs";

const arg = (nome) => { const i = process.argv.indexOf(`--${nome}`); return i >= 0 ? process.argv[i + 1] || "" : ""; };
// Várias telas em sequência: separar por vírgula no mesmo input (ordem = ordem no story). Marcação só na 1ª tela.
const imagens = arg("imagem").split(",").map((x) => x.trim()).filter(Boolean);
const contas = arg("marcar").split(",").map((c) => c.trim().replace(/^@/, "")).filter(Boolean);
const REPO = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

export const VIDEO_R2 = /^https:\/\/midia\.somaisumfadepearljam\.com\.br\/especiais\/[\w.-]+\.mp4(\?v=\d+)?$/;
if (!imagens.length) throw new Error("nenhuma imagem informada");
for (const imagem of imagens) { // valida TUDO antes de publicar a 1ª, pra não sair story pela metade
  if (VIDEO_R2.test(imagem)) continue;
  if (!/^media\/news\/stories-avulsos\/[\w.-]+\.jpe?g$/.test(imagem)) throw new Error(`imagem inválida: ${imagem}`);
  if (!fs.existsSync(naRaiz(imagem))) throw new Error(`imagem não existe no repo: ${imagem}`);
}

const ids = [];
for (const [i, imagem] of imagens.entries()) {
  const video = VIDEO_R2.test(imagem);
  const url = video ? imagem : `${REPO}/${imagem}`;
  const marcar = i === 0 ? contas : [];
  console.log(`[story-avulso] ${i + 1}/${imagens.length} ${video ? "vídeo" : "imagem"} ${url} | marcar ${marcar.join(", ") || "(ninguém)"}`);
  const r = video ? await publishVideoStory({ videoUrl: url, contas: marcar }) : await publishImageStory({ imageUrl: url, contas: marcar });
  console.log(`[story-avulso] OK postId=${r.postId} marcou=${r.marcou}`);
  ids.push(r.postId);
}
const nome = imagens[0].split("/").pop().split("?")[0];
await enviarTelegram(`📣 Story avulso publicado (${nome}${imagens.length > 1 ? `, ${imagens.length} telas` : ""}), postId ${ids.join(", ")}`,
  { prefixo: "[story]" }).catch((e) => console.warn(`[story-avulso] telegram falhou: ${e.message}`));
