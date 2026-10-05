// Lê shows das legendas das bandas cover. Funções puras (sem rede), testadas com legendas reais.
//   Post de agenda do mês, uma linha por show:
//     Blaymorphed:  "Sex 09 - barrockclub_ - São Bernardo - SP"  (dia, casa, cidade, UF)
//     Black Circle: "📍 10/10 // Rio de Janeiro/RJ"               (dia/mês, cidade/UF; casa vem no post do dia)
//     PJ Ribeirão:  "08/10 • Araxá/MG — oktobeeraraxa"           (dia/mês, cidade/UF, casa)
//   Post do dia: "HOJE 10/09 ... stones_bar" -> completa a casa e o horário de um show já conhecido.
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "");
const DIA_SEMANA = /^(seg|ter|qua|qui|sex|sab|dom)[a-z-]*\.?$/i;

// "Agenda de OUTUBRO" / "OUTUBRO COMEÇOU" -> 10 (ou null)
export function mesDoCabecalho(legenda) {
  const t = semAcento(legenda).toLowerCase();
  const i = MESES.findIndex((m) => new RegExp(`(agenda de ${m}|${m} comecou|agenda ${m})`).test(t));
  return i >= 0 ? i + 1 : null;
}

// Ano do show: mês da agenda antes do mês do post = ano seguinte (agenda de janeiro postada em dezembro).
const anoDe = (mes, dataPost) => {
  const d = new Date(dataPost);
  return mes < d.getUTCMonth() + 1 - 1 ? d.getUTCFullYear() + 1 : d.getUTCFullYear();
};
const iso = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const ehHandle = (t) => /^[a-z0-9._]{3,30}$/.test(t) && /[._]|^[a-z0-9]+$/.test(t) && !/^\d+$/.test(t);

// Separa o resto da linha em casa / cidade / UF.
function local(partes) {
  const out = { casa: null, casaNome: null, cidade: null, uf: null, fechado: false };
  const soltos = [];
  for (const p0 of partes) {
    const p = p0.trim().replace(/[.!]+$/, "");
    if (!p) continue;
    if (/evento fechado/i.test(p)) { out.fechado = true; continue; }
    const cuf = p.match(/^(.+?)\s*[/-]\s*([A-Z]{2})$/);
    if (cuf) { out.cidade = cuf[1].trim(); out.uf = cuf[2]; continue; }
    if (/^[A-Z]{2}$/.test(p)) { out.uf = p; continue; }
    if (!out.casa && ehHandle(p)) { out.casa = p; continue; }
    soltos.push(p);
  }
  // texto solto: com cidade/UF já achada é o nome da casa ("Teatro Ademir Rosa"); sem ela, é a cidade
  if (out.uf && out.cidade) out.casaNome = soltos[0] || null;
  else if (soltos.length) [out.cidade, out.casaNome] = [soltos.at(-1), soltos.length > 1 ? soltos[0] : null];
  return out;
}

// Uma linha de agenda -> lista de shows (pode ter 2 dias: "Sex 16 e Sáb 17").
export function linhaParaShows(linha, mes, ano) {
  // "—", "–" e "•" separam campos ("08/10 • Araxá/MG — oktobeeraraxa"): viram " - " antes da limpeza
  const limpa = linha.replace(/\s*[—–•]\s*/g, " - ").replace(/[^\p{L}\p{N}\s/.,:_()=-]/gu, " ").replace(/\s+/g, " ").trim();
  const m = limpa.match(/^((?:(?:[A-Za-zÀ-ú]+\.?\s+)?\d{1,2}(?:\/\d{1,2}(?:\/\d{2,4})?)?\s*(?:e\s+)?)+)(.*)$/);
  if (!m) return [];
  const palavras = m[1].replace(/\d.*$/, "").trim().split(/\s+/).filter(Boolean);
  if (palavras.some((p) => !DIA_SEMANA.test(semAcento(p)))) return []; // começa com outra palavra: não é show
  const dias = [...m[1].matchAll(/(\d{1,2})(?:\/(\d{1,2})(?:\/(\d{2,4}))?)?/g)]
    .map((x) => ({ d: +x[1], m: x[2] ? +x[2] : mes, a: x[3] ? (x[3].length === 2 ? 2000 + +x[3] : +x[3]) : null }));
  const obs = m[2].match(/^\s*\(([^)]*)\)/); // "(SV Solo)"
  const resto = m[2].slice(obs ? obs[0].length : 0).replace(/^\s*(?:-|=|\/\/)\s*/, "");
  let partes = resto.split(/\s*(?:\s-\s|\s-|-\s|=|\/\/)\s*/).filter((x) => x.trim());
  const primeiro = partes[0]?.trim().split(/\s+/) || [];
  if (primeiro.length > 1 && ehHandle(primeiro[0])) partes = [primeiro[0], primeiro.slice(1).join(" "), ...partes.slice(1)];
  const l = local(partes);
  return dias.filter((x) => x.m && x.d >= 1 && x.d <= 31).map((x) => ({
    data: iso(x.a ?? ano ?? new Date().getUTCFullYear(), x.m, x.d), ...l, observacao: obs ? obs[1].trim() : null,
  }));
}

