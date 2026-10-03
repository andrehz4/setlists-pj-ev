// Erros tipados da Graph API do Instagram. Carregam code, subcode, type e fbtrace_id (o fbtrace é o
// que a Meta pede pra abrir suporte).

// Codes documentados de rate limit:
//   4 too many calls (app) · 17 user · 32 page · 613 rate limit da chamada
//   80007 content publishing (50 posts/24h) · 80003, 80004, 80008, 80014 variantes do BUC
export const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80003, 80004, 80007, 80008, 80014]);
const RATE_LIMIT_PATTERN = /application request limit|rate limit|too many requests|quota|content publishing limit/i;

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
    const meta = [];
    if (this.code != null) meta.push(`code=${this.code}`);
    if (this.subcode != null) meta.push(`subcode=${this.subcode}`);
    if (this.type) meta.push(`type=${this.type}`);
    if (this.fbtraceId) meta.push(`fbtrace=${this.fbtraceId}`);
    return meta.length ? `${this.message} [${meta.join(" ")}]` : this.message;
  }
}

// Rate limit (code conhecido OU mensagem que bate o padrão): o publish faz backoff em vez de erro genérico.
export class IGRateLimitError extends IGAPIError {
  constructor(opts) {
    super(opts);
    this.name = "IGRateLimitError";
    this.isRateLimit = true;
  }
}

export function classifyIGError({ path, statusCode, body }) {
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

export const detalheErro = (e) => (e?.toDetailString ? e.toDetailString() : e?.message);
