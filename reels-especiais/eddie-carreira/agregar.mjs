// Lê bruto/ (páginas da API do setlist.fm baixadas pelo coletar.mjs) e gera estudo.json. Não chama a API.
//   node agregar.mjs            (lê ./bruto, escreve ./estudo.json)
import fs from "node:fs";
import path from "node:path";
import { carregar, ranking, pontas, chave, pct, onde } from "./agregar-lib.mjs";

const AQUI = path.dirname(new URL(import.meta.url).pathname);
const enxuto = (r) => ({ musica: r.musica, vezes: r.vezes, pct: r.pct, cover_de: r.cover_de });
const conta = (shows, f) => Object.fromEntries([...shows.reduce((m, s) => m.set(f(s), (m.get(f(s)) || 0) + 1), new Map())].sort((a, b) => b[1] - a[1]));

function bloco(shows, eras, extra) {
  const rank = ranking(shows);
  const ult = shows[shows.length - 1];
  const tam = shows.map((s) => s.musicas.length);
  const maiorShow = shows.reduce((a, s) => (s.musicas.length > a.musicas.length ? s : a), shows[0]);
  return {
    ...extra,
    total_shows_com_setlist: shows.length,
    primeiro_show: onde(shows[0]), ultimo_show: onde(ult),
    musicas_distintas: rank.length,
    tocadas_uma_unica_vez: rank.filter((r) => r.vezes === 1).length,
    total_de_execucoes: rank.reduce((a, r) => a + r.vezes, 0),
    media_de_musicas_por_show: Math.round((tam.reduce((a, b) => a + b, 0) / shows.length) * 10) / 10,
    maior_show: { ...onde(maiorShow), musicas: maiorShow.musicas.length, url: maiorShow.url },
    maiores_shows: [...shows].sort((a, b) => b.musicas.length - a.musicas.length).slice(0, 8).map((s) => ({ ...onde(s), musicas: s.musicas.length })),
    shows_por_ano: Object.fromEntries(Object.entries(conta(shows, (s) => s.ano)).sort()),
    shows_por_pais: conta(shows, (s) => s.paisNome),
    ranking: rank.map(({ chave: _c, ...r }) => r),
    eras: Object.fromEntries(eras.map(([nome, de, ate]) => {
      const sub = shows.filter((s) => s.ano >= de && s.ano <= ate);
      const rk = ranking(sub);
      const antes = new Set(ranking(shows.filter((s) => s.ano < de)).map((r) => r.chave));
      return [nome, { shows: sub.length, musicas_distintas: rk.length, top: rk.slice(0, 25).map(enxuto),
        estreias_da_era_mais_tocadas: rk.filter((r) => !antes.has(r.chave)).slice(0, 10).map(enxuto) }];
    })),
    aberturas: pontas(shows, "abertura"), encerramentos: pontas(shows, "fecho"),
    covers: rank.filter((r) => r.cover_de).slice(0, 40).map((r) => ({ ...enxuto(r), primeira: r.primeira.data, ultima: r.ultima.data })),
    artistas_mais_cobertos: Object.entries(rank.filter((r) => r.cover_de).reduce((o, r) => {
      (o[r.cover_de] ||= { execucoes: 0, musicas: 0 }); o[r.cover_de].execucoes += r.vezes; o[r.cover_de].musicas++; return o;
    }, {})).sort((a, b) => b[1].execucoes - a[1].execucoes).slice(0, 20).map(([artista, v]) => ({ artista, ...v })),
    sumidas: rank.filter((r) => r.vezes >= 15 && ult.ano - +r.ultima.data.slice(0, 4) >= 8).slice(0, 25)
      .map((r) => ({ musica: r.musica, vezes: r.vezes, ultima: r.ultima, shows_desde_a_ultima: r.shows_desde_a_ultima })),
    estreias_recentes: rank.filter((r) => r.primeira.data >= "2024-01-01").slice(0, 25)
      .map((r) => ({ musica: r.musica, vezes: r.vezes, primeira: r.primeira, cover_de: r.cover_de })),
  };
}

function brasil(shows, rankGlobal, artista) {
  const br = shows.filter((s) => s.pais === "BR");
  if (!br.length) return { shows: 0 };
  const rk = ranking(br);
  const glob = new Map(rankGlobal.map((r) => [chave(r.musica), r]));
  return {
    artista, shows: br.length, cidades: conta(br, (s) => s.cidade), anos: conta(br, (s) => s.ano),
    lista: br.map((s) => ({ ...onde(s), musicas: s.musicas.length, abertura: s.abertura.nome, encerramento: s.fecho.nome, url: s.url })),
    musicas_distintas: rk.length,
    media_de_musicas_por_show: Math.round((br.reduce((a, s) => a + s.musicas.length, 0) / br.length) * 10) / 10,
    ranking: rk.map(({ chave: _c, shows_desde_a_ultima: _s, ...r }) => r),
    em_todos_os_shows: rk.filter((r) => r.vezes === br.length).map((r) => r.musica),
    estreias_mundiais_no_brasil: rk.filter((r) => glob.get(r.chave)?.primeira.pais === "BR")
      .map((r) => ({ musica: r.musica, primeira: glob.get(r.chave).primeira, vezes_na_carreira: glob.get(r.chave).vezes, cover_de: r.cover_de })),
    so_tocadas_no_brasil: rk.filter((r) => glob.get(r.chave)?.vezes === r.vezes)
      .map((r) => ({ musica: r.musica, vezes: r.vezes, cover_de: r.cover_de, primeira: r.primeira })),
  };
}