// Post de agenda do mês -> shows. null se não for post de agenda.
export function showsDoPostDeAgenda(legenda, dataPost) {
  const mes = mesDoCabecalho(legenda);
  const linhas = legenda.split("\n");
  const comData = linhas.filter((l) => /\d{1,2}\/\d{1,2}/.test(l) || /^\W*[A-Za-zÀ-ú]{3,}\.?\s+\d{1,2}\b/.test(l.trim()));
  if (!mes && comData.length < 2) return null;
  const shows = linhas.flatMap((l) => {
    const mm = l.match(/\d{1,2}\/(\d{1,2})/);
    const m = mm ? +mm[1] : mes;
    return m ? linhaParaShows(l.replace(/^\W+/, ""), m, anoDe(m, dataPost)) : [];
  });
  return shows.length >= 2 ? shows : null;
}

// Post do dia: data (dd/mm), casa (handle na legenda) e horário, pra completar um show já conhecido.
export function detalhesDoPostDoDia(legenda, dataPost, handlesIgnorar = []) {
  const dm = legenda.match(/\b(\d{1,2})\/(\d{1,2})(?:\/\d{2,4})?\b/);
  if (!dm) return null;
  const mes = +dm[2];
  const data = iso(anoDe(mes, dataPost), mes, +dm[1]);
  const casa = casaNaLegenda(legenda, handlesIgnorar);
  return { data, casa, hora: horaNaLegenda(legenda) };
}

// A API devolve a legenda SEM o @ das menções: a casa aparece como palavra minúscula colada ("rocknbeerpub").
// Procura nas posições típicas de menção e ignora créditos de foto/vídeo e hashtags.
const NAO_CASA = new Set(["quinta", "sexta", "sabado", "domingo", "segunda", "terca", "quarta", "hoje", "amanha", "palco",
  "querido", "querida", "incrivel", "nosso", "nossa", "show", "shows", "ingressos", "pearl", "tributo",
  "cidade", "noite", "festa", "galera", "regiao", "shopping", "evento", "estreia", "abertura"]);
export function casaNaLegenda(legenda, ignorar = []) {
  const fora = new Set(ignorar.map((h) => h.toLowerCase()));
  const ok = (t) => t && t.length >= 5 && !fora.has(t) && !NAO_CASA.has(semAcento(t)) && !/\.(jpg|png|com|br)$/.test(t);
  const linhas = legenda.split("\n").filter((l) => !/^\s*(📸|🎥|📷|foto|fotos|video|vídeo)/i.test(l)).map((l) => l.replace(/#[\w.]+/g, " "));
  const texto = linhas.join("\n");
  const fortes = texto.match(/(?<![\w@])[a-z][a-z0-9]*[._][a-z0-9._]*[a-z0-9]|(?<![\w@])[a-z]+\d{2,}\b/g) || [];
  const forte = fortes.find(ok);
  if (forte) return forte;
  const posicao = /(?:📍\s*|\b(?:no|na|lá no|la no|palco do|palco da)\s+)([a-z][a-z0-9]{4,29})\b/g;
  for (const m of texto.matchAll(posicao)) if (ok(m[1])) return m[1];
  return null;
}

// Horário do show: "Showtime: 23:30", "22h showtime", ou linha com 🕙/📅 ("📅 02/11, feriado - 20h").
// Não pega "Entrada VIP até as 22h" nem "Abertura da casa: 19h".
export function horaNaLegenda(legenda) {
  const fmt = (h, m) => `${String(h).padStart(2, "0")}:${m || "00"}`;
  const a = legenda.match(/(?:showtime|show às|show as)\s*:?\s*(\d{1,2})(?::|h)(\d{2})?/i) || legenda.match(/\b(\d{1,2})h(\d{2})?\s*showtime/i);
  if (a) return fmt(a[1], a[2]);
  const linha = legenda.split("\n").find((l) => /🕙|🕘|🕚|📅/.test(l) && !/vip|abertura|entrada/i.test(l));
  const b = linha && linha.match(/\b(\d{1,2})(?:h|:)(\d{2})?\b(?!\/)/);
  return b && +b[1] <= 23 ? fmt(b[1], b[2]) : null;
}
