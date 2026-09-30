// Slide de CITAÇÃO "moldura" das cápsulas (inspirado no post do @igormirandasite,
// aprovado pelo Andre em 2026-09-30): moldura na cor do ciclo, aspas grandes
// vazando nos cantos, etiqueta @smufdpj no topo, citação centralizada e, embaixo,
// foto redonda de quem fala + nome + contexto. Sem retrato, sai sem o círculo.
// Ligado por CAPSULA_CITACAO=moldura (ver run-publish-capsula.mjs).

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { F_PLAYFAIR, F_INTER_SB, F_INTER_XB } from "../fontconfig-boot.mjs";
import { SLIDES_DIR, measureText, capsuleColors } from "../slide-image.mjs";
import { resolverAutor } from "./retratos.mjs";

const W = 1080, H = 1350;
const HANDLE = "@smufdpj";
const SITE = "somaisumfadepearljam.com.br";
// Moldura: retângulo onde tudo se apoia.
const FX = 80, FY = 110, FW = 920, FH = 1110;
const FOTO = { cx: 235, cy: 1080, r: 150 };

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Quebra gulosa com largura REAL, mantendo maiúsculas/minúsculas. Reduz a fonte
// até caber em maxLines; se nem o mínimo couber, devolve o mínimo mesmo.
export async function quebrarCitacao(texto, { maxW, fsMax, fsMin, maxLines }, measure) {
  const palavras = String(texto || "").split(/\s+/).filter(Boolean);
  const quebrar = async (fs) => {
    const linhas = []; let cur = "";
    for (const p of palavras) {
      const t = cur ? `${cur} ${p}` : p;
      if (!cur || (await measure(t, fs)) <= maxW) cur = t;
      else { linhas.push(cur); cur = p; }
    }
    if (cur) linhas.push(cur);
    return linhas;
  };
  for (let fs = fsMax; fs >= fsMin; fs -= 2) {
    const linhas = await quebrar(fs);
    if (linhas.length <= maxLines) return { fs, linhas };
  }
  return { fs: fsMin, linhas: await quebrar(fsMin) };
}

const medirPlayfair = (t, size) => measureText(t, { size, family: F_PLAYFAIR });
const medirInter = (t, size) => measureText(t, { size, family: F_INTER_SB });

