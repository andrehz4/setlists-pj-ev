// Agenda em BLOCOS, várias linhas por show (formato da PJ 90). Função pura, testada com legenda real:
//   OUTUBRO ☑️
//   02. SEXTA (Trio Acústico)
//   📍 SÃO PAULO-SP
//   🏠 casadamatrona
//   🕰️ INÍCIO 20h
//   10. SÁBADO
//   ☑️ EVENTO FECHADO
// Sem linha de mês, vale o mês do post (dia menor que o do post = mês seguinte).
const MESES = ["janeiro", "fevereiro", "marco", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const semAcento = (t) => String(t).normalize("NFD").replace(/[̀-ͯ]/g, "");
const iso = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const INICIO = /^\W*(\d{1,2})\s*[.\-]\s*(segunda|terca|quarta|quinta|sexta|sabado|domingo)(?:-feira)?\b\s*(.*)$/i;
const MINUSC = new Set(["de", "do", "da", "dos", "das", "e"]);

// "SÃO PAULO" -> "São Paulo"; "BRAGANÇA PTA" -> "Bragança Pta"
export const tituloCidade = (t) => t.toLowerCase().split(/\s+/).filter(Boolean)
  .map((p, i) => (i && MINUSC.has(p) ? p : p[0].toUpperCase() + p.slice(1))).join(" ");

function mesDaLinha(linha) {
  const t = semAcento(linha).toLowerCase().replace(/[^a-z ]/g, " ").trim();
  const i = MESES.findIndex((m) => t === m || t.startsWith(`${m} `) || t.endsWith(` ${m}`));
  return i >= 0 ? i + 1 : null;
}

function detalhar(show, linha) {
  const l = linha.trim();
  if (/evento fechado/i.test(l)) { show.fechado = true; return; }
  // "📍 SÃO PAULO-SP", "📍 SANTO ANDRÉ-SP (Paço Municipal)" (parênteses = nome do lugar), "📍SÃO PAULO" (sem UF)
  const cid = l.match(/^📍\s*(.+?)(?:\s*[-/]\s*([A-Z]{2}))?\s*(?:\(([^)]+)\))?\s*$/u);
  if (cid && cid[1]) {
    show.cidade = tituloCidade(cid[1]);
    if (cid[2]) show.uf = cid[2];
    if (cid[3] && !show.casaNome) show.casaNome = cid[3].trim();
    return;
  }
  const casa = l.match(/^🏠\s*([a-z0-9._]{3,30})\b/u);
  if (casa) { show.casa = casa[1]; return; }
  const hora = l.match(/^🕰️?\s*(?:in[ií]cio\s*)?(\d{1,2})\s*h\s*(\d{2})?/iu);
  if (hora && +hora[1] <= 23) show.hora = `${hora[1].padStart(2, "0")}:${hora[2] || "00"}`;
}

// Legenda -> shows (null se não tiver bloco nenhum).
export function showsEmBlocos(legenda, dataPost) {
  const post = new Date(dataPost);
  let ano = post.getUTCFullYear(), mes = null, ultimoMes = null;
  const shows = [];
  let atual = null;
  for (const linha of String(legenda).split("\n")) {
    const m = mesDaLinha(linha);
    if (m && !INICIO.test(semAcento(linha))) {
      if (ultimoMes && m < ultimoMes) ano += 1; // DEZEMBRO -> JANEIRO na mesma agenda
      mes = ultimoMes = m;
      continue;
    }
    const b = semAcento(linha).match(INICIO);
    if (b) {
      let mm = mes, aa = ano;
      if (!mm) { // sem cabeçalho: mês do post, ou o seguinte se o dia já passou
        mm = post.getUTCMonth() + 1;
        if (+b[1] < post.getUTCDate()) { mm += 1; if (mm > 12) { mm = 1; aa += 1; } }
      }
      const obs = b[3].match(/\(([^)]+)\)/);
      atual = { data: iso(aa, mm, +b[1]), casa: null, casaNome: null, cidade: null, uf: null, fechado: false,
        observacao: obs ? linha.match(/\(([^)]+)\)/)[1].trim() : null };
      shows.push(atual);
      continue;
    }
    if (atual) detalhar(atual, linha);
  }
  return shows.length ? shows : null;
}
