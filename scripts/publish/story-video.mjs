// Gerador de MP4 1080x1920 (story IG) animado frame-a-frame.
//
// Pipeline:
//   1. Pra cada item, fetch da imagem cover. Pre-renderiza UM PNG
//      "base do card" em alta (foto + escurece) que serve de fundo
//      pra todos os frames daquele card (perf: nao re-renderiza a
//      composicao da foto a cada frame).
//   2. Gera FRAMES_TOTAL (~660 pra 22s a 30fps) PNGs, cada um com
//      estado calculado em funcao do tempo (typewriter, slide-in,
//      pop, zoom). Frames em paralelo via Promise.all batches.
//   3. ffmpeg consome a sequencia (-framerate 30 -i %04d.png) e
//      mixa com a trilha (loudnorm -16 LUFS, fade in/out).
//
// Mais pesado em tempo+disk que xfade simples, mas entrega animacao
// real (palavras surgindo, chips pulando, intro com SMUFDPJ se
// montando letra a letra). E o que o feed pede pra um story.
//
// Timeline (total 22.0s):
//   [0.0,  3.0)  intro
//   [3.0,  6.5)  card 1
//   [6.5, 10.0)  card 2
//  [10.0, 13.5)  card 3
//  [13.5, 17.0)  card 4
//  [17.0, 20.5)  card 5
//  [20.5, 22.0)  outro (1.5s, curto e seco)
// Transicao entre estados: 0.25s de crossfade (alpha overlay).

// fontconfig-boot ANTES de sharp: side-effect seta o env do fontconfig
// e fornece as familias F_* (Anton/Inter/Playfair), iguais ao slide.
import { F_ANTON, F_INTER, F_INTER_SB, F_INTER_XB, F_PLAYFAIR } from "./fontconfig-boot.mjs";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import sharp from "sharp";
import got from "got";
import { pickStyle, DEFAULT_STYLE } from "./story-styles/index.mjs";
import { getEditionNumber } from "./edition.mjs";

const STORY_STYLE = process.env.STORY_STYLE || process.env.INTRO_STYLE || DEFAULT_STYLE;
const activeStyle = pickStyle(STORY_STYLE);

const W = 1080;
const H = 1920;
const FPS = 30;
// Timeline DINAMICA: total = intro + N cards + outro. Calculada por run
// em buildStoryVideo (antes era fixa 22s e o array de items era
// preenchido repetindo a mesma materia ate 5 quando havia poucas).

// Marcos da timeline (em segundos)
const T_INTRO_END = 3.0;
const T_CARD_DUR = 3.5;
const T_OUTRO_DUR = 1.5;
const T_CROSSFADE = 0.25;

const TAG_LABELS = {
  turne: "TURNÊ", lancamento: "LANÇAMENTO", tenclub: "TEN CLUB",
  memoria: "MEMÓRIA", br: "BRASIL", bootleg: "BOOTLEG",
  comunidade: "COMUNIDADE", eddie: "EDDIE", mike: "MIKE",
  stone: "STONE", jeff: "JEFF", matt: "MATT", boom: "BOOM", josh: "JOSH",
  loja: "LOJA",
};
const TAG_COLORS = {
  turne: "#c8261c", lancamento: "#1b6e7b", tenclub: "#7a4d23",
  memoria: "#a87f2c", br: "#2d6b39", bootleg: "#5a4b2c",
  comunidade: "#2a5b9e", eddie: "#5a3d80", mike: "#8a3a30",
  stone: "#3a4d5a", jeff: "#4a6b3a", matt: "#c45a1c",
  boom: "#2e4d7a", josh: "#8a6d1c", loja: "#7a4d23",
};
const MONTH_PT = ["JAN","FEV","MAR","ABR","MAI","JUN","JUL","AGO","SET","OUT","NOV","DEZ"];
const MONTH_PT_LONG = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO","DEZEMBRO"];
const DOW_PT_SHORT = ["DOM","SEG","TER","QUA","QUI","SEX","SAB"];
const DOW_PT_LONG = ["DOMINGO","SEGUNDA-FEIRA","TERÇA-FEIRA","QUARTA-FEIRA","QUINTA-FEIRA","SEXTA-FEIRA","SÁBADO"];

