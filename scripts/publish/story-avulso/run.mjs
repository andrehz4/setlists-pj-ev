// Story de IMAGEM avulso (aviso pontual, arte feita à mão e aprovada pelo Andre). A arte já está commitada
// em media/news/stories-avulsos/; o workflow story-avulso.yml dispara com o arquivo e as contas a marcar.
//   node scripts/publish/story-avulso/run.mjs --imagem media/news/stories-avulsos/x.jpg --marcar conta1,conta2
import fs from "node:fs";
import { publishImageStory } from "../instagram.mjs";
import { naRaiz } from "../../config.mjs";
import { enviarTelegram } from "../../lib/telegram.mjs";

const arg = (nome) => { const i = process.argv.indexOf(`--${nome}`); return i >= 0 ? process.argv[i + 1] || "" : ""; };
const imagem = arg("imagem");
const contas = arg("marcar").split(",").map((c) => c.trim().replace(/^@/, "")).filter(Boolean);
const REPO = process.env.REPO_PUBLIC_BASE || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

if (!/^media\/news\/stories-avulsos\/[\w.-]+\.jpe?g$/.test(imagem)) throw new Error(`imagem inválida: ${imagem}`);
if (!fs.existsSync(naRaiz(imagem))) throw new Error(`imagem não existe no repo: ${imagem}`);

const imageUrl = `${REPO}/${imagem}`;
console.log(`[story-avulso] ${imageUrl} | marcar ${contas.join(", ") || "(ninguém)"}`);
const r = await publishImageStory({ imageUrl, contas });
console.log(`[story-avulso] OK postId=${r.postId} marcou=${r.marcou}`);
await enviarTelegram(`📣 Story avulso publicado (${imagem.split("/").pop()}), postId ${r.postId}${r.marcou ? "" : ", sem marcação"}`,
  { prefixo: "[story]" }).catch((e) => console.warn(`[story-avulso] telegram falhou: ${e.message}`));
