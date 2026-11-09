// Monta a agenda de UMA banda a partir dos posts lidos. Função pura, testada. Três formatos de post:
//   agenda em lista (uma linha por show) ou em blocos (várias linhas por show): o post mais recente vence para as
//   datas que ele traz (pode ter vários shows no mesmo dia);
//   post do dia: completa casa e horário de um show já conhecido;
//   aviso solto ("dia 10/10 no botecohelena em Suzano"): cria o show se a data ainda não está na agenda;
//   arte do post (post.arte, lida pelo curador, ver scripts/agenda/arte/): por último, só COMPLETA a legenda:
//   show que a legenda já tem ganha o que faltou (hora, casa, cidade); data que ela não tem vira show novo.
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

// Mesma casa escrita de jeitos diferentes: "Mister Rock" (arte) e "misterrockinsampa" (@ na legenda).
const norma = (t) => slug(t).replace(/-/g, "");
const mesmaCasa = (a, b) => { const x = norma(a), y = norma(b); return !!x && !!y && (x.includes(y) || y.includes(x)); };
const casaDe = (s) => s.casa || s.casaNome;

// Show lido da arte: casa igual (ou o único do dia, se um dos dois não tem casa) recebe só os campos vazios.
function completarComArte(porData, a, link) {
  const dia = porData.get(a.data) || [];
  const igual = dia.find((s) => mesmaCasa(casaDe(s), casaDe(a)))
    || (dia.length === 1 && !(casaDe(dia[0]) && casaDe(a)) ? dia[0] : null);
  if (!igual) { porData.set(a.data, [...dia, { ...a, fonte: link }]); return; }
  for (const k of ["casa", "casaNome", "cidade", "uf", "hora", "observacao"]) igual[k] ||= a[k];
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
    // post do dia: completa casa e horário (nunca troca a cidade). Casa diferente da conhecida = outro show no dia.
    const alvo = conhecidos && (conhecidos.find((s) => d.casa && mesmaCasa(casaDe(s), d.casa))
      || (conhecidos.length === 1 && !(d.casa && casaDe(conhecidos[0])) ? conhecidos[0] : null));
    if (alvo) {
      if (!alvo.casa && d.casa) alvo.casa = d.casa;
      if (!alvo.hora && d.hora) alvo.hora = d.hora;
      alvo.detalhe = p.link;
      continue;
    }
    if (conhecidos && !d.casa) continue;
    const solto = showDoAvisoSolto(p.legenda, p.data, banda);
    if (!solto) continue;
    const ja = porData.get(solto.data) || [];
    const mesmo = ja.find((s) => !casaDe(s) || !solto.casa || mesmaCasa(casaDe(s), solto.casa));
    if (mesmo) { // dois avisos do mesmo show: junta o que cada um sabe
      for (const k of ["casa", "cidade", "hora"]) mesmo[k] ||= solto[k];
      continue;
    }
    porData.set(solto.data, [...ja, { ...solto, fonte: p.link }]);
  }
  for (const p of ordenados) for (const a of p.arte || []) completarComArte(porData, a, p.link);
  return [...porData.values()].flat()
    .filter((s) => s.data >= hoje)
    .sort((a, b) => a.data.localeCompare(b.data) || String(a.hora || "").localeCompare(String(b.hora || "")))
    // cidade sem estado ("Barreiro"): vale o estado da banda, que quase sempre toca perto de casa
    .map((s) => ({ id: idDoShow(banda.conta, s), banda: banda.conta, nome: banda.nome, ...s,
      uf: s.uf || (s.cidade && banda.uf) || null }));
}