function buildIntroState({ date, itemCount, tarjaColor, badgeAnim, edition }) {
  return {
    W, H,
    day: date.getUTCDate(),
    month: date.getUTCMonth() + 1,
    monthShort: MONTH_PT[date.getUTCMonth()],
    monthLong: MONTH_PT_LONG[date.getUTCMonth()],
    year: date.getUTCFullYear(),
    dayOfWeekShort: DOW_PT_SHORT[date.getUTCDay()],
    dayOfWeekLong: DOW_PT_LONG[date.getUTCDay()],
    edition,
    itemCount,
    tarjaColor,
    // animacao do badge: frames (base64 PNG), fps original do GIF e
    // total. Pra GIF: badgeFps>0, totalFrames=N. Pra PNG estatico:
    // badgeFps=0, totalFrames=1. Pra ausente: badgeFrames=null.
    badgeFrames: badgeAnim?.frames || null,
    badgeFps: badgeAnim?.fps || 0,
    badgeTotalFrames: badgeAnim?.totalFrames || 0,
    // compat retro: 1o frame disponivel como string base64 unica
    badgePngBase64: badgeAnim?.frames?.[0] || null,
  };
}

// ffprobe pra metadata do GIF (fps, total frames, duration).
function ffprobeGif(file) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=nb_frames,r_frame_rate,duration",
      "-of", "default=noprint_wrappers=1",
      file,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) return reject(new Error("ffprobe failed"));
      const lines = stdout.split(/\r?\n/);
      const get = (k) => {
        const ln = lines.find((l) => l.startsWith(`${k}=`));
        return ln ? ln.split("=")[1].trim() : null;
      };
      let fps = 15;
      const r = get("r_frame_rate");
      if (r && r.includes("/")) {
        const [num, den] = r.split("/").map(Number);
        if (den) fps = num / den;
      }
      const totalFrames = parseInt(get("nb_frames") || "0", 10);
      const durationS = parseFloat(get("duration") || "0");
      resolve({ fps, totalFrames, durationS });
    });
  });
}

