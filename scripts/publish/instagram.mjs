// Cliente do Instagram Graph API (fluxo "Instagram with Instagram Login",
// endpoint graph.instagram.com). Publica carrossel de ate 10 slides numa
// chamada de 3 etapas:
//   1. cria container por slide (POST /<IG_USER_ID>/media, is_carousel_item=true)
//   2. cria container do carrossel (media_type=CAROUSEL, children=ids)
//   3. publica (POST /<IG_USER_ID>/media_publish, creation_id)
//
// Env esperado:
//   IG_USER_ID, IG_ACCESS_TOKEN
//   (REPO_PUBLIC_BASE opcional, default raw.githubusercontent.com/andrehz4/setlists-pj-ev/main)

import got from "got";

// IG_API_BASE permite apontar pra um mock local (ver mock-ig/) sem mudar
// nada da logica. Sem a env, usa a Graph API real (producao intocada).
const API_BASE = process.env.IG_API_BASE || "https://graph.instagram.com/v21.0";
const REPO_PUBLIC_BASE = process.env.REPO_PUBLIC_BASE
  || "https://raw.githubusercontent.com/andrehz4/setlists-pj-ev/main";

// Codes documentados de rate-limit do Graph API (Meta).
// 4: API too many calls
// 17: User request limit reached
// 32: Page request limit reached
// 613: Calls to this api have exceeded the rate limit
// 80007: Content publishing limit (50 posts/24h da IG content publishing API)
// 80004, 80008, 80003, 80014: outras variantes do Content Publishing BUC
export const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80003, 80004, 80007, 80008, 80014]);
const RATE_LIMIT_PATTERN = /application request limit|rate limit|too many requests|quota|content publishing limit/i;

// Erro tipado pra qualquer falha que veio da IG API. Carrega o payload
// completo de error.* (code, subcode, type, fbtrace_id) pra debug.
// fbtrace_id e crucial pra abrir suporte com Meta se o problema persistir.
export class IGAPIError extends Error {
  constructor({ path, statusCode, code, subcode, type, fbtraceId, message }) {
    super(`IG API ${path}: ${message || `HTTP ${statusCode}`}`);
    this.name = "IGAPIError";
    this.path = path;
    this.statusCode = statusCode;
    this.code = code;
    this.subcode = subcode;
    this.type = type;
    this.fbtraceId = fbtraceId;
    this.apiMessage = message;
  }
  toDetailString() {
    const parts = [this.message];
    const meta = [];
    if (this.code != null) meta.push(`code=${this.code}`);
    if (this.subcode != null) meta.push(`subcode=${this.subcode}`);
    if (this.type) meta.push(`type=${this.type}`);
    if (this.fbtraceId) meta.push(`fbtrace=${this.fbtraceId}`);
    if (meta.length) parts.push(`[${meta.join(" ")}]`);
    return parts.join(" ");
  }
}

// Subclasse pra rate limit. Detectada por code conhecido OU mensagem
// que bate o pattern. Permite o worker fazer backoff inteligente em vez
// de tratar como erro generico.
export class IGRateLimitError extends IGAPIError {
  constructor(opts) {
    super(opts);
    this.name = "IGRateLimitError";
    this.isRateLimit = true;
  }
}

function classifyIGError({ path, statusCode, body }) {
  const err = body?.error || {};
  const opts = {
    path,
    statusCode,
    code: err.code,
    subcode: err.error_subcode,
    type: err.type,
    fbtraceId: err.fbtrace_id,
    message: err.message || `HTTP ${statusCode}`,
  };
  const isRL = (err.code != null && RATE_LIMIT_CODES.has(err.code))
    || (typeof err.message === "string" && RATE_LIMIT_PATTERN.test(err.message));
  return isRL ? new IGRateLimitError(opts) : new IGAPIError(opts);
}

const HASHTAGS_FIXED = ["pearljam", "eddievedder", "pjbrasil", "grunge", "smufdpj"];
const IG_CAPTION_MAX = 2200;
const SITE_URL = "setlists-pj-ev.pages.dev";

// Trunca body preservando o ultimo paragrafo/frase completa antes do
// limite. Evita cortar palavra no meio.
function truncateBody(body, maxChars) {
  if (!body) return "";
  if (body.length <= maxChars) return body;
  const slice = body.slice(0, maxChars);
  const lastBreak = Math.max(
    slice.lastIndexOf("\n\n"),
    slice.lastIndexOf(". "),
    slice.lastIndexOf("? "),
    slice.lastIndexOf("! "),
  );
  if (lastBreak > maxChars * 0.55) {
    return slice.slice(0, lastBreak + 1).trim() + "…";
  }
  return slice.trim() + "…";
}

