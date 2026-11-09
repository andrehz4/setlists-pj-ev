// Quais posts têm a agenda SÓ na arte (a legenda diz "se liga nesta agenda" mas não traz as datas), e como a
// resposta do leitor de arte vira shows no formato do montar.mjs. Funções puras, testadas.
const iso = (a, m, d) => `${a}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Post com cara de agenda, com imagem, e com menos de 2 datas dd/mm no texto (senão o extrator de texto resolve).
export function precisaArte(post) {
  if (!post.imagens?.length) return false;
  const t = String(post.legenda || "");
  if (!/\bagenda\b|pr[óo]xim[oa]s (shows|datas)/i.test(t)) return false;
  return (t.match(/\b\d{1,2}\/\d{1,2}\b/g) || []).length < 2;
}

const hora = (h) => {
  const m = String(h || "").match(/(\d{1,2})\s*[h:]\s*(\d{2})?/i);
  return m && +m[1] <= 23 ? `${m[1].padStart(2, "0")}:${m[2] || "00"}` : null;
};
const handle = (c) => {
  const t = String(c || "").trim().replace(/^@/, "");
  return /^[a-z0-9._]{3,30}$/.test(t) ? t : null;
};

// Resposta do Gemini ({shows:[{dia, mes, hora, casa, cidade, uf, observacao}]}) -> shows. Ano: mês da agenda
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
