// Faz o reel "Som x Letra" inteiro de uma música a partir do roteiro: voz -> dados -> clipes -> render -> mixagem.
// Uso: node analise-musica/fazer_reel.mjs analise-musica/roteiros/<slug>.json
// Tudo vai pro SSD em saida/reels/<slug>/. Cada etapa pula se o arquivo dela já existe (apague pra refazer).
// Entrega: <slug>-para-postar.mp4 (voz + efeitos; a música entra no app do IG), <slug>-PREVIA-com-musica.mp4 e legenda.txt.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const SSD = "/Volumes/SSD Terra Gentil/setlists-pj-ev/musica-x-letra";
const PY = `${SSD}/.venv/bin/python`;
const roteiroArq = path.resolve(process.argv[2]);
const rt = JSON.parse(fs.readFileSync(roteiroArq, "utf8"));
const pasta = path.join(SSD, "saida", "reels", rt.slug);
fs.mkdirSync(pasta, { recursive: true });
const p = (f) => path.join(pasta, f);
const roda = (cmd, args) => execFileSync(cmd, args, { stdio: "inherit", cwd: AQUI });
const ff = (a) => execFileSync("ffmpeg", ["-y", "-v", "error", ...a]);
const etapa = (arq, nome, fn) => { if (fs.existsSync(p(arq))) return console.log(`[pula] ${nome}`); console.log(`[etapa] ${nome}`); fn(); };

// 1) molde do Claude Design (v3) com os dados desta música
for (const f of ["support.js", "animations-v3.jsx", "tweaks-panel.jsx", "som-letra-v3.jsx", "logo-smufdpj.jpg"])
  fs.copyFileSync(path.join(AQUI, "design", f), p(f));
fs.writeFileSync(p("render.html"), fs.readFileSync(path.join(AQUI, "design", "render-v3.html"), "utf8").replace("./dados-black-v2.js", "./dados.js"));

etapa("voz.json", "narração", () => roda("node", ["voz.mjs", roteiroArq, pasta]));
roda(PY, ["montar_dados.py", roteiroArq, pasta]);
etapa("fundo.mp4", "clipes", () => roda("node", ["preparar_clipes.mjs", pasta, rt.abertura_clipes.join(","), rt.fundo_clipes.join(","), "2", "42"]));
etapa("render/mudo.mp4", "render", () => { fs.mkdirSync(p("render"), { recursive: true }); roda("node", ["render_reel.mjs", p("render.html"), p("render/mudo.mp4"), "30"]); });

// 2) mixagem PADRÃO DA SÉRIE (igual ao Black, 19/11): gancho e CTA em 1,6; pancada de guitarra no 0; swoosh na entrada
// do gráfico; coração na 1a aparição da emoção mais forte e na maior distância (0,7 s antes do verso), pancada logo
// depois da maior distância; golpes no início das frases do gancho; strum no fim (logo); limitador. Sons da fábrica-quiz (acervo smufdpj) + coração do Terra Gentil.
const d = JSON.parse(fs.readFileSync(p("dados.json"), "utf8"));
const voz = JSON.parse(fs.readFileSync(p("voz.json"), "utf8"));
const AB = d.abertura.duracao_s, INI = d.trecho.ini_s, TOTAL = AB + 42;
const V = (tm) => AB + (tm - INI);
const GOLPE = "/Volumes/SSD Terra Gentil/trilha-hz/pancadas/replica";
const ACV = "/Users/andrehz/Documents/Githubhz/fabrica-quiz/.quiz-sons/smufdpj/acervo";
const HIT = `${ACV}/concussive-guitar-hit__w44OAAAAAAA.mp3`, SW = `${ACV}/swoosh__wJUOAAAAAAA.mp3`, ST = `${ACV}/instrument-strum__xpIOAAAAAAA.mp3`;
const COR = "/Users/andrehz/Documents/Githubhz/youtube_terragentil/biblioteca-audio/recortes/batida-de-coracao-3m33s.wav";
const versos = d.letra.versos, forte = versos.reduce((a, v) => (Math.abs(v.sd) > Math.abs(a.sd) ? v : a));
const [cor1, cor2] = rt.coracao || [versos.find((v) => v.emocao === forte.emocao).t, d.maior_divergencia.t];
const ctaT = AB + d.cta.inicio_s, FADE = "afade=t=out:st=1.5:d=0.25";
const sons = [
  [p("gancho.wav"), 0, 1.6], [p("cta.wav"), ctaT, 1.6], [`${SSD}/narracao/fixas/cta-deixa-nos-comentarios.mp3`, ctaT + voz.cta_s + 0.25, 1.6],
  [HIT, 0, 0.3, "afade=t=out:st=0.6:d=1.0"], [SW, AB - 0.5, 0.35],
  // impactos no gancho: um golpe no começo de cada frase depois da 1a (padrão desde 19/11)
  ...voz.frases.slice(1).map((f, i) => [`${GOLPE}/golpe-${[5, 7, 9][i % 3]}-hz-presente.wav`, f.t0, 0.5]),
  [COR, V(cor1) - 0.7, 0.8, FADE], [COR, V(cor2) - 0.7, 0.9, FADE], [HIT, V(cor2), 0.3], [ST, TOTAL - 1.05, 0.4],
];
for (const [f] of sons) if (!fs.existsSync(f)) throw new Error(`som não achado: ${f}`);
const filtro = sons.map(([, t, g, x], i) => `[${i}]aresample=44100,${x ? x + "," : ""}adelay=${Math.round(Math.max(0, t) * 1000)}:all=1,volume=${g}[s${i}]`).join(";") +
  `;${sons.map((_, i) => `[s${i}]`).join("")}amix=inputs=${sons.length}:normalize=0,alimiter=limit=0.95,apad,atrim=0:${TOTAL}[m]`;
ff([...sons.flatMap(([f]) => ["-i", f]), "-filter_complex", filtro, "-map", "[m]", "-t", String(TOTAL), "-ar", "44100", p("trilha-voz-efeitos.wav")]);
const final = p(`${rt.slug}-para-postar.mp4`);
ff(["-i", p("render/mudo.mp4"), "-i", p("trilha-voz-efeitos.wav"), "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(TOTAL), final]);

// 3) prévia com a música (só pra conferir; no IG a música entra pela biblioteca)
const faixa = fs.readdirSync(path.join(SSD, "audio", rt.pasta_audio)).find((f) => f.replace(/\.\w+$/, "") === rt.arquivo_faixa);
ff(["-i", final, "-ss", String(INI - AB), "-i", path.join(SSD, "audio", rt.pasta_audio, faixa), "-filter_complex",
  `[1:a]volume=0.35,atrim=0:${TOTAL}[mu];[0:a][mu]amix=inputs=2:normalize=0[a]`, "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac",
  "-t", String(TOTAL), p(`${rt.slug}-PREVIA-com-musica.mp4`)]);

fs.writeFileSync(p("legenda.txt"), `${rt.legenda}\n\nQual o seu sentimento escutando ${rt.faixa}? Deixa nos comentários 👇\n\n` +
  `#pearljam #eddievedder #${rt.slug.replace(/-/g, "")} #${d.disco.toLowerCase().replace(/\W/g, "")} #grunge #somxletra\n`);
fs.writeFileSync(p("LEIA.txt"), `Música no IG: ${rt.faixa}, a partir de ${d.instagram_musica.inicio_na_biblioteca}. Áudio original 100, música ~35.\n`);
console.log(`[ok] ${final}\n     música no IG a partir de ${d.instagram_musica.inicio_na_biblioteca}`);