// Carrega badge animado: extrai TODOS os frames do GIF via ffmpeg,
// converte cada um pra PNG base64 (resize 800x800 max pra leveza).
// Se for PNG estatico, retorna { frames: [b64], fps: 0, totalFrames: 1 }.
async function loadBadgeAnimated() {
  const gifPath = path.join(process.cwd(), "scripts/publish/assets/intro-badge.gif");
  const pngPath = path.join(process.cwd(), "scripts/publish/assets/intro-badge.png");

  // 1) GIF animado (prioridade)
  try {
    const stat = await fs.stat(gifPath);
    if (stat.isFile() && stat.size >= 1024) {
      const meta = await ffprobeGif(gifPath);
      const extractDir = await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-badge-"));
      await new Promise((resolve, reject) => {
        const child = spawn("ffmpeg", [
          "-y", "-i", gifPath,
          "-vsync", "0",
          path.join(extractDir, "f_%04d.png"),
        ], { stdio: ["ignore", "pipe", "pipe"] });
        let stderr = "";
        child.stderr.on("data", (d) => { stderr += d.toString(); });
        child.on("error", reject);
        child.on("close", (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg gif extract: ${stderr.slice(-500)}`)));
      });
      const files = (await fs.readdir(extractDir)).filter((f) => f.endsWith(".png")).sort();
      const frames = [];
      for (const f of files) {
        const buf = await sharp(path.join(extractDir, f), { failOn: "none" })
          .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 })
          .toBuffer();
        frames.push(buf.toString("base64"));
      }
      await fs.rm(extractDir, { recursive: true, force: true });
      const totalKB = frames.reduce((s, b) => s + b.length, 0) / 1024;
      console.log(`[story-video] badge GIF: ${frames.length} frames @ ${meta.fps.toFixed(1)}fps (${totalKB.toFixed(0)}KB total)`);
      return { frames, fps: meta.fps, totalFrames: frames.length };
    }
  } catch {}

  // 2) PNG estatico fallback
  try {
    const stat = await fs.stat(pngPath);
    if (stat.isFile() && stat.size >= 1024) {
      const buf = await sharp(pngPath, { failOn: "none" })
        .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer();
      console.log(`[story-video] badge PNG estatico (${(buf.length / 1024).toFixed(0)}KB)`);
      return { frames: [buf.toString("base64")], fps: 0, totalFrames: 1 };
    }
  } catch {}

  console.log("[story-video] badge nao encontrado em assets/intro-badge.{gif,png}");
  return null;
}

// Paleta fanzine xerox: BG creme amassado + tinta preta + cor de destaque.
// Usada na intro e outro (cards mantem BG da foto da materia).
const CREME = "#ede4cc";
const TINTA = "#0a0908";
// Cor de destaque para data/LINK NA BIO: NUNCA igual a tarja do dia,
// pra evitar peca monocromatica e perder contraste com a tarja superior.
const ACCENT_FOR = {
  "#c12727": "#0a0908", // vermelho -> preto
  "#0a0908": "#c12727", // preto    -> vermelho
  "#a87f2c": "#0a0908", // ocre     -> preto
  "#2a5b9e": "#c12727", // azul     -> vermelho
};
function pickAccent(tarjaColor) {
  return ACCENT_FOR[tarjaColor] || "#c12727";
}

// ============ easing ============
const clamp01 = (v) => Math.max(0, Math.min(1, v));
function easeOutCubic(t) { const x = clamp01(t); return 1 - Math.pow(1 - x, 3); }
function easeOutBack(t) { const x = clamp01(t); const c1 = 1.70158; const c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }
function easeInOutQuad(t) { const x = clamp01(t); return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function progress(t, start, dur) { return clamp01((t - start) / dur); }

// ============ util ============
function escapeXml(s) {
  return String(s ?? "").replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" }[c])
  );
}

function wrapText(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
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

// Pega N primeiros chars de um texto multi-linha preservando quebras
// (typewriter respeita o wrap pre-calculado).
function sliceWrapped(lines, nChars) {
  let remaining = nChars;
  const out = [];
  for (const ln of lines) {
    if (remaining <= 0) { out.push(""); continue; }
    if (ln.length <= remaining) { out.push(ln); remaining -= ln.length; }
    else { out.push(ln.slice(0, remaining)); remaining = 0; }
  }
  return out;
}

async function fetchImageBuffer(item) {
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
  // Sem foto propria (ex: community spotlight): foto oficial da banda
  // (mesmo conjunto do slide), escolhida pelo 1o nibble hex do id.
  try {
    const hex = String(item.id || "").replace(/[^0-9a-f]/gi, "")[0] || "0";
    const n = (parseInt(hex, 16) % 4) + 1;
    const fb = path.join(process.cwd(), `media/news/img/_band-fallback-${n}.jpg`);
    const buf = await fs.readFile(fb);
    if (buf && buf.length > 1024) return buf;
  } catch {}
  return null;
}

async function makeFallbackBg() {
  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 26, g: 24, b: 21 } },
  }).png().toBuffer();
}

// ============ SVG helpers ============
function defsBlock() {
  return `<defs>
    <linearGradient id="darkFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(10,9,8,0.35)" />
      <stop offset="50%" stop-color="rgba(10,9,8,0.65)" />
      <stop offset="100%" stop-color="rgba(10,9,8,0.92)" />
    </linearGradient>
    <linearGradient id="topShade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(10,9,8,0.7)" />
      <stop offset="100%" stop-color="rgba(10,9,8,0)" />
    </linearGradient>
    <filter id="textShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0a0908" flood-opacity="0.9"/>
    </filter>
  </defs>`;
}

// Tarjas com animacao de slide: superior desce do topo (y = -130 -> 0),
// inferior sobe (y = H -> H-130). slideProgress 0..1.
function tarjasSvg(tarjaColor, slideProgress = 1) {
  const p = easeOutCubic(slideProgress);
  const topY = -130 + 130 * p;
  const botY = H - 130 * p;
  return `
    <g>
      <rect x="0" y="${topY}" width="${W}" height="130" fill="${tarjaColor}"/>
      <rect x="0" y="${topY + 130}" width="${W}" height="6" fill="#0a0908"/>
    </g>
    <g>
      <rect x="0" y="${botY - 6}" width="${W}" height="6" fill="#0a0908"/>
      <rect x="0" y="${botY}" width="${W}" height="130" fill="${tarjaColor}"/>
    </g>`;
}

function brandHeaderSvg(opacity = 1) {
  return `
    <g opacity="${opacity.toFixed(2)}">
      <text x="60" y="92" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="64" font-weight="900" fill="#f7f1de" stroke="#0a0908" stroke-width="2" paint-order="stroke fill" letter-spacing="12">SMUFDPJ</text>
      <text x="${W - 60}" y="74" font-family="'Special Elite',Courier,monospace" font-size="16" fill="#f7f1de" letter-spacing="4" text-anchor="end" opacity="0.92">SÓ MAIS UM FÃ</text>
      <text x="${W - 60}" y="102" font-family="'Special Elite',Courier,monospace" font-size="16" fill="#f7f1de" letter-spacing="4" text-anchor="end" opacity="0.92">DE PEARL JAM</text>
    </g>`;
}

function brandFooterSvg(opacity = 1) {
  return `<text opacity="${opacity.toFixed(2)}" x="${W / 2}" y="${H - 60}" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="44" font-weight="900" fill="#f7f1de" stroke="#0a0908" stroke-width="2" paint-order="stroke fill" letter-spacing="6" text-anchor="middle">SETLISTS-PJ-EV.PAGES.DEV</text>`;
}

function tagChipSvg(label, color, x, y, scale, opacity) {
  const w = label.length * 19 + 44;
  return `<g transform="translate(${x},${y}) scale(${scale.toFixed(3)})" opacity="${opacity.toFixed(2)}" transform-origin="${w / 2} 28">
    <rect width="${w}" height="56" rx="3" fill="${color}" stroke="#0a0908" stroke-width="2"/>
    <text x="${w / 2}" y="38" font-family="'Big Shoulders Stencil Display','Arial Black',Impact,sans-serif" font-size="28" font-weight="900" fill="#f7f1de" text-anchor="middle" letter-spacing="2">${escapeXml(label)}</text>
  </g>`;
}

// Renderiza ate 3 chips em sequencia. animProgress 0..1 (com stagger interno).
function tagsChipsAnimatedSvg(tags, yBase, animProgress) {
  const slice = tags.slice(0, 3);
  const out = [];
  let x = 60;
  // stagger de 0.18 entre chips em escala 0..1
  for (let i = 0; i < slice.length; i++) {
    const localP = clamp01((animProgress - i * 0.18) / (1 - i * 0.18));
    const t = slice[i];
    const key = String(t).toLowerCase();
    const label = TAG_LABELS[key] || key.toUpperCase();
    const color = TAG_COLORS[key] || "#444";
    const scale = easeOutBack(localP);
    const opacity = clamp01(localP * 2);
    out.push(tagChipSvg(label, color, x, yBase, scale, opacity));
    const w = label.length * 19 + 44;
    x += w + 16;
  }
  return out.join("");
}

// ============ render por estado ============

// INTRO e OUTRO delegam para o plug system story-styles/<name>.mjs.
// Style ativo definido por env STORY_STYLE (default: brutalist).
// Mesmo style cobre intro+outro pra garantir continuidade visual.
const buildIntroFrame = activeStyle.intro;
const buildOutroFrame = activeStyle.outro;

// ===== Helpers do padrao card02 no story (vertical 1080x1920) =====

const SIDE_S = 64;
const CAT_LABELS_S = {
  turne: "Turnê", lancamento: "Lançamento", tenclub: "Ten Club",
  memoria: "Memória", br: "Brasil", bootleg: "Bootleg",
  comunidade: "Comunidade", eddie: "Eddie", mike: "Mike",
  stone: "Stone", jeff: "Jeff", matt: "Matt", boom: "Boom",
  josh: "Josh", loja: "Loja",
};

// Quebra editorial balanceada (~3 palavras/linha), igual ao slide card02.
function splitBalancedS(words, L) {
  const total = words.join(" ").length;
  const target = total / L;
  const lines = [];
  let i = 0;
  for (let ln = 0; ln < L; ln++) {
    let line = words[i++] || "";
    while (
      i < words.length &&
      (words.length - i) > (L - ln - 1) &&
      (line + " " + words[i]).length <= Math.ceil(target * 1.12)
    ) line += " " + words[i++];
    lines.push(line);
  }
  while (i < words.length) lines[L - 1] += " " + words[i++];
  return lines;
}
function balancedWrapS(text, maxChars, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const startL = Math.min(maxLines, Math.max(1, Math.ceil(words.length / 3)));
  for (let L = startL; L <= maxLines; L++) {
    const lines = splitBalancedS(words, L);
    if (lines.every((ln) => ln.length <= maxChars)) return lines;
  }
  return splitBalancedS(words, maxLines)
    .map((l) => l.length > maxChars ? l.slice(0, maxChars - 1).replace(/[.,;:!?\s]+$/, "") + "…" : l);
}

// Cunha vermelha (cor do ciclo) cortada em 42%, igual ao Card 02.
function coverWedgeS(size, color, opacity = 1) {
  return `<g opacity="${opacity.toFixed(2)}"><defs>
    <linearGradient id="wcard" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="42%" stop-color="${color}"/>
      <stop offset="42.5%" stop-color="${color}" stop-opacity="0"/>
    </linearGradient></defs>
    <rect x="0" y="0" width="${size}" height="${size}" fill="url(#wcard)"/></g>`;
}

// CARD card02: wedge -> wordmark/counter fade -> tarja pop -> manchete typewriter
function buildCardSvg({ tarjaColor, item, idx, total, tRel, isLast }) {
  const headOpacity = easeOutCubic(progress(tRel, 0.0, 0.4));   // wordmark/counter/wedge
  const tagP = progress(tRel, 0.2, 0.6);                         // tarja pop
  const footerOpacity = easeOutCubic(progress(tRel, 0.0, 0.4));  // site

  const title = (item.title_ig || item.title_pt || "").toUpperCase();
  const usableW = W - SIDE_S * 2; // 952
  const headFS = 96;
  const maxChars = Math.max(8, Math.floor(usableW / (headFS * 0.46))); // ~21
  const lines = balancedWrapS(title, maxChars, 5);
  const totalChars = lines.reduce((a, l) => a + l.length, 0);
  const headlineP = easeOutCubic(progress(tRel, 0.8, 1.8));
  const charsToShow = Math.floor(headlineP * totalChars);
  const visibleLines = sliceWrapped(lines, charsToShow);
  const typingDone = charsToShow >= totalChars;
  const cursorBlink = !typingDone && Math.floor(tRel * 4) % 2 === 0 ? "▌" : "";

  // Layout ancorado no fundo (espelha o footerBlock do slide card02).
  const lh = Math.round(headFS * 0.96); // 92
  const siteFS = 28, siteMargin = 40, bottomPad = 110;
  const siteBaseline = H - bottomPad;
  const lastBaseline = siteBaseline - siteFS - siteMargin;
  const firstBaseline = lastBaseline - (lines.length - 1) * lh;
  const headTopY = firstBaseline - headFS * 0.78;
  const headSpans = visibleLines
    .map((l, i) => `<tspan x="${SIDE_S}" y="${firstBaseline + i * lh}">${escapeXml(l)}${i === visibleLines.length - 1 ? cursorBlink : ""}</tspan>`)
    .join("");

  // Tarja (Inter ExtraBold, cor do ciclo). pop com escala.
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const cat = (CAT_LABELS_S[tags[0]] || "Notícia").toUpperCase();
  const tagFS = 34, tagLS = 2.4, tPadX = 28, tPadT = 18, tPadB = 16;
  const tagTextW = Math.round(cat.length * tagFS * 0.60 + Math.max(0, cat.length - 1) * tagLS);
  const tagBoxW = tagTextW + tPadX * 2;
  const tagBoxH = tagFS + tPadT + tPadB;
  const tagBottomY = headTopY - 34;
  const tagTopY = tagBottomY - tagBoxH;
  const tagTextBaseline = tagTopY + tPadT + tagFS * 0.80;
  const tagScale = easeOutBack(tagP);
  const tagOpacity = clamp01(tagP * 2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    ${coverWedgeS(300, tarjaColor, headOpacity)}

    <text x="${W / 2}" y="120" text-anchor="middle"
      font-family="${F_PLAYFAIR}" font-style="italic" font-weight="900" font-size="42"
      fill="#ffffff" letter-spacing="-0.8" opacity="${headOpacity.toFixed(2)}">Só Mais um Fã de PEARL JAM</text>

    <text x="${W - SIDE_S}" y="${H - bottomPad}" text-anchor="end"
      font-family="${F_INTER_SB}" font-size="26" fill="#ffffff"
      opacity="${(footerOpacity * 0.7).toFixed(2)}" letter-spacing="2">${String(idx).padStart(2,"0")} / ${String(total).padStart(2,"0")}</text>

    <g transform="translate(${SIDE_S} ${Math.round(tagTopY)}) scale(${tagScale.toFixed(3)})" transform-origin="0 ${tagBoxH / 2}" opacity="${tagOpacity.toFixed(2)}">
      <rect x="0" y="0" width="${tagBoxW}" height="${Math.round(tagBoxH)}" fill="${tarjaColor}"/>
      <text x="${tPadX}" y="${Math.round(tPadT + tagFS * 0.80)}"
        font-family="${F_INTER_XB}" font-weight="800" font-size="${tagFS}"
        fill="#ffffff" letter-spacing="${tagLS}">${escapeXml(cat)}</text>
    </g>

    <text font-family="${F_ANTON}" font-size="${headFS}" fill="#ffffff" letter-spacing="0.5">${headSpans}</text>

    <text x="${SIDE_S}" y="${siteBaseline}"
      font-family="${F_INTER_SB}" font-size="${siteFS}" fill="#ffffff"
      opacity="${(footerOpacity * 0.85).toFixed(2)}" letter-spacing="0.5">setlists-pj-ev.pages.dev</text>
  </svg>`;
}

// OUTRO delega pro plug system (story-styles/<name>.mjs).
// Funcao definida acima (buildOutroFrame = activeStyle.outro).

// ============ frame compositor ============

// Renderiza frame onde a fonte e uma imagem base (foto do item) + overlay SVG.
// Reusa o mesmo bgBuffer pra todos os frames daquele card (perf).
async function renderCardFrame({ svg, bgBuffer, destPath }) {
  await sharp(bgBuffer)
    .composite([{ input: Buffer.from(svg), blend: "over" }])
    .png({ compressionLevel: 6 })
    .toFile(destPath);
}

async function renderFlatFrame({ svg, destPath }) {
  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 6 })
    .toFile(destPath);
}

// Prepara o BG (foto + escurece) de um card, retorna buffer pronto pra
// receber overlay SVG.
async function prepareCardBg(item) {
  let baseBuf = await fetchImageBuffer(item);
  if (!baseBuf) baseBuf = await makeFallbackBg();
  const cover = await sharp(baseBuf, { failOn: "none" })
    .resize(W, H, { fit: "cover", position: "attention" })
    .sharpen(1.1)
    .toBuffer();
  // Gradiente padrao card02 (vertical): topo leve pro wordmark ler, meio
  // limpo pra foto respirar, base forte pra manchete Anton/tarja/site.
  const grad = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#000" stop-opacity="0.32"/>
      <stop offset="22%" stop-color="#000" stop-opacity="0"/>
      <stop offset="52%" stop-color="#000" stop-opacity="0"/>
      <stop offset="74%" stop-color="#000" stop-opacity="0.55"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.96"/>
    </linearGradient></defs>
    <rect x="0" y="0" width="${W}" height="${H}" fill="url(#g)"/></svg>`);
  return await sharp(cover)
    .composite([{ input: grad, blend: "over" }])
    .png()
    .toBuffer();
}

// ============ orquestracao ============

// Resolve qual estado (intro/card/outro) corresponde a um tempo global.
function resolveSegment(tGlobal, itemsCount) {
  if (tGlobal < T_INTRO_END) {
    return { kind: "intro", tRel: tGlobal };
  }
  const afterIntro = tGlobal - T_INTRO_END;
  for (let i = 0; i < itemsCount; i++) {
    const start = i * T_CARD_DUR;
    const end = start + T_CARD_DUR;
    if (afterIntro < end) {
      return { kind: "card", index: i, tRel: afterIntro - start };
    }
  }
  const tOutro = afterIntro - itemsCount * T_CARD_DUR;
  return { kind: "outro", tRel: tOutro };
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-2000)}`));
    });
  });
}

