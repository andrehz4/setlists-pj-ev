// Gerador de slide para o feed do Instagram.
//
// DOIS layouts, selecionados por env SLIDE_LAYOUT:
//   - "cadernob" (DEFAULT): layout jornal editorial creme, intocado, e o
//     que esta em producao. Caminho byte-a-byte preservado pra rollback.
//   - "card02": novo design (bundle Claude Design "layoutinstagram"):
//       * noticia/solo  -> Card 02 (foto cheia, cunha vermelha, tarja +
//         manchete no rodape, estilo Atletico-MG)
//       * capa carrossel -> Card 11 (fundo preto, PEARL JAAAM gigante,
//         foto do item lider, manchete do lider no rodape)
//     Manchete usa item.title_ig (fallback title_pt). Cache com sufixo
//     proprio, entao trocar a flag nao reaproveita slide do layout antigo.
//
// Formato 1080x1350 (Instagram 4:5).

import fs from "node:fs/promises";
import path from "node:path";
import got from "got";
// side-effect: bootstrap do fontconfig (env setado antes de sharp).
// Tambem fornece as familias F_* (fonte unica, compartilhada com story).
import { F_ANTON, F_INTER, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "./fontconfig-boot.mjs";
import { getEditionNumber } from "./edition.mjs";
import { detectFaces, cropFromFaces } from "./face-crop.mjs";
import { findBetterImage } from "./find-better-image.mjs";
import { getImageOverrideUrl } from "./image-overrides.mjs";

// sharp importado dinamicamente DEPOIS do import de fontconfig-boot
// (cujo side-effect ja setou o env antes do primeiro uso de libvips).
const { default: sharp } = await import("sharp");
const { default: smartcrop } = await import("smartcrop-sharp");

const SLIDE_W = 1080;
const SLIDE_H = 1350;
export const SLIDES_DIR = path.resolve("media/news/instagram-slides");

// Flag de layout. Default = "card02" (novo design, aprovado e no ar desde
// 2026-05-16). Rollback instantaneo: SLIDE_LAYOUT=cadernob no workflow
// publish-instagram.yml, ou reverter este default. O builder cadernob e
// todo o caminho antigo continuam intactos pra esse rollback.
const LAYOUT = (process.env.SLIDE_LAYOUT || "card02").toLowerCase();

// Familias F_* importadas de ./fontconfig-boot.mjs (fonte unica).

// Fallback: fotos oficiais da banda. Logica em band-fallback.mjs (testavel).
import { loadBandFallbacks, pickFallback } from "./band-fallback.mjs";
// Fallback por assunto: noticia que cita um integrante usa a foto dele.
import { subjectFallbackPath } from "./subject-fallback.mjs";
const BAND_FALLBACKS = await loadBandFallbacks();
function bandFallbackPath(id) { return pickFallback(BAND_FALLBACKS, id); }

// Caderno B — layout constants (1080px). MANTIDO (layout antigo, rollback).
const SIDE       = 61;    // margem lat. (= 18 * 3.375)
const CONT_W     = SLIDE_W - SIDE * 2; // 958
const BAR_H      = 147;   // masthead bar (Figma 43.4549px × 3.375)
const BAR_BORDER = 7.5;   // borda inferior (Figma 2.22222px × 3.375)
const EYEBROW_Y  = 216;   // baseline do eyebrow
const EYEBROW_RY = 226;   // rule abaixo do eyebrow
const EYEBROW_RW = 340;   // largura da rule
const HEADLINE_Y = 341;   // baseline 1a linha do headline
const HEADLINE_S = 88;    // font-size headline
const HEADLINE_LH = 86;   // line-height entre linhas do headline
const BYLINE_RY  = 648;   // rule horizontal acima do byline
const BYLINE_Y   = 680;   // baseline do byline text
const PHOTO_TOP  = 700;   // y do topo da foto
const PHOTO_H    = 422;   // altura da foto
const CAPTION_RY = 1130;  // rule abaixo da foto / acima da caption
const CAPTION_Y  = 1165;  // baseline da caption
const FOOTER_Y   = 1318;  // baseline do rodape

// Paleta
const CREME = "#f4ede0";
const TINTA = "#0a0908";
const SEPIA = "#5a4a2a";
const REGUA = "#c8b894";

// Fontes de sistema do layout antigo (mantidas pra nao tocar no cadernob).
const SERIF   = "'Georgia','Times New Roman',serif";
const MONO    = "'Courier New',Courier,monospace";
const SANS_BK = "'Arial Black',Impact,'Helvetica Neue',sans-serif";

const CAT_LABELS = {
  turne: "Turnê", lancamento: "Lançamento", tenclub: "Ten Club",
  memoria: "Memória", br: "Brasil", bootleg: "Bootleg",
  comunidade: "Comunidade", eddie: "Eddie", mike: "Mike",
  stone: "Stone", jeff: "Jeff", matt: "Matt", boom: "Boom", josh: "Josh",
  loja: "Loja",
};

function escapeXml(s) {
  return String(s || "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

function wrapText(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) { cur = w; continue; }
    if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; if (lines.length >= maxLines) break; }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && words.length > lines.join(" ").split(/\s+/).length) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] = last.length > 3 ? last.slice(0, -3) + "..." : last + "...";
  }
  return lines;
}

