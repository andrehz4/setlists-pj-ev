// Dados do story por banda num dia: um story por banda (shows do dia juntos, em ordem de horário), as falas fixas da
// voz do dia (abertura, estado, data, hora, final, whoosh) e os trechos de b-roll (sem repetir entre as bandas do dia).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { naRaiz } from "../../../config.mjs";
import { localizar } from "../mapa.mjs";
import { falasDoStory, fraseEstado, fraseHora, arquivoDaFala, vozDoDia, DIR_VOZ } from "../voz.mjs";

const DIR_DATAS = naRaiz("media/news/instagram-stories/narracao/datas");

// shows (agenda) + bandas (cadastro) -> stories do dia
export function storiesDoDia(shows, bandas, dia) {
  const porBanda = new Map();
  for (const s of shows) if (s.data === dia && !s.fechado) (porBanda.get(s.banda) || porBanda.set(s.banda, []).get(s.banda)).push(s);
  return [...porBanda].map(([conta, lista]) => {
    const b = bandas.find((x) => x.conta === conta) || { nome: lista[0].nome, cidade: "", uf: "", desde: "" };
    const base = b.cidade && b.uf ? localizar(b.cidade, b.uf) : null;
    const ordenados = [...lista].sort((a, c) => String(a.hora || "99").localeCompare(String(c.hora || "99")));
    return {
      conta: `@${conta}`, contaPura: conta, banda: b.nome, cidadeBase: [b.cidade, b.uf].filter(Boolean).join("/"), desde: b.desde, dia,
      baseLonlat: base && !base.aproximado ? base.pos : null, // origem da rota de turnê (mapa C)
      shows: ordenados.map((s) => {
        const l = localizar(s.cidade, s.uf || b.uf);
        return { cidade: l ? l.nome : s.cidade || "", uf: s.uf || b.uf, lonlat: l ? l.pos : null, aproximado: !l || !!l.aproximado, hora: s.hora || null,
          casa: s.casa ? `@${s.casa}` : s.casaNome || null, casaPura: s.casa || null };
      }).filter((s) => s.lonlat),
    };
  }).filter((st) => st.shows.length);
}

// Contas pra marcar: a banda e as casas (sem repetir).
export const contasDoStory = (st) => [...new Set([st.contaPura, ...st.shows.map((s) => s.casaPura).filter(Boolean)])];

const existe = (f) => f && fs.existsSync(f) ? f : null;
// Data já gravada no story diário (na voz do dia): datas/<voz>-<MM-DD>-<hash>.mp3
function arquivoData(dia, voz) {
  const prefixo = `${voz.nome.toLowerCase()}-${dia.slice(5)}-`;
  const f = fs.existsSync(DIR_DATAS) && fs.readdirSync(DIR_DATAS).find((x) => x.startsWith(prefixo));
  return f ? path.join(DIR_DATAS, f) : null;
}

export function falasDaBanda(st, k = 0) {
  const voz = vozDoDia(st.dia); // fica a do dia: a fala da data só existe gravada nela
  const f = falasDoStory(st.banda, st.dia, k);
  const estado = fraseEstado(st.shows[0].uf), hora = fraseHora(st.shows[0].hora);
  return {
    voz,
    abertura: existe(f.abertura), final: existe(f.final),
    estado: estado ? existe(arquivoDaFala(estado, voz)) : null,
    hora: hora ? existe(arquivoDaFala(hora, voz)) : null,
    dataInteira: arquivoData(st.dia, voz), // "Hoje é dez de outubro, e tem novidade..." (cortar na vírgula)
    whoosh: existe(path.join(DIR_VOZ, "whoosh.mp3")),
  };
}

// Trechos de b-roll: abertura (palco, de preferência com canto) e dois cortes. Rotação pelo dia; k = ordem da banda no
// dia, pra duas bandas do mesmo dia não repetirem trecho.
const n = (s) => parseInt(crypto.createHash("sha1").update(s).digest("hex").slice(0, 8), 16);
export function clipesDoStory(acervo, dia, k) {
  const ok = acervo.filter((t) => t.broll && t.dur >= 1.2);
  if (ok.length < 3) return null;
  const abre = ok.filter((t) => (t.broll.acao || []).some((a) => /canta|maos-pro-alto|guitarra/.test(a)));
  const pool = abre.length >= 3 ? abre : ok;
  const base = n(dia) + k * 7;
  return [pool[base % pool.length], ok[(base + 3) % ok.length], ok[(base + 11) % ok.length]];
}
