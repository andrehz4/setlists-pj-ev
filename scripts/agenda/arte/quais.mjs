// Quais posts têm agenda na arte (o curador lê a imagem, ver fila.mjs) e como a leitura dele vira shows no
// formato do montar.mjs. Funções puras, testadas.
const iso = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Post com cara de agenda, com imagem, dos últimos 21 dias (post antigo não traz show futuro).
// A legenda pode até ter datas: a arte só completa o que faltar nela (montar.mjs).
export function precisaArte(post, hoje) {
  if (!post.imagens?.length) return false;
  if (hoje && (Date.parse(hoje) - Date.parse(post.data)) / 864e5 > 21) return false;
  return /\bagenda\b|pr[óo]xim[oa]s (shows|datas)/i.test(String(post.legenda || ""));
}

const hora = (h) => {
  const m = String(h || "").match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  return m && +m[1] <= 23 ? `${m[1].padStart(2, "0")}:${m[2] || "00"}` : null;
};
const handle = (c) => {
  const t = String(c || "").trim().replace(/^@/, "");
  return /^[a-z0-9._]{3,30}$/.test(t) ? t : null;
};

// Leitura do curador ({shows:[{dia, mes, hora, casa, cidade, uf, observacao}]}) -> shows. Ano: mês da agenda
// antes do mês do post = ano seguinte (mesma regra das legendas).
export function showsDaArte(resposta, dataPost) {
  const post = new Date(dataPost);
  return (resposta?.shows || []).filter((s) => s.dia >= 1 && s.dia <= 31 && s.mes >= 1 && s.mes <= 12).map((s) => {
    const ano = s.mes < post.getUTCMonth() ? post.getUTCFullYear() + 1 : post.getUTCFullYear();
    const casa = handle(s.casa);
    return {
      data: iso(ano, s.mes, s.dia), casa, casaNome: casa ? null : (s.casa || "").trim() || null,
      cidade: (s.cidade || "").trim() || null, uf: /^[A-Z]{2}$/.test(s.uf || "") ? s.uf : null,
      fechado: /fechado/i.test(s.observacao || ""), observacao: (s.observacao || "").trim() || null, hora: hora(s.hora),
    };
  });
}
