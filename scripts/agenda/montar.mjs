// Monta a agenda de UMA banda a partir dos posts lidos. Função pura, testada. Três formatos de post:
//   agenda em lista (uma linha por show) ou em blocos (várias linhas por show): o post mais recente vence para as
//   datas que ele traz (pode ter vários shows no mesmo dia);
//   post do dia: completa casa e horário de um show já conhecido;
//   aviso solto ("dia 10/10 no botecohelena em Suzano"): cria o show se a data ainda não está na agenda.
import { showsDoPostDeAgenda, detalhesDoPostDoDia } from "./extrair.mjs";
import { showsEmBlocos } from "./extrair-blocos.mjs";
import { showDoAvisoSolto } from "./extrair-solto.mjs";

const slug = (t) => String(t || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
export const idDoShow = (conta, s) => `${conta}-${s.data}-${slug(s.cidade || s.casa || "local")}`;

// Agenda do post (lista ou blocos). Bloco só vale se disser onde é (ou que é fechado): evita falso positivo.
function agendaDoPost(p) {
  const lista = showsDoPostDeAgenda(p.legenda, p.data);
  if (lista) return lista;
  const blocos = showsEmBlocos(p.legenda, p.data);
  return blocos && blocos.some((s) => s.casa || s.cidade || s.fechado) ? blocos : null;
}

// hoje: "AAAA-MM-DD" (BRT). Só entram shows de hoje em diante.
export function montarAgenda(banda, posts, hoje) {
  const porData = new Map(); // data -> [shows]
  const ordenados = [...posts].sort((a, b) => a.data.localeCompare(b.data)); // antigo -> recente
  const avisos = [];
  for (const p of ordenados) {
    const shows = agendaDoPost(p);
    if (!shows) { avisos.push(p); continue; }
    const novos = new Map();
    for (const s of shows) (novos.get(s.data) || novos.set(s.data, []).get(s.data)).push({ ...s, hora: s.hora || null, fonte: p.link });
    const completa = shows.length >= 2; // agenda de verdade: o post mais novo manda no dia inteiro
    for (const [data, lista] of novos) {
      const antes = porData.get(data) || [];
      if (completa) {
        // o post mais recente vence, mas não apaga o que um post anterior já sabia (casa, nome do teatro)
        if (lista.length === 1 && antes.length === 1) {
          lista[0].casa ||= antes[0].casa;
          lista[0].casaNome ||= antes[0].casaNome;
        }
        porData.set(data, lista);
        continue;
      }
      // anúncio de um show só (em bloco): atualiza o show igual (mesma casa ou cidade) e não mexe nos outros do dia
      const s = lista[0];
      const igual = antes.find((a) => (s.casa && a.casa === s.casa) || (s.cidade && a.cidade === s.cidade));
      if (igual) Object.assign(igual, Object.fromEntries(Object.entries(s).filter(([, v]) => v)));
      else porData.set(data, [...antes, s]);
    }
  }
  for (const p of avisos) {
    const d = detalhesDoPostDoDia(p.legenda, p.data, [banda.conta]);
    const conhecidos = d && porData.get(d.data);
    if (conhecidos) { // post do dia: completa casa e horário (nunca troca a cidade)
      if (conhecidos.length === 1) {
        const s = conhecidos[0];
        if (!s.casa && d.casa) s.casa = d.casa;
        if (!s.hora && d.hora) s.hora = d.hora;
        s.detalhe = p.link;
      }
      continue;
    }
    const solto = showDoAvisoSolto(p.legenda, p.data, banda);
    if (!solto) continue;
    const ja = porData.get(solto.data);
    if (ja) { // dois avisos do mesmo show: junta o que cada um sabe
      for (const k of ["casa", "cidade", "hora"]) ja[0][k] ||= solto[k];
      continue;
    }
    porData.set(solto.data, [{ ...solto, fonte: p.link }]);
  }
  return [...porData.values()].flat()
    .filter((s) => s.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || String(a.hora || "").localeCompare(String(b.hora || "")))
    // cidade sem estado ("Barreiro"): vale o estado da banda, que quase sempre toca perto de casa
    .map((s) => ({ id: idDoShow(banda.conta, s), banda: banda.conta, nome: banda.nome, ...s,
      uf: s.uf || (s.cidade && banda.uf) || null }));
}
