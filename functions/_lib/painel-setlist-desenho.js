// Desenho do painel do contador: recebe o retrato (functions/_lib/contador.js) e devolve o HTML do miolo.
// A MESMA função roda no servidor (primeira carga) e no navegador (a página embute o texto dela e redesenha a cada
// 30 s), por isso não pode usar nada de fora dela.
export function desenhar(d) {
  const num = (n) => (n || 0).toLocaleString("pt-BR");
  const v = (o, ...ks) => ks.reduce((s, k) => s + (o[k] || 0), 0);
  const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
  const hoje = d.dias[d.hoje] || {}, total = {};
  for (const dia of Object.values(d.dias)) for (const [k, n] of Object.entries(dia)) total[k] = (total[k] || 0) + n;

  const cartoes = [["Visitas", ["visita"]], ["Sorteios", ["sorteou"]], ["Vídeos baixados", ["baixou_video"]], ["Imagens baixadas", ["baixou_imagem"]]]
    .map(([rot, ks]) => `<div class="cartao"><span class="rot">${rot}</span><b>${num(v(hoje, ...ks))}</b><small>hoje</small>
      <em>${num(v(total, ...ks))}</em><small>total</small></div>`).join("");

  const etapas = [["Visitas", "visita"], ["Sorteios", "sorteou"], ["Montou à mão", "montou"], ["Pediu o vídeo", "pediu_video"],
    ["Vídeos baixados", "baixou_video"], ["Imagens baixadas", "baixou_imagem"], ["Compartilhou", "compartilhou"]];
  const funil = (nome, o) => `<div class="funil"><h3>${nome}</h3>${etapas.map(([rot, k]) => {
    const n = v(o, k), p = pct(n, v(o, "visita"));
    return `<div class="etapa"><span>${rot}</span><div class="trilho"><i style="width:${Math.min(100, p)}%"></i></div>
      <b>${num(n)}</b><small>${k === "visita" ? "" : p + "%"}</small></div>`;
  }).join("")}</div>`;

  // Barra de duas partes (A dourado, B azul), sempre com rótulo e número: a cor nunca fala sozinha.
  const duelo = (titulo, a, b, na, nb) => {
    const t = a + b, pa = t ? Math.round((a / t) * 100) : 50;
    return `<div class="duelo"><span class="rot">${titulo}</span>
      <div class="par">${t ? `<i class="a" style="flex:${a || 0.001}"></i><i class="b" style="flex:${b || 0.001}"></i>` : '<i class="nada"></i>'}</div>
      <div class="leg"><span><i class="a"></i>${na} <b>${num(a)}</b> <small>${t ? pa + "%" : ""}</small></span>
      <span><i class="b"></i>${nb} <b>${num(b)}</b> <small>${t ? 100 - pa + "%" : ""}</small></span></div></div>`;
  };
  const com = (suf, ...evs) => v(total, ...evs.map((e) => `${e}.${suf}`));
  const noites = duelo("Folhas vistas (sorteio + montagem)", com("n20", "sorteou", "montou"), com("n22", "sorteou", "montou"), "Sex 20/11", "Dom 22/11")
    + duelo("Downloads (vídeo + imagem)", com("n20", "baixou_video", "baixou_imagem"), com("n22", "baixou_video", "baixou_imagem"), "Sex 20/11", "Dom 22/11");
  const insta = duelo("Visitas", com("ig", "visita"), com("fora", "visita"), "Dentro do Instagram", "Fora")
    + duelo("Downloads (vídeo + imagem)", com("ig", "baixou_video", "baixou_imagem"), com("fora", "baixou_video", "baixou_imagem"), "Dentro do Instagram", "Fora")
    + `<p class="nota">Tocaram no vídeo dentro do Instagram e foram mandados pro navegador: <b>${num(v(total, "saiu_app"))}</b>.
      Chegaram no navegador com a setlist no link: <b>${num(v(total, "abriu_fora"))}</b>.</p>`;

  // Uma série por faixa, cada faixa com a própria escala (nada de dois eixos no mesmo gráfico).
  const faixa = (titulo, ks) => {
    const vals = d.horas.map((h) => v(h, ...ks)), pico = Math.max(1, ...vals), soma = vals.reduce((s, n) => s + n, 0);
    return `<div class="faixa"><div class="cab"><span class="rot">${titulo}</span><small>${num(soma)} em 48 h, pico de ${num(Math.max(...vals))} numa hora</small></div>
      <div class="barras">${d.horas.map((h, i) => {
        const hh = h.h.slice(11), dia = h.h.slice(8, 10) + "/" + h.h.slice(5, 7);
        return `<div class="col${hh === "00" ? " virada" : ""}" data-t="${dia} ${hh}h: ${num(vals[i])}"><i style="height:${(vals[i] / pico) * 100}%"></i></div>`;
      }).join("")}</div>
      <div class="eixo">${d.horas.map((h) => { const hh = h.h.slice(11); return `<span>${hh === "00" ? h.h.slice(8, 10) + "/" + h.h.slice(5, 7) : hh % 6 ? "" : hh + "h"}</span>`; }).join("")}</div></div>`;
  };

  const linhas = Object.keys(d.dias).sort().reverse().map((dia) => {
    const o = d.dias[dia];
    return `<tr><th>${dia.slice(8)}/${dia.slice(5, 7)}${dia === d.hoje ? " (hoje)" : ""}</th>${["visita", "sorteou", "montou", "pediu_video", "baixou_video", "baixou_imagem", "compartilhou"]
      .map((k) => `<td>${num(v(o, k))}</td>`).join("")}</tr>`;
  }).join("");

  // Nome é texto digitado por visitante: sempre escapado antes de entrar no HTML.
  const esc = (t) => String(t ?? "").replace(/[&<>"'`]/g, (c) => "&#" + c.charCodeAt(0) + ";");
  const nm = d.nomes || { lista: [], distintos: 0, barrados: 0 };
  const rotEv = { sorteou: "Sorteou", baixou_video: "Baixou o vídeo", baixou_imagem: "Baixou a imagem", compartilhou: "Compartilhou" };
  const nomes = nm.lista.map((n) => { const q = String(n.quando || "");
    return `<tr${n.barrado ? ' class="barrado"' : ""}><th>${esc(q.slice(8, 10) + "/" + q.slice(5, 7) + " " + q.slice(11, 16))}</th>
      <td class="nome">${esc(n.nome)}${n.barrado ? ' <span class="selo">barrado pelo filtro</span>' : ""}</td><td>${n.noite === 20 || n.noite === 22 ? n.noite + "/11" : ""}</td>
      <td>${esc(rotEv[n.evento] || n.evento)}</td><td>${n.dentro_app ? "Instagram" : "Fora"}</td></tr>`; }).join("");

  const hora = new Date(d.agora).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo" });
  return `<p class="quando">Números de ${hora} (horário de Brasília)</p>
    <section class="cartoes">${cartoes}</section>
    <section><h2>Funil</h2><div class="funis">${funil("Hoje", hoje)}${funil("Total", total)}</div>
      <p class="nota">A porcentagem é sobre as visitas. Visita conta cada abertura da página, não pessoa.</p></section>
    <section class="duas"><div><h2>Noites: 20 x 22</h2>${noites}</div><div><h2>Instagram x fora</h2>${insta}</div></section>
    <section><h2>Por hora, últimas 48 h</h2>${faixa("Visitas", ["visita"])}${faixa("Sorteios", ["sorteou"])}${faixa("Downloads (vídeo + imagem)", ["baixou_video", "baixou_imagem"])}</section>
    <section><h2>Por dia</h2><div class="rola"><table><thead><tr><th>Dia</th><th>Visitas</th><th>Sorteios</th><th>Montou</th><th>Pediu vídeo</th><th>Vídeos</th><th>Imagens</th><th>Compartilhou</th></tr></thead>
      <tbody>${linhas || '<tr><td colspan="8">Nenhum evento ainda.</td></tr>'}</tbody></table></div></section>
    <section><h2>Nomes</h2><p class="nota">Nomes diferentes: <b>${num(nm.distintos)}</b>. Barrados pelo filtro: <b>${num(nm.barrados)}</b>. Abaixo, os últimos ${nm.lista.length || 100}.</p>
      <div class="rola"><table class="nomes"><thead><tr><th>Hora (Brasília)</th><th>Nome</th><th>Noite</th><th>Evento</th><th>Onde</th></tr></thead>
      <tbody>${nomes || '<tr><td colspan="5">Nenhum nome ainda.</td></tr>'}</tbody></table></div></section>`;
}