function slideUrlFor(itemId, suffix = "") {
  return `${REPO_PUBLIC_BASE}/media/news/instagram-slides/${encodeURIComponent(itemId)}${suffix}.jpg`;
}

// Normaliza caption pra comparacao (colapsa espacos/quebras). Usado na
// recuperacao pos-erro do publish (recoverPublishedPost).
function normalizeCaption(s) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

// Duas captions sao "a mesma postagem" se forem iguais normalizadas OU se
// compartilham um prefixo longo (>=60 chars). O prefixo cobre o caso de o IG
// devolver a caption levemente truncada/alterada, sem dar falso positivo (60
// chars ja incluem o titulo do 1o item, que e unico por edicao; o cabecalho
// "DESTAQUES DA EDICAO" sozinho nao bastaria).
function captionsMatch(a, b) {
  const na = normalizeCaption(a);
  const nb = normalizeCaption(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const n = Math.min(200, na.length, nb.length);
  return n >= 60 && na.slice(0, n) === nb.slice(0, n);
}

function dedupeTags(list) {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const norm = String(t || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    out.push(norm);
  }
  return out;
}

function buildSingleCaption(item) {
  // CTA pro nosso site + hashtags vao no rodape; tudo o que sobrar de
  // espaco no IG_CAPTION_MAX (2200) vai pro corpo title+intro+body.
  // Fonte original NAO entra na caption: ela aparece dentro do site
  // quando o leitor clica no link.
  const hashtags = dedupeTags([...HASHTAGS_FIXED, ...(item.tags || [])])
    .map((t) => `#${t}`).join(" ");
  const cta = `leia completo em ${SITE_URL}`;
  const tail = `\n\n${cta}\n\n${hashtags}`;
  const budget = IG_CAPTION_MAX - tail.length - 8;

  let head = item.title_pt || "";
  if (item.intro_pt) head += `\n\n${item.intro_pt}`;

  let caption = head;
  if (item.body_pt) {
    const bodyBudget = budget - head.length - 2;
    if (bodyBudget > 120) {
      const body = truncateBody(item.body_pt, bodyBudget);
      if (body) caption += `\n\n${body}`;
    }
  }
  caption += tail;
  return caption;
}

function buildCarouselCaption(items) {
  if (items.length === 1) return buildSingleCaption(items[0]);

  // Carrossel: indice numerado + intro curta de cada item + CTA + hashtags.
  // Body completo nao cabe pra varios items, mas intro de cada da contexto
  // pro leitor decidir abrir o site.
  const hashtags = dedupeTags([
    ...HASHTAGS_FIXED,
    ...items.flatMap((it) => Array.isArray(it.tags) ? it.tags : []),
  ]).map((t) => `#${t}`).join(" ");
  const cta = `leia completo em ${SITE_URL}`;
  const tail = `\n\n${cta}\n\n${hashtags}`;
  const budget = IG_CAPTION_MAX - tail.length - 30;

  const header = `DESTAQUES DA EDIÇÃO\n\n`;
  let body = "";
  const perItemBudget = Math.floor((budget - header.length) / items.length);

  items.forEach((it, i) => {
    const title = it.title_pt || "";
    let intro = it.intro_pt || "";
    const entryHead = `${i + 1}. ${title}\n`;
    const remaining = perItemBudget - entryHead.length - 2;
    if (intro.length > remaining && remaining > 40) {
      intro = truncateBody(intro, remaining);
    } else if (remaining <= 40) {
      intro = "";
    }
    body += entryHead + (intro ? `${intro}\n\n` : "\n");
  });

  let caption = header + body.trim() + tail;
  if (caption.length > IG_CAPTION_MAX) {
    caption = caption.slice(0, IG_CAPTION_MAX - 3) + "...";
  }
  return caption;
}

// Le os headers de rate limit que a Meta manda em TODA resposta (apos chamadas
// suficientes). x-app-usage = limite da app (code 4); x-business-use-case-usage
// = limite BUC do Instagram (4800 x impressoes/24h, code 80002). call_count e
// um % de 0-100 do limite. Logar isso mostra o numero REAL da conta em vez de
// chutar. O ultimo valor visto fica em _ig-usage.json pro pipeline/telegram
// alertar quando estiver perto de 100%.
function logUsageHeaders(headers, path) {
  if (!headers) return null;
  let out = null;
  try {
    const app = headers["x-app-usage"];
    if (app) {
      const u = typeof app === "string" ? JSON.parse(app) : app;
      // se o parse nao trouxe os numeros (header vazio {} ou formato diferente),
      // loga o valor CRU pra a gente ver exatamente o que a Meta mandou.
      if (u && u.call_count != null) {
        console.log(`[ig-usage] x-app-usage em ${path}: call_count=${u.call_count}% total_time=${u.total_time}% cputime=${u.total_cputime}%`);
      } else {
        console.log(`[ig-usage] x-app-usage em ${path} (cru, parse vazio): ${typeof app === "string" ? app : JSON.stringify(app)}`);
      }
      out = { ...(out || {}), app: u };
    }
    const buc = headers["x-business-use-case-usage"];
    if (buc) {
      // o limite que pode estar batendo no Instagram e o BUC (code 80002).
      // loga o objeto inteiro pra ver os business-ids e o call_count de cada tipo.
      console.log(`[ig-usage] x-business-use-case-usage em ${path} (cru): ${typeof buc === "string" ? buc : JSON.stringify(buc)}`);
      const b = typeof buc === "string" ? JSON.parse(buc) : buc;
      for (const arr of Object.values(b)) {
        const ig = Array.isArray(arr) ? arr.find((x) => x.type === "instagram") : null;
        if (ig) {
          console.log(`[ig-usage] >> instagram BUC: call_count=${ig.call_count}% regain=${ig.estimated_time_to_regain_access ?? "?"}min`);
          out = { ...(out || {}), instagram: ig };
        }
      }
    }
    // se nenhum dos dois headers veio, lista quais headers x-* a Meta mandou
    // (pode estar usando outro nome). So loga a 1a vez por run pra nao poluir.
    if (!app && !buc && !logUsageHeaders._warned) {
      const xHeaders = Object.keys(headers).filter((k) => /usage|rate|limit|throttle/i.test(k));
      console.log(`[ig-usage] sem x-app-usage/x-business-use-case-usage. Headers relacionados: ${xHeaders.length ? xHeaders.join(", ") : "nenhum"}`);
      logUsageHeaders._warned = true;
    }
  } catch (e) {
    console.warn(`[ig-usage] falha ao ler headers: ${e.message}`);
  }
  return out;
}

async function postIG(path, body) {
  const url = `${API_BASE}${path}`;
  const res = await got.post(url, {
    form: body,
    timeout: { request: 30000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  logUsageHeaders(res.headers, path);
  if (res.statusCode >= 400) {
    throw classifyIGError({ path, statusCode: res.statusCode, body: res.body });
  }
  return res.body;
}

export async function createSlideContainer({ igUserId, accessToken, imageUrl }) {
  const r = await postIG(`/${igUserId}/media`, {
    media_type: "IMAGE",
    image_url: imageUrl,
    is_carousel_item: "true",
    access_token: accessToken,
  });
  if (!r.id) throw new IGAPIError({ path: `/${igUserId}/media`, message: "createSlideContainer: sem id na resposta da IG" });
  return r.id;
}

export async function createCarouselContainer({ igUserId, accessToken, childrenIds, caption }) {
  const r = await postIG(`/${igUserId}/media`, {
    media_type: "CAROUSEL",
    children: childrenIds.join(","),
    caption,
    access_token: accessToken,
  });
  if (!r.id) throw new IGAPIError({ path: `/${igUserId}/media`, message: "createCarouselContainer: sem id na resposta da IG" });
  return r.id;
}

export async function createSingleImageContainer({ igUserId, accessToken, imageUrl, caption }) {
  const r = await postIG(`/${igUserId}/media`, {
    media_type: "IMAGE",
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });
  if (!r.id) throw new IGAPIError({ path: `/${igUserId}/media`, message: "createSingleImageContainer: sem id na resposta da IG" });
  return r.id;
}

export async function publishContainer({ igUserId, accessToken, creationId }) {
  const r = await postIG(`/${igUserId}/media_publish`, {
    creation_id: creationId,
    access_token: accessToken,
  });
  if (!r.id) throw new IGAPIError({ path: `/${igUserId}/media_publish`, message: "publishContainer: sem id na resposta da IG" });
  return r.id;
}

// Lista as midias recentes da conta (GET /<uid>/media). Usado pra confirmar,
// apos um erro no media_publish, se a postagem saiu mesmo assim.
export async function getRecentMedia({ igUserId, accessToken, limit = 5 } = {}) {
  if (!igUserId) igUserId = process.env.IG_USER_ID;
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  const res = await got.get(`${API_BASE}/${igUserId}/media`, {
    searchParams: { fields: "id,caption,timestamp,media_type", limit, access_token: accessToken },
    timeout: { request: 15000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  logUsageHeaders(res.headers, `/${igUserId}/media`);
  if (res.statusCode >= 400) {
    throw classifyIGError({ path: `/${igUserId}/media`, statusCode: res.statusCode, body: res.body });
  }
  return Array.isArray(res.body?.data) ? res.body.data : [];
}

// Falso-erro conhecido do IG: o media_publish as vezes devolve erro (classico
// code 4 subcode 2207051, "atividade restringida / potential spam") MESMO
// tendo publicado o post (comportamento documentado pela Meta: a recomendacao
// e checar se publicou antes de retentar, senao duplica). Apos QUALQUER erro
// no publish, olhamos as midias recentes: se a postagem que tentamos ja esta
// la (caption batendo + criada depois que comecamos a tentativa), devolvemos o
// id real e tratamos como sucesso, em vez de propagar o erro e re-postar na
// proxima janela. Retorna o postId recuperado ou null.
async function recoverPublishedPost({ igUserId, accessToken, caption, sinceMs }) {
  try {
    const media = await getRecentMedia({ igUserId, accessToken, limit: 5 });
    const buffer = 120000; // 2min de folga pra divergencia de relogio cliente/IG
    for (const m of media) {
      const created = m.timestamp ? new Date(m.timestamp).getTime() : 0;
      const recent = sinceMs ? (Number.isFinite(created) && created >= sinceMs - buffer) : true;
      if (!recent) continue;
      if (captionsMatch(m.caption, caption)) return m.id;
    }
  } catch (e) {
    console.warn(`[ig] verificacao pos-erro falhou (nao da pra confirmar publicacao): ${e.message}`);
  }
  return null;
}

// Helper completo: dado um array de items (cada um com .id), pega URLs
// dos slides (que assumimos ja terem sido pushados pro repo) e publica
// como carrossel (ou single image se for 1 item).
// coverImageUrl: opcional. Quando presente E for carrossel (>=2 items),
// vira o PRIMEIRO slide (capa Card 11). Solo (1 item) ignora a capa.
export async function publishItems(items, { igUserId, accessToken, coverImageUrl, slideSuffix = "" } = {}) {
  if (!items || items.length === 0) throw new Error("publishItems: items vazio");
  if (!igUserId) igUserId = process.env.IG_USER_ID;
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error("publishItems: IG_USER_ID e IG_ACCESS_TOKEN obrigatorios");
  }

  // Marca quando a tentativa comecou, pra recoverPublishedPost so considerar
  // postagens criadas DEPOIS disso (nunca uma edicao antiga identica).
  const attemptStartMs = Date.now();

  if (items.length === 1) {
    const it = items[0];
    const caption = buildSingleCaption(it);
    const containerId = await createSingleImageContainer({
      igUserId, accessToken,
      imageUrl: slideUrlFor(it.id, slideSuffix),
      caption,
    });
    // pequena pausa pra IG processar a imagem antes do publish
    await new Promise((r) => setTimeout(r, 4000));
    try {
      const postId = await publishContainer({ igUserId, accessToken, creationId: containerId });
      return { postId, count: 1, captionLen: caption.length };
    } catch (e) {
      const recovered = await recoverPublishedPost({ igUserId, accessToken, caption, sinceMs: attemptStartMs });
      if (recovered) {
        console.warn(`[ig] media_publish devolveu ${e.toDetailString ? e.toDetailString() : e.message} mas o post EXISTE (${recovered}). Tratando como sucesso (falso-erro IG).`);
        return { postId: recovered, count: 1, captionLen: caption.length, recovered: true };
      }
      throw e;
    }
  }

  const totalSlides = items.length + (coverImageUrl ? 1 : 0);
  if (totalSlides > 10) {
    throw new Error(`publishItems: carrossel suporta max 10 slides, recebido ${totalSlides} (${items.length} items + ${coverImageUrl ? "capa" : "sem capa"})`);
  }

  const childrenIds = [];
  // Capa (Card 11) entra como primeiro slide do carrossel.
  if (coverImageUrl) {
    const coverId = await createSlideContainer({
      igUserId, accessToken,
      imageUrl: coverImageUrl,
    });
    childrenIds.push(coverId);
    await new Promise((r) => setTimeout(r, 500));
  }
  for (const it of items) {
    const id = await createSlideContainer({
      igUserId, accessToken,
      imageUrl: slideUrlFor(it.id, slideSuffix),
    });
    childrenIds.push(id);
    await new Promise((r) => setTimeout(r, 500));
  }
  const caption = buildCarouselCaption(items);
  const carouselId = await createCarouselContainer({
    igUserId, accessToken, childrenIds, caption,
  });
  await new Promise((r) => setTimeout(r, 6000));
  try {
    const postId = await publishContainer({ igUserId, accessToken, creationId: carouselId });
    return { postId, count: items.length, captionLen: caption.length };
  } catch (e) {
    const recovered = await recoverPublishedPost({ igUserId, accessToken, caption, sinceMs: attemptStartMs });
    if (recovered) {
      console.warn(`[ig] media_publish devolveu ${e.toDetailString ? e.toDetailString() : e.message} mas o carrossel EXISTE (${recovered}). Tratando como sucesso (falso-erro IG).`);
      return { postId: recovered, count: items.length, captionLen: caption.length, recovered: true };
    }
    throw e;
  }
}

// ============================================================
// Story (media_type=STORIES) - video vertical 1080x1920, max 60s.
// Diferente de imagem: video precisa de processamento server-side
// antes do publish, entao polleia status_code do container ate
// FINISHED. Sem caption (story nao suporta caption via API; usuario
// pode adicionar link sticker depois, manualmente, no app).
// ============================================================

export async function createStoryContainer({ igUserId, accessToken, videoUrl }) {
  const r = await postIG(`/${igUserId}/media`, {
    media_type: "STORIES",
    video_url: videoUrl,
    access_token: accessToken,
  });
  if (!r.id) throw new Error("createStoryContainer: sem id na resposta");
  return r.id;
}

async function getContainerStatus({ accessToken, containerId }) {
  const res = await got.get(`${API_BASE}/${containerId}`, {
    searchParams: { fields: "status_code,status", access_token: accessToken },
    timeout: { request: 15000 },
    retry: { limit: 1 },
    throwHttpErrors: false,
    responseType: "json",
  });
  logUsageHeaders(res.headers, `/${containerId}`);
  if (res.statusCode >= 400) {
    throw classifyIGError({ path: `/${containerId}`, statusCode: res.statusCode, body: res.body });
  }
  return res.body || {};
}

async function waitContainerReady({ accessToken, containerId, timeoutMs = 180000, intervalMs = 5000 }) {
  const start = Date.now();
  let last = {};
  while (Date.now() - start < timeoutMs) {
    try {
      last = await getContainerStatus({ accessToken, containerId });
      const sc = last.status_code;
      if (sc === "FINISHED") return last;
      if (sc === "ERROR" || sc === "EXPIRED") {
        throw new Error(`container ${containerId} status_code=${sc}: ${last.status || ""}`);
      }
    } catch (e) {
      // erro transitorio: loga e segue tentando
      console.warn(`[story] poll status falhou (segue): ${e.message}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`container ${containerId} nao ficou pronto em ${timeoutMs}ms (ultimo status: ${last.status_code || "?"})`);
}

// Helper completo: dado um videoUrl publicamente acessivel (raw.githubusercontent
// ou similar), cria container STORIES, aguarda processar e publica.
// Retorna { postId, containerId }.
export async function publishStory({ videoUrl, igUserId, accessToken } = {}) {
  if (!igUserId) igUserId = process.env.IG_USER_ID;
  if (!accessToken) accessToken = process.env.IG_ACCESS_TOKEN;
  if (!igUserId || !accessToken) {
    throw new Error("publishStory: IG_USER_ID e IG_ACCESS_TOKEN obrigatorios");
  }
  if (!videoUrl) throw new Error("publishStory: videoUrl obrigatorio");

  const containerId = await createStoryContainer({ igUserId, accessToken, videoUrl });
  await waitContainerReady({ accessToken, containerId });
  const postId = await publishContainer({ igUserId, accessToken, creationId: containerId });
  return { postId, containerId };
}

export { buildSingleCaption, buildCarouselCaption, slideUrlFor, logUsageHeaders };