export async function buildStoryVideo({ items, trackPath, tarjaColor, date = new Date(), outPath, tmpDir, concurrency = 8 } = {}) {
  if (!Array.isArray(items) || items.length === 0) throw new Error("buildStoryVideo: items vazio");
  if (items.length > 5) items = items.slice(0, 5);
  // SEM repetir: 1 noticia = 1 card. Timeline dinamica acompanha.
  if (!trackPath) throw new Error("buildStoryVideo: trackPath obrigatorio");

  const totalS = T_INTRO_END + items.length * T_CARD_DUR + T_OUTRO_DUR;
  const totalFrames = Math.round(totalS * FPS);

  tmpDir = tmpDir || await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-story-"));
  await fs.mkdir(tmpDir, { recursive: true });

  const badgeAnim = await loadBadgeAnimated();
  const edition = await getEditionNumber(date);
  const introState = buildIntroState({ date, itemCount: items.length, tarjaColor, badgeAnim, edition });
  console.log(`[story-video] style: ${STORY_STYLE} | edicao Nº ${introState.edition} | ${introState.dayOfWeekShort}`);

  // pre-renderiza um BG por card (5 buffers em memoria, ~10MB cada PNG -> ok)
  console.log(`[story-video] preparando ${items.length} BGs...`);
  const bgBuffers = await Promise.all(items.map(prepareCardBg));

  // gera lista de tarefas frame-a-frame (totalFrames ja calculado acima)
  console.log(`[story-video] ${items.length} card(s), ${totalS.toFixed(1)}s, renderizando ${totalFrames} frames @${FPS}fps...`);

  // helper: gera um frame pelo seu indice global
  async function renderFrame(idx) {
    const tGlobal = idx / FPS;
    const seg = resolveSegment(tGlobal, items.length);
    const destPath = path.join(tmpDir, `frame_${String(idx).padStart(5, "0")}.png`);
    if (seg.kind === "intro") {
      const svg = buildIntroFrame({ tRel: seg.tRel, state: introState });
      await renderFlatFrame({ svg, destPath });
    } else if (seg.kind === "outro") {
      const svg = buildOutroFrame({ tRel: seg.tRel, state: introState });
      await renderFlatFrame({ svg, destPath });
    } else {
      const it = items[seg.index];
      const svg = buildCardSvg({
        tarjaColor, item: it,
        idx: seg.index + 1, total: items.length,
        tRel: seg.tRel,
        isLast: seg.index === items.length - 1,
      });
      await renderCardFrame({ svg, bgBuffer: bgBuffers[seg.index], destPath });
    }
  }

  // render em batches paralelos (concurrency=8 evita sobrecarga de fd/memory)
  let next = 0;
  let lastLogged = 0;
  async function worker() {
    while (next < totalFrames) {
      const my = next++;
      await renderFrame(my);
      if (my - lastLogged >= 60) {
        lastLogged = my;
        console.log(`[story-video] frame ${my + 1}/${totalFrames} (${((my + 1) / totalFrames * 100).toFixed(0)}%)`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log(`[story-video] frames OK`);

  outPath = outPath || path.resolve(`media/news/instagram-stories/${date.toISOString().slice(0, 10)}.mp4`);
  await fs.mkdir(path.dirname(outPath), { recursive: true });

  // ffmpeg: concat PNG sequence + audio. Audio com trim, fade in/out, loudnorm.
  const args = [
    "-y",
    "-framerate", String(FPS),
    "-i", path.join(tmpDir, "frame_%05d.png"),
    "-i", trackPath,
    "-filter_complex",
    `[1:a]atrim=0:${totalS},afade=t=in:d=0.3,afade=t=out:st=${(totalS - 0.5).toFixed(2)}:d=0.5,loudnorm=I=-16:TP=-1.5:LRA=11[aout]`,
    "-map", "0:v", "-map", "[aout]",
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", String(FPS),
    "-profile:v", "main", "-level", "4.0",
    "-movflags", "+faststart",
    "-c:a", "aac", "-b:a", "128k", "-ar", "44100",
    "-shortest",
    outPath,
  ];
  console.log(`[story-video] mixando audio + encoding MP4...`);
  await runFfmpeg(args);
  return { outPath, duration: totalS, tmpDir, frames: totalFrames };
}

// CLI util pra teste local
if (process.argv[1]?.endsWith("story-video.mjs")) {
  const keepTmp = process.argv.includes("--keep-tmp");
  const { selectStoryItems } = await import("./story-select.mjs");
  const { pickTrackForDate } = await import("./story-track.mjs");
  const items = await selectStoryItems({ hours: 24, max: 5 });
  if (items.length === 0) {
    console.error("[story-video] nenhuma noticia nas ultimas 24h, abortando");
    process.exit(2);
  }
  const track = await pickTrackForDate();
  const { CYCLE_COLORS } = await import("./color-cycle.mjs");
  const tarjaColor = CYCLE_COLORS[0]; // preto, 1a cor do ciclo (preview)
  const r = await buildStoryVideo({ items, trackPath: track.path, tarjaColor });
  console.log("[story-video] OK", { outPath: r.outPath, duration: r.duration, frames: r.frames, items: items.length, track: track.name });
  if (!keepTmp) await fs.rm(r.tmpDir, { recursive: true, force: true });
}