async function fotoRedonda(arquivo) {
  const lado = FOTO.r * 2;
  const buf = await sharp(arquivo).resize(lado, lado).jpeg({ quality: 90 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// Monta o SVG (exportado pros testes). autor = saída de resolverAutor.
export async function svgCitacao({ quote, autor, bg, accent, fotoUri }) {
  const cx = W / 2;
  // citação: centrada entre a etiqueta e a linha de baixo
  const fit = await quebrarCitacao(quote, { maxW: 800, fsMax: 78, fsMin: 38, maxLines: 8 }, medirPlayfair);
  const lh = Math.round(fit.fs * 1.22);
  const bloco = fit.linhas.length * lh;
  const topo = 250, base = 930;
  const y0 = Math.round(topo + (base - topo - bloco) / 2 + fit.fs * 0.8);
  const linhas = fit.linhas.map((l, i) => `<tspan x="${cx}" y="${y0 + i * lh}">${esc(l)}</tspan>`).join("");

  // etiqueta @smufdpj encostada no canto de cima à direita
  const tagW = (await measureText(HANDLE, { size: 30, family: F_INTER_XB })) + 44;
  const tagX = FX + FW - tagW + 2;

  // nome + contexto: à direita da foto, ou colados na esquerda sem foto
  const comFoto = Boolean(fotoUri);
  const nx = comFoto ? FOTO.cx + FOTO.r + 45 : FX + 60;
  const maxNome = FX + FW - 110 - nx;
  let fsNome = 40;
  while (fsNome > 28 && (await medirPlayfair(autor.nome, fsNome)) > maxNome) fsNome -= 2;
  const ctx = autor.contexto
    ? (await quebrarCitacao(autor.contexto, { maxW: maxNome, fsMax: 28, fsMin: 22, maxLines: 2 }, medirInter))
    : null;
  const ctxSvg = ctx
    ? `<text font-family="${F_INTER_SB}" font-size="${ctx.fs}" fill="#ffffff" opacity="0.72">${ctx.linhas.slice(0, 2)
      .map((l, i) => `<tspan x="${nx}" y="${1128 + i * Math.round(ctx.fs * 1.3)}">${esc(l)}</tspan>`).join("")}</text>`
    : "";
  const yNome = ctx ? 1084 : 1100;

  const foto = comFoto ? `
  <defs><clipPath id="c"><circle cx="${FOTO.cx}" cy="${FOTO.cy}" r="${FOTO.r}"/></clipPath></defs>
  <circle cx="${FOTO.cx}" cy="${FOTO.cy}" r="${FOTO.r + 10}" fill="${bg}"/>
  <image href="${fotoUri}" x="${FOTO.cx - FOTO.r}" y="${FOTO.cy - FOTO.r}" width="${FOTO.r * 2}" height="${FOTO.r * 2}" clip-path="url(#c)"/>
  <circle cx="${FOTO.cx}" cy="${FOTO.cy}" r="${FOTO.r}" fill="none" stroke="${accent}" stroke-width="8"/>` : "";

  const linhaX0 = comFoto ? nx : FX + 60;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect x="${FX}" y="${FY}" width="${FW}" height="${FH}" fill="none" stroke="${accent}" stroke-width="5"/>
  <rect x="20" y="40" width="165" height="150" fill="${bg}"/>
  <text x="18" y="318" font-family="${F_PLAYFAIR}" font-size="360" fill="${accent}">&#8220;</text>
  <rect x="${FX + FW - 150}" y="${FY + FH - 70}" width="220" height="190" fill="${bg}"/>
  <text x="${FX + FW - 140}" y="${FY + FH + 205}" font-family="${F_PLAYFAIR}" font-size="360" fill="${accent}">&#8221;</text>
  <rect x="${tagX}" y="${FY - 2}" width="${tagW}" height="58" fill="${accent}"/>
  <text x="${tagX + tagW / 2}" y="${FY + 38}" text-anchor="middle" font-family="${F_INTER_XB}" font-size="30" fill="#ffffff">${HANDLE}</text>
  <text text-anchor="middle" font-family="${F_PLAYFAIR}" font-size="${fit.fs}" fill="#ffffff" letter-spacing="-0.3">${linhas}</text>
  <rect x="${linhaX0}" y="985" width="${FX + FW - 110 - linhaX0}" height="4" fill="${accent}"/>
  <rect x="${FX + FW - 92}" y="962" width="56" height="50" fill="none" stroke="${accent}" stroke-width="3"/>
  <text x="${FX + FW - 64}" y="996" text-anchor="middle" font-family="${F_INTER_XB}" font-size="26" fill="#ffffff">&#8594;</text>
  <text x="${nx}" y="${yNome}" font-family="${F_PLAYFAIR}" font-size="${fsNome}" fill="#ffffff">${esc(autor.nome)}</text>
  ${ctxSvg}${foto}
  <text x="${cx}" y="${H - 58}" text-anchor="middle" font-family="${F_INTER_SB}" font-size="22" fill="#ffffff" opacity="0.55" letter-spacing="0.5">${SITE}</text>
</svg>`;
}

// Mesma assinatura do buildQuoteSlide antigo + seed (id da cápsula), que fixa
// qual retrato do Eddie entra, pra o carrossel inteiro usar a mesma foto.
export async function buildQuoteSlideMoldura({ quote, author, seed = "" }, destId, cycleColor = "#0a0a0a") {
  fs.mkdirSync(SLIDES_DIR, { recursive: true });
  const dest = path.join(SLIDES_DIR, `${destId}.jpg`);
  const { bg, accent } = capsuleColors(cycleColor);
  const autor = resolverAutor(author, seed);
  const fotoUri = autor.foto && fs.existsSync(autor.foto) ? await fotoRedonda(autor.foto) : null;
  const svg = await svgCitacao({ quote, autor, bg, accent, fotoUri });
  await sharp(Buffer.from(svg)).flatten({ background: bg }).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, id: destId, reused: false };
}
