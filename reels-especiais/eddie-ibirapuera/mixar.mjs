// Põe a trilha própria (Suno, R2) por baixo da narração do reel especial do Eddie no Ibirapuera.
// Golpes (v7): c3 (Better Man, primeira certa) e c12 (Porch, a número um). Música abaixa quando a voz entra (sidechain).
// Uso: node reels-especiais/eddie-ibirapuera/mixar.mjs [cama]
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { trilhaPropria } from "../../scripts/publish/trilha/ligar.mjs";
import { lerKitPublicado } from "../../scripts/publish/trilha/r2.mjs";
import { montarEfeitos } from "./efeitos.mjs";

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const video = path.join(AQUI, "render/reel-sem-trilha.mp4");
const t = JSON.parse(fs.readFileSync(path.join(AQUI, "render/tempos.json"), "utf8"));
const cenas = Array.isArray(t) ? t : t.cenas;
const ini = (id) => cenas.find((c) => c.id === id)[cenas[0].inicio !== undefined ? "inicio" : "start"];
const duracao = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).toString());

// v7: abre cheio no gancho (c1), médio no critério, golpe na primeira certa (c3), médio na contagem intercalada, magro no suspense
// da Black e do mapa (c10 e c11), golpe no Porch (c12), banda cheia até o fim.
const plano = [
  { de: 0, ate: ini("c2"), nivel: "cheio" },
  { de: ini("c2"), ate: ini("c3"), nivel: "medio" },
  { de: ini("c3"), ate: ini("c4"), nivel: "cheio" },
  { de: ini("c4"), ate: ini("c10"), nivel: "medio" },
  { de: ini("c10"), ate: ini("c12"), nivel: "magro" },
  { de: ini("c12"), ate: duracao, nivel: "cheio" },
];

// Cama escolhida à mão (argumento) ou pelo rodízio com semente fixa.
const camaFixa = process.argv[2];
const lerKit = camaFixa ? () => { const k = lerKitPublicado(); return { ...k, camas: k.camas.filter((c) => c.id === camaFixa) }; } : undefined;
const trilha = trilhaPropria({ uso: "reel", semente: "eddie-ibirapuera", plano, duracao,
  saida: path.join(AQUI, "render/trilha.m4a"), env: { TRILHA_PROPRIA: "1" }, ...(lerKit ? { lerKit } : {}) });
if (!trilha) throw new Error("trilha própria não montou (R2 ou kit)");

const sfx = montarEfeitos(cenas, path.join(AQUI, "render/efeitos.wav"), duracao);
const saida = path.join(AQUI, `render/reel-final${camaFixa ? "-" + camaFixa : ""}.mp4`);
const filtro = [
  "[1:a]volume=0.55,aresample=44100[cama]",
  "[0:a]aresample=44100,asplit=2[voz][chave0]",
  "[chave0]apad[chave]",
  "[cama][chave]sidechaincompress=threshold=0.015:ratio=14:attack=15:release=600[musica]",
  "[2:a]aresample=44100[sfx]",
  "[voz][musica][sfx]amix=inputs=3:duration=longest:normalize=0,alimiter=limit=0.95[a]",
].join(";");
execFileSync("ffmpeg", ["-y", "-v", "error", "-i", video, "-i", trilha.path, "-i", sfx, "-filter_complex", filtro,
  "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", String(duracao), saida]);
console.log(`ok: ${saida} (${trilha.name})`);
