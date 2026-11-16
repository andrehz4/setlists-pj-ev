// Contador do gerador de setlist do Ibirapuera: regras puras (validar o evento, montar as chaves, somar e ler).
// Sem dado pessoal: só o nome do evento, a noite marcada (20 ou 22) e se veio do navegador do Instagram.
// Banco: D1 (binding CONTADOR_DB), tabela contador(chave, n). A soma é um upsert atômico (n = n + 1), então
// duas visitas ao mesmo tempo nunca se perdem. O total é a soma dos dias (não tem linha própria).
//   d:<AAAA-MM-DD>:<evento>        por dia (BRT), também com .ig/.fora e .n20/.n22
//   h:<AAAA-MM-DD>T<HH>:<evento>   por hora (BRT), só o evento puro
export const EVENTOS = ["visita", "sorteou", "montou", "pediu_video", "baixou_video", "baixou_imagem", "saiu_app", "abriu_fora", "compartilhou"];
export const MAX_CORPO = 200;
export const HORAS = 48;
export const SQL_TABELA = "CREATE TABLE IF NOT EXISTS contador (chave TEXT PRIMARY KEY, n INTEGER NOT NULL DEFAULT 0) WITHOUT ROWID";

const ORIGENS = ["https://somaisumfadepearljam.com.br", "https://www.somaisumfadepearljam.com.br"];
const ROBO = /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|curl|wget|python|node/i;

// Corpo do POST (texto JSON) vira { e, noite, ig } ou null. Só passa evento da lista; o resto do corpo é ignorado.
export function validar(texto) {
  if (typeof texto !== "string" || !texto || texto.length > MAX_CORPO) return null;
  let d;
  try { d = JSON.parse(texto); } catch (e) { return null; }
  if (!d || typeof d !== "object" || Array.isArray(d) || !EVENTOS.includes(d.e)) return null;
  return { e: d.e, noite: d.n === 20 || d.n === 22 ? d.n : null, ig: d.ig === 1 || d.ig === true };
}

// Só conta pedido que saiu do próprio site e não é robô. Sem Origin (navegador antigo), vale o Referer.
export function pedidoValido(request) {
  if (ROBO.test(request.headers.get("User-Agent") || "") || !request.headers.get("User-Agent")) return false;
  const origem = request.headers.get("Origin") || "";
  if (origem) return ORIGENS.includes(origem);
  const ref = request.headers.get("Referer") || "";
  return ORIGENS.some((o) => ref.startsWith(o + "/"));
}

// Dia e hora no fuso de Brasília (UTC-3 fixo, sem horário de verão).
export function brt(agora = Date.now()) {
  const iso = new Date(agora - 3 * 3600e3).toISOString();
  return { dia: iso.slice(0, 10), hora: iso.slice(0, 13) };
}

export function chaves(ev, agora = Date.now()) {
  const { dia, hora } = brt(agora);
  const nomes = [ev.e, `${ev.e}.${ev.ig ? "ig" : "fora"}`];
  if (ev.noite) nomes.push(`${ev.e}.n${ev.noite}`);
  return [...nomes.map((n) => `d:${dia}:${n}`), `h:${hora}:${ev.e}`];
}

export async function somar(db, ev, agora = Date.now()) {
  const ks = chaves(ev, agora);
  await db.prepare(`INSERT INTO contador (chave, n) VALUES ${ks.map(() => "(?, 1)").join(", ")} ON CONFLICT(chave) DO UPDATE SET n = n + 1`)
    .bind(...ks).run();
  return ks;
}

// Linhas do banco viram o retrato do painel: { agora, hoje, dias: { dia: { evento: n } }, horas: [{ h, evento: n }] }.
export function retrato(linhasDia, linhasHora, agora = Date.now()) {
  const dias = {};
  for (const { chave, n } of linhasDia) {
    const [, dia, nome] = chave.split(":");
    (dias[dia] ||= {})[nome] = n;
  }
  const porHora = {};
  for (const { chave, n } of linhasHora) {
    const [, hora, nome] = chave.split(":");
    (porHora[hora] ||= {})[nome] = n;
  }
  const horas = [];
  for (let i = HORAS - 1; i >= 0; i--) {
    const h = brt(agora - i * 3600e3).hora;
    horas.push({ h, ...(porHora[h] || {}) });
  }
  return { agora: new Date(agora).toISOString(), hoje: brt(agora).dia, dias, horas };
}

export async function ler(db, agora = Date.now()) {
  const desde = `h:${brt(agora - (HORAS - 1) * 3600e3).hora}`;
  const [d, h] = await Promise.all([
    db.prepare("SELECT chave, n FROM contador WHERE chave >= 'd:' AND chave < 'd;'").all(),
    db.prepare("SELECT chave, n FROM contador WHERE chave >= ? AND chave < 'h;'").bind(desde).all(),
  ]);
  return retrato(d.results || [], h.results || [], agora);
}

// Compara a chave do painel sem vazar tempo. Chave curta demais (ou ausente) deixa o painel fechado.
export function chaveConfere(dada, certa) {
  if (typeof certa !== "string" || certa.length < 16 || typeof dada !== "string" || dada.length !== certa.length) return false;
  let dif = 0;
  for (let i = 0; i < certa.length; i++) dif |= dada.charCodeAt(i) ^ certa.charCodeAt(i);
  return dif === 0;
}