async function fetchBaseImageBuffer(item) {
  // Opcao B: override manual tem prioridade sobre tudo. Se houver
  // uma URL boa cadastrada pra esse id, baixa, persiste no cache
  // local (pra reusos futuros e pro git) e usa.
  try {
    const ovUrl = await getImageOverrideUrl(item.id);
    if (ovUrl) {
      const buf = await got(ovUrl, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
      if (buf && buf.length > 1024) {
        if (item.img && item.img.startsWith("/media/news/img/")) {
          const dest = path.join(process.cwd(), item.img.replace(/^\//, ""));
          await fs.writeFile(dest, buf).catch(() => {});
        }
        console.log(`[slide] ${item.id}: usando imagem de override manual (${ovUrl})`);
        return buf;
      }
    }
  } catch (e) {
    console.warn(`[slide] override de ${item.id} falhou (${e.message}), seguindo com fonte normal`);
  }

  if (item.img && item.img.startsWith("/media/news/img/")) {
    const local = path.join(process.cwd(), item.img.replace(/^\//, ""));
    try {
      const buf = await fs.readFile(local);
      if (buf.length > 1024) return buf;
    } catch {}
  }
  const src = item.img || item.imgRemote || null;
  if (src && /^https?:/.test(src)) {
    try {
      return await got(src, { timeout: { request: 15000 }, retry: { limit: 1 }, responseType: "buffer" }).buffer();
    } catch {}
  }

  // Fallback por assunto: noticia que cita um integrante (ex: Jack Irons) usa
  // a foto dele, antes da rotacao generica. So entra quando o item nao tem
  // foto propria (chegou ate aqui).
  try {
    const subjectPath = await subjectFallbackPath(item);
    if (subjectPath) {
      const buf = await fs.readFile(subjectPath);
      if (buf && buf.length > 1024) {
        console.log(`[slide] ${item.id}: sem foto propria, usando foto do assunto (${path.basename(subjectPath)})`);
        return buf;
      }
    }
  } catch {}

  // Fallback: foto da banda quando o item nao tem imagem propria nem assunto
  try {
    const fallback = bandFallbackPath(item.id);
    const buf = await fs.readFile(fallback);
    if (buf && buf.length > 1024) {
      console.log(`[slide] ${item.id}: sem foto propria, usando fallback da banda (${path.basename(fallback)})`);
      return buf;
    }
  } catch {}
  return null;
}

// Data em BRT (UTC-3), mesmo timezone do numero de edicao / story-log.
function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    const brt = new Date(d.getTime() - 3 * 60 * 60 * 1000);
    return [
      String(brt.getUTCDate()).padStart(2, "0"),
      String(brt.getUTCMonth() + 1).padStart(2, "0"),
      brt.getUTCFullYear(),
    ].join("/");
  } catch {
    return "";
  }
}

function buildCadernoBSvg(item, edition, editionDate) {
  const tarjaColor = item._tarjaColor || "#c12727";
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat  = escapeXml(CAT_LABELS[tags[0]] || "Notícias");
  // Data = data da edicao (dia da postagem no IG), consistente com o
  // numero de edicao. A fonte original da noticia vai no caption do post.
  const date = escapeXml(formatDate(editionDate));
  const ed   = String(edition);

  // Headline: "Pearl Jam" sempre em CAIXA ALTA (reforco de marca);
  // ~18 chars/linha, max 4 linhas
  const titulo = String(item.title_pt || "").replace(/pearl\s+jam/gi, "PEARL JAM");
  const headLines = wrapText(titulo, 18, 4);
  const headSpans = headLines
    .map((l, i) => `<tspan x="${SIDE}" dy="${i === 0 ? 0 : HEADLINE_LH}">${escapeXml(l)}</tspan>`)
    .join("");

  // Caption = primeira frase do intro, quebrada em ate 2 linhas
  const captRaw   = (item.intro_pt || "").split(/[.!?]/)[0].trim();
  const captLines = wrapText(captRaw + (captRaw ? "." : ""), 62, 2);
  const captSpans = captLines
    .map((l, i) => `<tspan x="${SIDE}" dy="${i === 0 ? 0 : 36}">${escapeXml(l)}</tspan>`)
    .join("");

  const byline = `POR @SMUFDPJ  ·  ${date}  ·  5 MIN DE LEITURA`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">

  <!-- masthead bar preta (Figma 43.4549px × 3.375 = 147px) -->
  <rect x="0" y="0" width="${SLIDE_W}" height="${BAR_H}" fill="${TINTA}"/>
  <!-- borda inferior unica solida (Figma 2.22222px × 3.375 = 7.5px) -->
  <rect x="0" y="${BAR_H}" width="${SLIDE_W}" height="${BAR_BORDER}" fill="${CREME}"/>

  <!-- Wordmark serif italic 700. Figma usa Newsreader 54px; Georgia
       (substituto) e mais largo, 44px mantem o equilibrio sem invadir
       a edicao. Centrado vertical na barra 147px. -->
  <text x="${SIDE}" y="90"
    font-family="${SERIF}" font-style="italic" font-weight="700"
    font-size="44" fill="${CREME}" letter-spacing="-0.5"
  >S&#243; mais Um F&#227; de Pearl Jam</text>

  <!-- Edicao + data (canto direito), 2 linhas centradas em 147px -->
  <text x="${SLIDE_W - SIDE}" y="66"
    font-family="${MONO}" font-size="22" fill="${CREME}"
    letter-spacing="3" text-anchor="end" opacity="0.85"
  >ANO 1 · N° ${ed}</text>
  <text x="${SLIDE_W - SIDE}" y="102"
    font-family="${MONO}" font-size="22" fill="${CREME}"
    letter-spacing="3" text-anchor="end" opacity="0.85"
  >${date}</text>

  <!-- Eyebrow: PEARL JAM caixa alta (reconhecimento de marca instantaneo) -->
  <text x="${SIDE}" y="${EYEBROW_Y}"
    font-family="${SANS_BK}" font-weight="900"
    font-size="32" fill="${tarjaColor}" letter-spacing="3"
  >PEARL JAM · ${cat.toUpperCase()}</text>
  <rect x="${SIDE}" y="${EYEBROW_RY}" width="${EYEBROW_RW}" height="7" fill="${tarjaColor}"/>

  <!-- Headline -->
  <text x="${SIDE}" y="${HEADLINE_Y}"
    font-family="${SERIF}" font-weight="900"
    font-size="${HEADLINE_S}" fill="${TINTA}" letter-spacing="-1"
  >${headSpans}</text>

  <!-- Byline rule + texto -->
  <rect x="${SIDE}" y="${BYLINE_RY}" width="${CONT_W}" height="2.5" fill="${REGUA}"/>
  <text x="${SIDE}" y="${BYLINE_Y}"
    font-family="${MONO}" font-size="25" fill="${SEPIA}" letter-spacing="1.5"
  >${escapeXml(byline)}</text>

  <!-- Espaco da foto (transparente — sharp compoe a imagem aqui) -->

  <!-- Rule + caption abaixo da foto -->
  <rect x="${SIDE}" y="${CAPTION_RY}" width="${CONT_W}" height="2.5" fill="${REGUA}"/>
  <text x="${SIDE}" y="${CAPTION_Y}"
    font-family="${SERIF}" font-style="italic" font-size="28" fill="${SEPIA}"
  >${captSpans}</text>

  <!-- Rodape -->
  <text x="${SIDE}" y="${FOOTER_Y}"
    font-family="${MONO}" font-size="23" fill="${TINTA}" opacity="0.7" letter-spacing="3"
  >CONTINUA EM</text>
  <text x="${SLIDE_W - SIDE}" y="${FOOTER_Y}"
    font-family="${SANS_BK}" font-size="26" fill="${TINTA}" text-anchor="end"
  >SETLISTS-PJ-EV.PAGES.DEV &#x2192;</text>

</svg>`;
}

export async function ensureSlidesDir() {
  await fs.mkdir(SLIDES_DIR, { recursive: true });
}

// ────────────────────────────────────────────────────────────────────────
// NOVO LAYOUT (card02 / capa). Helpers proprios; nao tocam o cadernob.

// Manchete que aparece no card: titulo chamativo do IG, fallback pro do site.
function headlineOf(item) {
  return String(item.title_ig || item.title_pt || "").trim();
}

// Quebra texto em <=maxLines linhas com <=maxChars cada (greedy). Retorna
// null se nao couber sem estourar maxLines (pra o auto-fit reduzir a fonte).
// force=true trunca a ultima linha com reticencias em vez de retornar null.
// Distribui as palavras em L linhas com comprimento equilibrado (rag
// editorial), minimizando a maior linha. Espelha os <br/> manuais do
// design (linhas curtas e parelhas, ~3 palavras, sem correr ate a borda).
function splitBalanced(words, L) {
  const total = words.join(" ").length;
  const target = total / L;
  const lines = [];
  let i = 0;
  for (let ln = 0; ln < L; ln++) {
    let line = words[i++] || "";
    while (
      i < words.length &&
      (words.length - i) > (L - ln - 1) &&            // >=1 palavra por linha restante
      (line + " " + words[i]).length <= Math.ceil(target * 1.12)
    ) {
      line += " " + words[i++];
    }
    lines.push(line);
  }
  while (i < words.length) lines[L - 1] += " " + words[i++];
  return lines;
}

// Quebra editorial: ~3 palavras por linha, equilibrada, sem encher a
// largura. Retorna null se nem assim cabe (o auto-fit reduz a fonte).
function balancedWrap(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const startL = Math.min(maxLines, Math.max(1, Math.ceil(words.length / 3)));
  for (let L = startL; L <= maxLines; L++) {
    const lines = splitBalanced(words, L);
    if (lines.every((ln) => ln.length <= maxChars)) return lines;
  }
  return null;
}

// Auto-fit da manchete Anton (condensada). Reduz a fonte ate caber em
// <=maxLines. k≈0.46 e o avanco medio do glifo Anton em caixa alta;
// calibravel nas amostras locais.
function fitHeadline(text, boxW, maxLines, startSize, minSize) {
  // Design: Anton 78px, line-height 0.95. Tenta 78 primeiro (titulo_ig
  // curto cabe e fica fiel ao design); so reduz como rede de seguranca
  // se um title_pt longo (fallback) estourar maxLines.
  const up = String(text || "").toUpperCase();
  for (let fs = startSize; fs >= minSize; fs -= 2) {
    const maxChars = Math.max(6, Math.floor(boxW / (fs * 0.46)));
    const lines = balancedWrap(up, maxChars, maxLines);
    if (lines) return { fs, lines, lh: Math.round(fs * 0.95) };
  }
  // ultimo recurso: menor fonte, split balanceado com reticencias
  const maxChars = Math.max(6, Math.floor(boxW / (minSize * 0.46)));
  const lines = splitBalanced(up.split(/\s+/).filter(Boolean), maxLines)
    .map((l) => l.length > maxChars ? l.slice(0, maxChars - 1).replace(/[.,;:!?\s]+$/, "") + "…" : l);
  return { fs: minSize, lines, lh: Math.round(minSize * 0.95) };
}

// Pre-processa a fonte: detecta rosto, e se a fonte cortou o rosto no topo
// busca uma imagem melhor (mesma logica do cadernob, fatorada pra reuso).
async function prepareSource(item) {
  const photoRaw = await fetchBaseImageBuffer(item);
  if (!photoRaw) return { srcBuf: null, det: null };
  let srcBuf = photoRaw;
  let det = null;
  try {
    det = await detectFaces(srcBuf);
    if (det && det.faces.length > 0 && det.topCut && item.url) {
      const better = await findBetterImage(item.url);
      if (better && better.buffer) {
        srcBuf = better.buffer;
        det = await detectFaces(srcBuf);
        if (item.img && item.img.startsWith("/media/news/img/")) {
          const dest = path.join(process.cwd(), item.img.replace(/^\//, ""));
          await fs.writeFile(dest, srcBuf).catch(() => {});
        }
        console.log(`[slide] ${item.id}: fonte cortada no rosto -> imagem melhor de ${better.url}`);
      }
    }
  } catch {}
  return { srcBuf, det };
}

// Crop 3-niveis (rosto -> smartcrop -> attention) pra um alvo WxH.
async function coverCrop(srcBuf, det, targetW, targetH) {
  let meta;
  try { meta = await sharp(srcBuf, { failOn: "none" }).metadata(); } catch { meta = {}; }
  let buf = null;
  try {
    const fc = cropFromFaces(det, targetW, targetH);
    if (fc) {
      buf = await sharp(srcBuf, { failOn: "none" })
        .extract(fc).resize(targetW, targetH, { fit: "cover" }).toBuffer();
    }
  } catch {}
  if (!buf) {
    try {
      const { topCrop: c } = await smartcrop.crop(srcBuf, { width: targetW, height: targetH });
      if (c && c.width > 0 && c.height > 0 && meta.width && meta.height) {
        const left = Math.max(0, Math.min(meta.width - 1, Math.round(c.x)));
        const top = Math.max(0, Math.min(meta.height - 1, Math.round(c.y)));
        const width = Math.max(1, Math.min(meta.width - left, Math.round(c.width)));
        const height = Math.max(1, Math.min(meta.height - top, Math.round(c.height)));
        buf = await sharp(srcBuf, { failOn: "none" })
          .extract({ left, top, width, height })
          .resize(targetW, targetH, { fit: "cover" }).toBuffer();
      }
    } catch {}
  }
  if (!buf) {
    buf = await sharp(srcBuf, { failOn: "none" })
      .resize(targetW, targetH, { fit: "cover", position: "attention" }).toBuffer();
  }
  return buf;
}

// Tratamento de foto por resolucao da fonte. SEMPRE devolve buffer exatamente
// targetW×H. Classificacao via scale = quanto a foto precisa ser ampliada
// pra cobrir o alvo (cover crop): max(targetW/srcW, targetH/srcH). Isso e
// justo com fotos wide (ex: 640x363 num alvo 1080x1350): a metrica antiga
// usava min/min e punia esses casos como se fossem quadradinhos pequenos.
//  - scale <= 0.80 -> NITIDA: fonte folgada, cover crop direto.
//  - scale <= 1.80 -> MEDIA: cover crop + sharpen + grao editorial.
//  - scale  > 1.80 -> PEQUENA: cover crop + upscale Lanczos + sharpen forte
//    + grao mais marcado. Aceita pixelizacao leve em troca de manter
//    estetica full-bleed do Card 02 (o fallback antigo "foto contida +
//    blur escuro" desmoronava o card e parecia bug de carregamento).
async function renderPhoto(srcBuf, det, targetW, targetH, tag = "") {
  let meta;
  try { meta = await sharp(srcBuf, { failOn: "none" }).metadata(); } catch { meta = null; }
  if (!meta || !meta.width || !meta.height) {
    return coverCrop(srcBuf, det, targetW, targetH);
  }
  const scale = Math.max(targetW / meta.width, targetH / meta.height);

  if (scale <= 0.80) {
    console.log(`[slide] ${tag} foto nitida (fonte ${meta.width}x${meta.height}, scale ${scale.toFixed(2)})`);
    return coverCrop(srcBuf, det, targetW, targetH);
  }

  if (scale <= 1.80) {
    console.log(`[slide] ${tag} foto media -> realce (fonte ${meta.width}x${meta.height}, scale ${scale.toFixed(2)})`);
    const base = await coverCrop(srcBuf, det, targetW, targetH);
    let grain = null;
    try {
      grain = await sharp({
        create: { width: targetW, height: targetH, channels: 3,
          noise: { type: "gaussian", mean: 128, sigma: 7 } },
      }).greyscale().png().toBuffer();
    } catch {}
    let pipe = sharp(base).sharpen(1.2).modulate({ saturation: 1.04 });
    if (grain) pipe = pipe.composite([{ input: grain, blend: "soft-light" }]);
    return pipe.toBuffer();
  }

  console.log(`[slide] ${tag} foto pequena -> upscale agressivo (fonte ${meta.width}x${meta.height}, scale ${scale.toFixed(2)})`);
  // coverCrop ja amplia pra targetW×H via libvips (kernel padrao bom).
  // Em cima dele: sharpen forte pra recuperar borda do upscale, leve boost
  // de saturacao, e grao gaussiano mais denso que disfarca o softness.
  const base = await coverCrop(srcBuf, det, targetW, targetH);
  let grain = null;
  try {
    grain = await sharp({
      create: { width: targetW, height: targetH, channels: 3,
        noise: { type: "gaussian", mean: 128, sigma: 12 } },
    }).greyscale().png().toBuffer();
  } catch {}
  let pipe = sharp(base).sharpen({ sigma: 1.8, m1: 1.0, m2: 2.0 }).modulate({ saturation: 1.06 });
  if (grain) pipe = pipe.composite([{ input: grain, blend: "soft-light" }]);
  return pipe.toBuffer();
}

// Bloco de rodape compartilhado (tarja + manchete + credito), ancorado no
// fundo. Retorna o markup SVG. tagBg/headFill controlam contraste.
function footerBlockSvg({ tag, headline, tagBg, tagFg = "#fff", headFill = "#fff" }) {
  const PAD = 56;
  const boxW = SLIDE_W - PAD * 2;
  const bottomPad = 64;
  const ctaFS = 23;          // "LEIA MAIS …"
  const urlFS = 21;          // site, logo abaixo da CTA (alinhado a esquerda)
  const ctaUrlGap = 18;      // espaco entre a CTA e o site
  const headMargin = 28;     // design: marginTop do bloco abaixo do headline

  // Ordem de baixo pra cima: site, CTA, headline, tarja.
  const urlBaseline = SLIDE_H - bottomPad;
  const ctaBaseline = urlBaseline - urlFS - ctaUrlGap;
  const fit = fitHeadline(headline, boxW, 3, 78, 50);
  const n = fit.lines.length;
  const lastBaseline = ctaBaseline - ctaFS - headMargin;
  const firstBaseline = lastBaseline - (n - 1) * fit.lh;
  const headTopY = firstBaseline - fit.fs * 0.78;

  const headSpans = fit.lines
    .map((l, i) => `<tspan x="${PAD}" y="${firstBaseline + i * fit.lh}">${escapeXml(l)}</tspan>`)
    .join("");

  // Tarja: rect dimensionado pelo texto (Inter ExtraBold ~0.60em/char).
  // Tarja: design Inter 24/800, ls 1.92, padding T14 R24 B12 L24,
  // margin-bottom 24. Largura inclui o letter-spacing acumulado.
  const tagText = String(tag || "").toUpperCase();
  const tagFS = 24, tagLS = 1.92;
  const tagPadX = 24, tagPadTop = 14, tagPadBot = 12;
  const tagTextW = Math.round(tagText.length * tagFS * 0.60 + Math.max(0, tagText.length - 1) * tagLS);
  const tagBoxW = tagTextW + tagPadX * 2;
  const tagBoxH = tagFS + tagPadTop + tagPadBot;
  const tagBottomY = headTopY - 24;
  const tagTopY = tagBottomY - tagBoxH;
  const tagTextBaseline = tagTopY + tagPadTop + tagFS * 0.80;

  return `
  <rect x="${PAD}" y="${Math.round(tagTopY)}" width="${tagBoxW}" height="${Math.round(tagBoxH)}" fill="${tagBg}"/>
  <text x="${PAD + tagPadX}" y="${Math.round(tagTextBaseline)}"
    font-family="${F_INTER_XB}" font-weight="800" font-size="${tagFS}"
    fill="${tagFg}" letter-spacing="${tagLS}">${escapeXml(tagText)}</text>

  <text font-family="${F_ANTON}" font-size="${fit.fs}" fill="${headFill}"
    letter-spacing="0.39">${headSpans}</text>

  <text x="${PAD}" y="${ctaBaseline}"
    font-family="${F_INTER_XB}" font-weight="800" font-size="${ctaFS}"
    fill="#ffffff" letter-spacing="4">LEIA MAIS &#8230;</text>

  <text x="${PAD}" y="${urlBaseline}"
    font-family="${F_INTER_SB}" font-size="${urlFS}"
    fill="#ffffff" opacity="0.82" letter-spacing="0.5">setlists-pj-ev.pages.dev</text>`;
}

// Wordmark "Só Mais um Fã de PEARL JAM" centrado no topo (Playfair italic).
function wordmarkSvg(fill = "#fff") {
  // Design (canvas): Playfair Display 28px, peso 900, italic, ls -0.56,
  // centrado no topo (top:36). Tamanho refinado do design, sem contorno.
  return `<text x="${SLIDE_W / 2}" y="60" text-anchor="middle"
    font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="28"
    fill="${fill}" letter-spacing="-0.56">Só Mais um Fã de PEARL JAM</text>`;
}

// Cunha vermelha diagonal no canto superior esquerdo (referencia Atletico).
function cornerWedgeSvg(size = 260, color = "#E10600") {
  // Design: caixa size×size com linear-gradient(135deg) cor 0% a 42%,
  // transparente em 42.5%. Replica exata. Antes eu enchia meia caixa
  // (poligono cheio), por isso parecia grande demais; agora o vermelho
  // visivel e o triangulo menor cortado em 42%, igual ao design.
  return `<defs>
    <linearGradient id="wedge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="42%" stop-color="${color}"/>
      <stop offset="42.5%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" fill="url(#wedge)"/>`;
}

// Card 02: foto cheia + gradiente + cunha + wordmark + rodape.
function buildCard02Svg(item) {
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat = CAT_LABELS[tags[0]] || "Notícia";
  // Cor do ciclo (3 posts/cor) anotada pelo run-publish; cunha + tarja
  // acompanham. Fallback vermelho se rodar fora do pipeline (preview).
  const accent = item._cycleColor || "#E10600";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <defs>
    <linearGradient id="g02" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.22"/>
      <stop offset="30%" stop-color="#000" stop-opacity="0"/>
      <stop offset="78%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.95"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${SLIDE_W}" height="${SLIDE_H}" fill="url(#g02)"/>
  ${cornerWedgeSvg(260, accent)}
  ${wordmarkSvg("#fff")}
  ${footerBlockSvg({
    tag: cat,
    headline: headlineOf(item),
    tagBg: accent,
    tagFg: "#fff",
    headFill: "#fff",
  })}
</svg>`;
}

// ── Capa (Card 11 do bundle: Card_BigTypeFooter bg #0a0a0a) ──────────────
// Fiel ao projeto: "PEARL/JAAAM" Anton 380 lh 0.78 ls -0.03em top 90 ATRAS
// (zIndex 2); card de foto 860x540 em (110,290) com sombra 0 30 80 .45
// (zIndex 3); wordmark Playfair 28 top 36 (zIndex 5); rodape tarja Inter
// 22/800 ls 0.1em + manchete Anton 70 lh 0.96 (zIndex 5).

// Cor da tarja por fundo (contraste). Espelha a regra do bundle
// (vermelho<->preto) e estende pras cores de marca ocre/azul.
function coverLabelBg(bg) {
  const map = {
    "#0a0a0a": "#E10600", // preto -> tarja vermelha
    "#e10600": "#0a0a0a", // vermelho -> tarja preta
    "#a87f2c": "#0a0a0a", // ocre -> tarja preta
    "#2a5b9e": "#E10600", // azul petroleo -> tarja vermelha
  };
  return map[String(bg).toLowerCase()] || "#E10600";
}

function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return { r: 10, g: 10, b: 10 };
  const n = parseInt(m[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// Camada de tras: fundo + tipo gigante (a foto cobre o meio depois).
function buildCoverBackSvg(bg = "#0a0a0a") {
  const cx = SLIDE_W / 2;             // box do design -20..1100, centro = 540
  const FS = 380, LS = Math.round(-0.03 * FS); // -11
  // baselines: cap-top do PEARL ~y106 (abaixo do wordmark que termina ~y64,
  // ~40px de folga, igual ao fluxo do design h1 top:90 lh 0.78). JAAAM
  // (linha 2) cai atras da foto (efeito texto-atras do bundle).
  const b1 = 380;
  const b2 = b1 + Math.round(0.78 * FS); // ~676
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <rect x="0" y="0" width="${SLIDE_W}" height="${SLIDE_H}" fill="${bg}"/>
  <text x="${cx}" y="${b1}" text-anchor="middle"
    font-family="${F_ANTON}" font-size="${FS}" fill="#ffffff" letter-spacing="${LS}">PEARL</text>
  <text x="${cx}" y="${b2}" text-anchor="middle"
    font-family="${F_ANTON}" font-size="${FS}" fill="#ffffff" letter-spacing="${LS}">JAAAM</text>
</svg>`;
}

// Sombra do card de foto (design boxShadow: 0 30px 80px rgba(0,0,0,.45)).
function buildCoverShadowSvg(x, y, w, h) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <defs>
    <filter id="csh" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="40"/>
    </filter>
  </defs>
  <rect x="${x}" y="${y + 30}" width="${w}" height="${h}" fill="#000000" fill-opacity="0.45" filter="url(#csh)"/>
</svg>`;
}

// Camada da frente: wordmark + rodape (tarja + manchete + site).
function buildCoverFrontSvg(leadItem, bg = "#0a0a0a") {
  const PAD = 56;
  const boxW = SLIDE_W - PAD * 2; // 968
  const tags = Array.isArray(leadItem.tags) ? leadItem.tags : [];
  const cat = (CAT_LABELS[tags[0]] || "Notícia").toUpperCase();
  const label = `PEARL JAM · ${cat}`;

  // Rodape ancorado no fundo (design: bottom 0, padding 0 56 64).
  const bottomPad = 64;
  const urlFS = 19;
  const urlMargin = 22;          // design marginTop 22 do bloco abaixo da manchete
  const urlBaseline = SLIDE_H - bottomPad;

  const fit = fitHeadline(headlineOf(leadItem), boxW, 3, 70, 46);
  const n = fit.lines.length;
  const lastBaseline = urlBaseline - urlFS - urlMargin;
  const firstBaseline = lastBaseline - (n - 1) * fit.lh;
  const headTopY = firstBaseline - fit.fs * 0.78;
  const headSpans = fit.lines
    .map((l, i) => `<tspan x="${PAD}" y="${firstBaseline + i * fit.lh}">${escapeXml(l)}</tspan>`)
    .join("");

  // Tarja (design: Inter 22/800, ls 0.1em≈2.2, padding 12/22/10, mb 24).
  const labelFS = 22, labelLS = 2.2;
  const lPadX = 22, lPadTop = 12, lPadBot = 10;
  const lTextW = Math.round(label.length * labelFS * 0.60 + Math.max(0, label.length - 1) * labelLS);
  const lBoxW = lTextW + lPadX * 2;
  const lBoxH = labelFS + lPadTop + lPadBot;
  const lBottomY = headTopY - 24;
  const lTopY = lBottomY - lBoxH;
  const lTextBaseline = lTopY + lPadTop + labelFS * 0.80;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SLIDE_W}" height="${SLIDE_H}" viewBox="0 0 ${SLIDE_W} ${SLIDE_H}">
  <text x="${SLIDE_W / 2}" y="60" text-anchor="middle"
    font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="28"
    fill="#ffffff" letter-spacing="-0.56">Só Mais um Fã de PEARL JAM</text>

  <rect x="${PAD}" y="${Math.round(lTopY)}" width="${lBoxW}" height="${Math.round(lBoxH)}" fill="${coverLabelBg(bg)}"/>
  <text x="${PAD + lPadX}" y="${Math.round(lTextBaseline)}"
    font-family="${F_INTER_XB}" font-weight="800" font-size="${labelFS}"
    fill="#ffffff" letter-spacing="${labelLS}">${escapeXml(label)}</text>

  <text font-family="${F_ANTON}" font-size="${fit.fs}" fill="#ffffff"
    letter-spacing="0.35">${headSpans}</text>

  <text x="${PAD}" y="${urlBaseline}"
    font-family="${F_INTER_SB}" font-size="${urlFS}"
    fill="#ffffff" opacity="0.6" letter-spacing="0.5">setlists-pj-ev.pages.dev</text>
</svg>`;
}

// Slide Card 02 (noticia/solo). Cache proprio (.card02.jpg).
// outDir opcional (default SLIDES_DIR): o preview gera num dir separado sem
// sujar a producao.
async function buildCard02Slide(item, { outDir } = {}) {
  const dir = outDir || SLIDES_DIR;
  if (outDir) await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${item.id}.card02.jpg`);
  try {
    const st = await fs.stat(dest);
    if (st.size > 1024) return { path: dest, reused: true };
  } catch {}

  const { srcBuf, det } = await prepareSource(item);
  const layers = [];
  if (srcBuf) {
    try {
      const photo = await renderPhoto(srcBuf, det, SLIDE_W, SLIDE_H, item.id);
      layers.push({ input: photo, top: 0, left: 0 });
    } catch (e) {
      console.warn(`[slide] ${item.id}: crop falhou (${e.message})`);
    }
  }
  layers.push({ input: Buffer.from(buildCard02Svg(item)), blend: "over" });

  const base = await sharp({
    create: { width: SLIDE_W, height: SLIDE_H, channels: 3, background: { r: 0, g: 0, b: 0 } },
  }).png().toBuffer();

  await sharp(base).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, reused: false };
}

// Slide capa do carrossel (Card 11). destId define o nome do arquivo
// (sintetico, ex: _cover-regular-2026-05-16). Sempre regenera (a edicao /
// item lider muda a cada run).
export async function buildCoverSlide(leadItem, destId, bg = "#0a0a0a") {
  await ensureSlidesDir();
  const dest = path.join(SLIDES_DIR, `${destId}.jpg`);

  const { srcBuf, det } = await prepareSource(leadItem);

  // Foto: o componente Photo do bundle tem override fixo 860x700 (o
  // container e 540 mas o image-slot dentro e 700). Fiel = 860x700.
  const PHOTO_X = 110, PHOTO_Y = 290, PHOTO_W = SLIDE_W - 220, PHOTO_BH = 700;
  // Ordem (z do design): fundo+tipo (z2) -> sombra -> foto (z3) -> frente (z5)
  const layers = [
    { input: Buffer.from(buildCoverBackSvg(bg)), blend: "over" },
  ];
  if (srcBuf) {
    try {
      const photo = await renderPhoto(srcBuf, det, PHOTO_W, PHOTO_BH, `${leadItem.id} (capa)`);
      layers.push({ input: Buffer.from(buildCoverShadowSvg(PHOTO_X, PHOTO_Y, PHOTO_W, PHOTO_BH)), blend: "over" });
      layers.push({ input: photo, top: PHOTO_Y, left: PHOTO_X });
    } catch (e) {
      console.warn(`[slide] capa: crop falhou (${e.message})`);
    }
  }
  layers.push({ input: Buffer.from(buildCoverFrontSvg(leadItem, bg)), blend: "over" });

  const base = await sharp({
    create: { width: SLIDE_W, height: SLIDE_H, channels: 3, background: hexToRgb(bg) },
  }).png().toBuffer();

  await sharp(base).composite(layers).jpeg({ quality: 88, mozjpeg: true }).toFile(dest);
  return { path: dest, id: destId, reused: false };
}

export async function buildSlide(item, { outDir } = {}) {
  await ensureSlidesDir();

  if (LAYOUT === "card02") {
    return buildCard02Slide(item, { outDir });
  }

  // ===== CAMINHO CADERNOB (layout em producao, intocado) =====
  const dir = outDir || SLIDES_DIR;
  if (outDir) await fs.mkdir(dir, { recursive: true });
  const dest = path.join(dir, `${item.id}.jpg`);
  try {
    const st = await fs.stat(dest);
    if (st.size > 1024) return { path: dest, reused: true };
  } catch {}

  const photoRaw = await fetchBaseImageBuffer(item);
  // Edicao = dia da postagem no IG (hoje), nao a data da noticia.
  const editionDate = new Date();
  const edition = await getEditionNumber(editionDate);

  // Base creme 1080x1350
  const base = await sharp({
    create: { width: SLIDE_W, height: SLIDE_H, channels: 3, background: { r: 244, g: 237, b: 224 } },
  }).png().toBuffer();

  const layers = [];

  // Foto full-bleed com enquadramento inteligente, em 3 niveis:
  //  1) deteccao de rosto real (blazeface): se houver gente, recorta
  //     mantendo todos os rostos no terco superior com headroom;
  //  2) smartcrop (pele+bordas+saturacao): melhor pra poster/album/
  //     objeto sem rosto;
  //  3) cover "attention": ultimo recurso.
  // Sempre preenche a moldura inteira (sem barra, sem blur).
  if (photoRaw) {
    try {
      let srcBuf = photoRaw;

      // 0) Deteccao de rosto na imagem primaria. Se o rosto vier
      //    colado no topo (fonte cortada na testa/cabeca), raspa a
      //    pagina da materia atras de uma foto melhor e persiste no
      //    cache local (conserta tambem os runs futuros).
      let det = await detectFaces(srcBuf);
      if (det && det.faces.length > 0 && det.topCut && item.url) {
        try {
          const better = await findBetterImage(item.url);
          if (better && better.buffer) {
            srcBuf = better.buffer;
            det = await detectFaces(srcBuf);
            if (item.img && item.img.startsWith("/media/news/img/")) {
              const dest = path.join(process.cwd(), item.img.replace(/^\//, ""));
              await fs.writeFile(dest, srcBuf).catch(() => {});
            }
            console.log(`[slide] ${item.id}: fonte cortada no rosto -> imagem melhor de ${better.url}`);
          }
        } catch {}
      }

      const meta = await sharp(srcBuf, { failOn: "none" }).metadata();
      let photoBuf = null;

      // 1) rosto real (reaproveita a deteccao ja feita)
      try {
        const fc = cropFromFaces(det, CONT_W, PHOTO_H);
        if (fc) {
          photoBuf = await sharp(srcBuf, { failOn: "none" })
            .extract(fc)
            .resize(CONT_W, PHOTO_H, { fit: "cover" })
            .toBuffer();
        }
      } catch {}

      // 2) smartcrop
      if (!photoBuf) {
        try {
          const { topCrop: c } = await smartcrop.crop(srcBuf, {
            width: CONT_W,
            height: PHOTO_H,
          });
          if (c && c.width > 0 && c.height > 0) {
            const left = Math.max(0, Math.min(meta.width - 1, Math.round(c.x)));
            const top = Math.max(0, Math.min(meta.height - 1, Math.round(c.y)));
            const width = Math.max(1, Math.min(meta.width - left, Math.round(c.width)));
            const height = Math.max(1, Math.min(meta.height - top, Math.round(c.height)));
            photoBuf = await sharp(srcBuf, { failOn: "none" })
              .extract({ left, top, width, height })
              .resize(CONT_W, PHOTO_H, { fit: "cover" })
              .toBuffer();
          }
        } catch {}
      }

      // 3) attention
      if (!photoBuf) {
        photoBuf = await sharp(srcBuf, { failOn: "none" })
          .resize(CONT_W, PHOTO_H, { fit: "cover", position: "attention" })
          .toBuffer();
      }

      layers.push({ input: photoBuf, top: PHOTO_TOP, left: SIDE });
    } catch {}
  }

  // SVG Caderno B por cima (transparente onde nao ha elementos)
  const svg = Buffer.from(buildCadernoBSvg(item, edition, editionDate));
  layers.push({ input: svg, blend: "over" });

  await sharp(base)
    .composite(layers)
    .jpeg({ quality: 88, mozjpeg: true })
    .toFile(dest);

  return { path: dest, reused: false };
}

export async function buildSlides(items, opts = {}) {
  const out = [];
  for (const it of items) {
    try {
      const r = await buildSlide(it, opts);
      out.push({ id: it.id, path: r.path, reused: r.reused });
    } catch (e) {
      console.warn(`[slide] falha em ${it.id}: ${e.message}`);
    }
  }
  return out;
}

// fitHeadline exportado pra teste/simulacao de comprimento de manchete
// (helper puro, nao altera runtime).
export { LAYOUT, fitHeadline };
