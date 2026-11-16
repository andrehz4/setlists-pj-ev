// Nomes digitados no gerador de setlist (campo #nome), pro Andre acompanhar no painel se não estão fazendo besteira.
// Vem junto do evento (functions/api/contador.js): `nome` é o primeiro nome que foi pro título, `bar` é o texto bruto
// que o filtro do gerador barrou. Guarda só o texto, a noite, o evento, a origem e a hora de Brasília. Nada de IP.
// Banco: o mesmo D1 (binding CONTADOR_DB), tabela nomes. O nome é entrada de usuário: quem desenha tem que escapar.
export const EVENTOS_NOME = ["sorteou", "baixou_video", "baixou_imagem", "compartilhou"];
export const MAX_NOME = 30;
export const ULTIMOS = 100;
export const SQL_TABELA_NOMES = "CREATE TABLE IF NOT EXISTS nomes (id INTEGER PRIMARY KEY AUTOINCREMENT, nome TEXT NOT NULL, "
  + "barrado INTEGER NOT NULL DEFAULT 0, noite INTEGER, evento TEXT NOT NULL, dentro_app INTEGER NOT NULL DEFAULT 0, quando TEXT NOT NULL)";

// Só texto: tira caractere de controle e invisível (inclusive os que invertem a direção da linha), junta os espaços
// e corta em 30. Qualquer coisa que não seja texto, ou que fique vazia, vira null.
export function limparNome(t) {
  if (typeof t !== "string") return null;
  const limpo = t.replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u2028-\u202e\u2060-\u206f\ufeff]/g, " ")
    .replace(/\s+/g, " ").trim();
  return [...limpo].slice(0, MAX_NOME).join("").trim() || null;
}

// Corpo do POST (texto JSON) vira a lista do que gravar: [{ nome, barrado }]. Evento sem nome devolve lista vazia.
export function nomesDoCorpo(texto, evento) {
  if (!EVENTOS_NOME.includes(evento)) return [];
  let d;
  try { d = JSON.parse(texto); } catch (e) { return []; }
  if (!d || typeof d !== "object" || Array.isArray(d)) return [];
  const nome = limparNome(d.nome), bar = limparNome(d.bar);
  return [...(nome ? [{ nome, barrado: 0 }] : []), ...(bar ? [{ nome: bar, barrado: 1 }] : [])];
}

// "2026-11-20 12:30:05" no fuso de Brasília (UTC-3 fixo).
export const quandoBrt = (agora = Date.now()) => new Date(agora - 3 * 3600e3).toISOString().slice(0, 19).replace("T", " ");

const semTabela = (e) => /no such table/i.test(e?.message || "");

export async function gravarNomes(db, ev, nomes, agora = Date.now()) {
  if (!nomes.length) return 0;
  const grava = () => db.prepare(`INSERT INTO nomes (nome, barrado, noite, evento, dentro_app, quando) VALUES ${nomes.map(() => "(?, ?, ?, ?, ?, ?)").join(", ")}`)
    .bind(...nomes.flatMap((n) => [n.nome, n.barrado, ev.noite, ev.e, ev.ig ? 1 : 0, quandoBrt(agora)])).run();
  try { await grava(); } catch (e) {
    if (!semTabela(e)) throw e;
    await db.prepare(SQL_TABELA_NOMES).run(); // banco novo: cria a tabela e tenta de novo
    await grava();
  }
  return nomes.length;
}

// Retrato pro painel: os últimos 100 (mais novo primeiro), quantos nomes diferentes passaram e quantos o filtro barrou.
export async function lerNomes(db) {
  try {
    const [l, c] = await Promise.all([
      db.prepare(`SELECT nome, barrado, noite, evento, dentro_app, quando FROM nomes ORDER BY id DESC LIMIT ${ULTIMOS}`).all(),
      db.prepare("SELECT COUNT(DISTINCT CASE WHEN barrado = 0 THEN lower(nome) END) AS distintos, COALESCE(SUM(barrado), 0) AS barrados FROM nomes").all(),
    ]);
    const t = (c.results || [])[0] || {};
    return { lista: l.results || [], distintos: t.distintos || 0, barrados: t.barrados || 0 };
  } catch (e) {
    if (semTabela(e)) return { lista: [], distintos: 0, barrados: 0 }; // tabela ainda não criada: painel abre sem a seção cheia
    throw e;
  }
}
