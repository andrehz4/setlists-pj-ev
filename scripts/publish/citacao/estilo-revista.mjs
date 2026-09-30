// Estilo "revista" (Claude Design 2b, aprovado em 2026-09-30). Com foto: retrato
// em duotone (P&B x cor do dia) no alto, nome gigante em Anton por cima e a
// citação em itálico com barra lateral. Sem foto: o nome gigante (1ª linha
// contornada, 2ª cheia) faz o papel da imagem. Nome que não cabe devolve null
// (o chamador cai no estilo editorial).

import sharp from "sharp";
import { esc, medir, encaixar, quebrarEquilibrado, F_PF_MEDIO, F_ANTON, F_INTER, F_INTER_XB } from "./texto.mjs";

const W = 1080, H = 1350, M = 64;

// Retrato quadrado -> faixa 1080x820 (enquadrado a 25% do topo), P&B com
// contraste, multiplicado pela cor do dia.
export async function fotoDuotone(arquivo, accent) {
  const pb = await sharp(arquivo).resize(1080, 1080).extract({ left: 0, top: 65, width: 1080, height: 820 })
    .grayscale().linear(1.2, -25).modulate({ brightness: 0.95 }).toBuffer();
  const cor = await sharp({ create: { width: 1080, height: 820, channels: 3, background: accent } }).png().toBuffer();
  const buf = await sharp(pb).composite([{ input: cor, blend: "multiply" }]).jpeg({ quality: 90 }).toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

// Divide o nome em até 2 linhas (1ª palavra / resto; nomes longos equilibrados).
async function linhasNome(nome, fs) {
  const ws = nome.toUpperCase().split(/\s+/).filter(Boolean);
  if (ws.length <= 2) return ws.length === 2 ? [ws[0], ws[1]] : ws;
  return quebrarEquilibrado(ws.join(" "), 952, (t) => medir(t, { family: F_ANTON, size: fs }));
}
async function larguraMax(linhas, fs) {
  let m = 0;
  for (const l of linhas) m = Math.max(m, await medir(l, { family: F_ANTON, size: fs }));
  return m;
}

async function blocoCitacao(quote, { top, altura }) {
  const fonte = { family: F_PF_MEDIO, style: "italic", weight: 500 };
  const fit = await encaixar(`“${quote}”`, { maxW: 904, maxH: altura, fsMax: 64, fsMin: 36, lh: 1.2, fonte });
  const lh = fit.fs * 1.2, bloco = fit.linhas.length * lh;
  const y0 = top + (altura - bloco) / 2 + lh * 0.8;
  const spans = fit.linhas.map((l, i) => `<tspan x="112" y="${Math.round(y0 + i * lh)}">${esc(l)}</tspan>`).join("");
  return { spans, fs: fit.fs, barraY: Math.round(top + (altura - bloco - 30) / 2), barraH: Math.round(bloco + 30) };
}

export async function svgRevista({ quote, autor, linhaContexto, pal, fotoUri }) {
  const { bg, accent, claro, apagado } = pal;
  const ctx = (linhaContexto || "").toUpperCase();
  const ctxW = ctx ? await medir(ctx, { family: F_INTER_XB, size: 26, weight: 800, spacing: 5.2 }) : 0;
  const tagW = (await medir("@smufdpj", { family: F_INTER_XB, size: 28, weight: 800 })) + 40;
  let corpo;

  if (fotoUri) {
    let fs = 156, linhas = await linhasNome(autor.nome, fs), ctxAoLado = true;
    while (fs > 96 && (await larguraMax(linhas, fs)) > 952 - (ctx ? ctxW + 24 : 0)) { fs -= 4; linhas = await linhasNome(autor.nome, fs); }
    // contexto comprido espreme o nome: sobe pra cima dele e o nome volta ao corpo cheio
    if (ctx && (fs < 132 || (await larguraMax(linhas, fs)) > 952 - ctxW - 24)) {
      ctxAoLado = false; fs = 156; linhas = await linhasNome(autor.nome, fs);
      while (fs > 96 && (await larguraMax(linhas, fs)) > 952) { fs -= 4; linhas = await linhasNome(autor.nome, fs); }
    }
    const lh = fs * 0.88, base = 870, topoNome = base - (linhas.length - 1) * lh - fs * 0.83;
    const nomeSvg = linhas.map((l, i) => `<tspan x="${M}" y="${Math.round(base - (linhas.length - 1 - i) * lh)}">${esc(l)}</tspan>`).join("");
    const ctxSvg = !ctx ? "" : ctxAoLado
      ? `<text x="${W - M}" y="855" text-anchor="end" font-family="${F_INTER_XB}" font-weight="800" font-size="26" letter-spacing="5.2" fill="${claro}">${esc(ctx)}</text>`
      : `<text x="${M}" y="${Math.round(topoNome - 26)}" font-family="${F_INTER_XB}" font-weight="800" font-size="26" letter-spacing="5.2" fill="${claro}">${esc(ctx)}</text>`;
    const q = await blocoCitacao(quote, { top: 880, altura: 290 });
    corpo = `<image href="${fotoUri}" x="0" y="0" width="1080" height="820"/>
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0.4" stop-color="${bg}" stop-opacity="0"/><stop offset="1" stop-color="${bg}"/></linearGradient></defs>
  <rect x="0" y="0" width="1080" height="822" fill="url(#g)"/>
  <rect x="${M}" y="56" width="${tagW}" height="54" fill="${bg}"/>
  <text font-family="${F_ANTON}" font-size="${fs}" fill="#ffffff">${nomeSvg}</text>
  ${ctxSvg}
  <rect x="${M}" y="${q.barraY}" width="10" height="${q.barraH}" fill="${accent}"/>
  <text font-family="${F_PF_MEDIO}" font-style="italic" font-weight="500" font-size="${q.fs}" fill="#ffffff">${q.spans}</text>`;
  } else {
    let fs = 228, linhas = await linhasNome(autor.nome, fs);
    while (fs > 110 && (await larguraMax(linhas, fs)) > 952) { fs -= 4; linhas = await linhasNome(autor.nome, fs); }
    if ((await larguraMax(linhas, fs)) > 952 || linhas.length > 2) return null;
    const b1 = Math.round(148 + fs * 0.855), b2 = Math.round(b1 + fs * 0.9);
    const l1 = linhas.length === 2
      ? `<text x="50" y="${b1}" font-family="${F_ANTON}" font-size="${fs}" fill="none" stroke="${accent}" stroke-width="3">${esc(linhas[0])}</text>` : "";
    const ultima = linhas[linhas.length - 1], yUlt = linhas.length === 2 ? b2 : b1;
    const ctxSvg = ctx ? `<text x="${M}" y="${yUlt + 62}" font-family="${F_INTER_XB}" font-weight="800" font-size="26" letter-spacing="5.2" fill="${claro}">${esc(ctx)}</text>` : "";
    const topQ = Math.max(640, yUlt + (ctx ? 90 : 60));
    const q = await blocoCitacao(quote, { top: topQ, altura: 1160 - topQ });
    corpo = `<rect x="${M}" y="56" width="${tagW}" height="54" fill="${accent}"/>
  ${l1}
  <text x="50" y="${yUlt}" font-family="${F_ANTON}" font-size="${fs}" fill="${accent}">${esc(ultima)}</text>
  ${ctxSvg}
  <rect x="${M}" y="${q.barraY}" width="10" height="${q.barraH}" fill="${accent}"/>
  <text font-family="${F_PF_MEDIO}" font-style="italic" font-weight="500" font-size="${q.fs}" fill="#ffffff">${q.spans}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${bg}"/>
  ${corpo}
  <text x="${M + 20}" y="93" font-family="${F_INTER_XB}" font-weight="800" font-size="28" fill="#ffffff">@smufdpj</text>
  <rect x="${M}" y="1230" width="${W - M * 2}" height="2" fill="${accent}"/>
  <text x="${M}" y="1282" font-family="${F_INTER}" font-size="24" letter-spacing="1" fill="${apagado}">somaisumfadepearljam.com.br</text>
  <text x="${W - M}" y="1282" text-anchor="end" font-family="${F_INTER}" font-weight="700" font-size="24" fill="${fotoUri ? claro : accent}">@smufdpj</text>
</svg>`;
}
