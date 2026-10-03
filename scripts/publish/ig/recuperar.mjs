// Recuperação do falso-erro conhecido do IG: o media_publish às vezes devolve erro (clássico code 4
// subcode 2207051, "atividade restrita / potential spam") MESMO tendo publicado. A Meta recomenda checar
// antes de retentar, senão duplica. Depois de QUALQUER erro no publish, olhamos as mídias recentes: se a
// postagem está lá (legenda batendo e criada depois da tentativa), é sucesso.
//
// POLL COM RETRY: o GET /media tem consistência eventual. Em 2026-06-09 a checagem rodou 340 ms depois
// do erro, não viu o post e o item duplicou no feed. Override: IG_RECOVER_ATTEMPTS / IG_RECOVER_DELAY_MS.
import { getIG, credenciais } from "./http.mjs";
import { publishContainer } from "./containers.mjs";
import { detalheErro } from "./erros.mjs";

const numEnv = (nome, padrao, min) => {
  const v = Number(process.env[nome]);
  return Number.isFinite(v) && v >= min ? v : padrao;
};
const RECOVER_ATTEMPTS = numEnv("IG_RECOVER_ATTEMPTS", 5, 1);
const RECOVER_DELAY_MS = numEnv("IG_RECOVER_DELAY_MS", 10000, 0);

const normalizeCaption = (s) => String(s || "").replace(/\s+/g, " ").trim();

// Mesma postagem = legendas iguais normalizadas OU prefixo comum longo (>=60 chars, já inclui o título
// do 1º item, único por edição). Cobre o IG devolver a legenda levemente alterada sem falso positivo.
export function captionsMatch(a, b) {
  const na = normalizeCaption(a);
  const nb = normalizeCaption(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  const n = Math.min(200, na.length, nb.length);
  return n >= 60 && na.slice(0, n) === nb.slice(0, n);
}

export async function getRecentMedia({ igUserId, accessToken, limit = 5 } = {}) {
  const c = { igUserId: igUserId || process.env.IG_USER_ID, accessToken: accessToken || process.env.IG_ACCESS_TOKEN };
  const body = await getIG(`/${c.igUserId}/media`, { fields: "id,caption,timestamp,media_type", limit, access_token: c.accessToken });
  return Array.isArray(body?.data) ? body.data : [];
}

// Devolve o postId recuperado ou null.
export async function recoverPublishedPost({ igUserId, accessToken, caption, sinceMs, attempts = RECOVER_ATTEMPTS, delayMs = RECOVER_DELAY_MS }) {
  const folga = 120000; // 2 min de divergência de relógio cliente/IG
  for (let i = 1; i <= attempts; i++) {
    if (i > 1) await new Promise((r) => setTimeout(r, delayMs));
    try {
      const media = await getRecentMedia({ igUserId, accessToken, limit: 5 });
      for (const m of media) {
        const created = m.timestamp ? new Date(m.timestamp).getTime() : 0;
        const recente = sinceMs ? (Number.isFinite(created) && created >= sinceMs - folga) : true;
        if (recente && captionsMatch(m.caption, caption)) return m.id;
      }
      if (i < attempts) console.warn(`[ig] verificacao pos-erro ${i}/${attempts}: post nao visivel no GET /media ainda, retry em ${delayMs}ms`);
    } catch (e) {
      console.warn(`[ig] verificacao pos-erro ${i}/${attempts} falhou: ${e.message}`);
    }
  }
  return null;
}

// Publica o container e, se der erro, confere se saiu mesmo assim. Sem legenda não dá pra conferir.
export async function publicarComRecuperacao({ igUserId, accessToken, creationId, caption, sinceMs, rotulo }) {
  const c = credenciais({ igUserId, accessToken });
  try {
    return { postId: await publishContainer({ ...c, creationId }) };
  } catch (e) {
    const recovered = caption ? await recoverPublishedPost({ ...c, caption, sinceMs }) : null;
    if (!recovered) throw e;
    console.warn(`[ig] media_publish devolveu ${detalheErro(e)} mas o ${rotulo} EXISTE (${recovered}). Tratando como sucesso (falso-erro IG).`);
    return { postId: recovered, recovered: true };
  }
}
