// Monta a agenda de UMA banda a partir dos posts lidos: agendas do mês (o mais recente vence quando o mesmo
// dia aparece em dois posts) + detalhes dos posts do dia (casa e horário). Função pura, testada.
import { showsDoPostDeAgenda, detalhesDoPostDoDia } from "./extrair.mjs";

const slug = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const idDoShow = (conta, s) => `${conta}-${s.data}-${slug(s.cidade || s.casa || "local")}`;

// hoje: "AAAA-MM-DD" (BRT). Só entram shows de hoje em diante.
export function montarAgenda(banda, posts, hoje) {
  const porData = new Map();
  const ordenados = [...posts].sort((a, b) => a.data.localeCompare(b.data)); // antigo -> recente
  for (const p of ordenados) {
    const shows = showsDoPostDeAgenda(p.legenda, p.data);
    if (!shows) continue;
    for (const s of shows) {
      const chave = `${s.data}|${s.observacao || ""}`;
      const antes = porData.get(chave) || {};
      // o post mais recente vence, mas não apaga o que um post anterior já sabia (casa, nome do teatro)
      porData.set(chave, { ...s, casa: s.casa || antes.casa || null, casaNome: s.casaNome || antes.casaNome || null,
        hora: null, fonte: p.link });
    }
  }
  // posts do dia completam casa e horário (nunca trocam a cidade de um show já conhecido)
  for (const p of ordenados) {
    if (showsDoPostDeAgenda(p.legenda, p.data)) continue;
    const d = detalhesDoPostDoDia(p.legenda, p.data, [banda.conta]);
    if (!d) continue;
    for (const s of porData.values()) {
      if (s.data !== d.data) continue;
      if (!s.casa && d.casa) s.casa = d.casa;
      if (!s.hora && d.hora) s.hora = d.hora;
      s.detalhe = p.link;
    }
  }
  return [...porData.values()]
    .filter((s) => s.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data))
    .map((s) => ({ id: idDoShow(banda.conta, s), banda: banda.conta, nome: banda.nome, ...s }));
}