const solo = carregar("eddie-vedder");
const pj = carregar("pearl-jam");
const todos = [...solo.shows, ...pj.shows].sort((a, b) => a.data.localeCompare(b.data));
const ERAS_SOLO = [["antes de 2008", 0, 2007], ["2008-2012", 2008, 2012], ["2013-2019", 2013, 2019], ["2020-2026", 2020, 2026]];
const ERAS_PJ = [["anos 1990", 1990, 1999], ["anos 2000", 2000, 2009], ["anos 2010", 2010, 2019], ["anos 2020", 2020, 2029]];
const meta = (c) => ({ setlists_listados: c.listados, paginas_lidas: c.paginas, ignorados_vazios: c.vazios, ignorados_futuros_sem_musica: c.futuros });

const bSolo = bloco(solo.shows, ERAS_SOLO, meta(solo));
const bPJ = bloco(pj.shows, ERAS_PJ, meta(pj));
const bTodos = bloco(todos, ERAS_PJ, { nota: "soma dos dois artistas; show em que os dois têm setlist no mesmo dia conta duas vezes" });

const kPJ = new Map(bPJ.ranking.map((r) => [chave(r.musica), r]));
const kSolo = new Map(bSolo.ranking.map((r) => [chave(r.musica), r]));
const cruzamento = {
  so_no_solo_nunca_no_pearl_jam: bSolo.ranking.filter((r) => !kPJ.has(chave(r.musica))).slice(0, 40)
    .map((r) => ({ ...enxuto(r), primeira: r.primeira.data, ultima: r.ultima.data })),
  musicas_do_pearl_jam_mais_tocadas_no_solo: bSolo.ranking.filter((r) => r.do_pearl_jam).slice(0, 30)
    .map((r) => ({ musica: r.musica, vezes_solo: r.vezes, pct_solo: r.pct, vezes_pearl_jam: kPJ.get(chave(r.musica))?.vezes || 0, pct_pearl_jam: kPJ.get(chave(r.musica))?.pct || 0 })),
  top_pearl_jam_que_o_solo_nunca_tocou: bPJ.ranking.filter((r) => !kSolo.has(chave(r.musica))).slice(0, 25).map(enxuto),
  mais_tocadas_nos_dois: bPJ.ranking.filter((r) => kSolo.has(chave(r.musica)))
    .map((r) => ({ musica: r.musica, pearl_jam: r.vezes, solo: kSolo.get(chave(r.musica)).vezes, soma: r.vezes + kSolo.get(chave(r.musica)).vezes, cover_de: r.cover_de }))
    .sort((a, b) => b.soma - a.soma).slice(0, 30),
};

const estudo = {
  gerado_em: new Date().toISOString(), fonte: "setlist.fm (API, páginas em bruto/)",
  metodo: "1 contagem por show; fita de abertura (tape) e setlist sem música ficam de fora; nomes unidos sem diferenciar maiúscula, acento e pontuação; cover = música creditada a outro artista que não Pearl Jam nem Eddie Vedder",
  solo: bSolo, pearl_jam: bPJ, somados: bTodos, cruzamento,
  brasil: { solo: brasil(solo.shows, bSolo.ranking, "Eddie Vedder"), pearl_jam: brasil(pj.shows, bPJ.ranking, "Pearl Jam"), somados: brasil(todos, bTodos.ranking, "solo + Pearl Jam") },
};
fs.writeFileSync(path.join(AQUI, "estudo.json"), JSON.stringify(estudo, null, 1));
for (const [n, b] of [["solo", bSolo], ["pearl jam", bPJ], ["somados", bTodos]])
  console.log(`${n}: ${b.total_shows_com_setlist} shows com setlist, ${b.musicas_distintas} músicas, top: ${b.ranking.slice(0, 5).map((r) => `${r.musica} ${r.vezes}`).join(", ")}`);
console.log(`ignorados: solo ${solo.vazios} vazios + ${solo.futuros} futuros; pj ${pj.vazios} vazios + ${pj.futuros} futuros`);
console.log(`brasil: solo ${estudo.brasil.solo.shows} shows, pj ${estudo.brasil.pearl_jam.shows} shows`);
