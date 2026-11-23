// Coleta diária da agenda (workflow agenda.yml): turnê oficial de pearljam.com/tour e bandas cover pela API
// oficial do Instagram. Monta os shows, grava media/agenda/shows.json, gera /agenda/ e avisa os shows novos no Telegram.
// Flags: --dry-run (não grava nem avisa), --no-git. Banda que falhar na leitura mantém os shows de antes.
import fs from "node:fs/promises";
import { naRaiz } from "../config.mjs";
import { lerEstado, gravarEstado } from "../lib/estado.mjs";
import { commitAndPush } from "../lib/git.mjs";
import { enviarTelegram, escHtml } from "../lib/telegram.mjs";
import { diaBRT } from "../lib/brt.mjs";
import { lerConta } from "./ler-instagram.mjs";
import { lerOficial } from "./oficial.mjs";
import { atualizarFoto, fotosExistentes } from "./fotos.mjs";
import { montarAgenda } from "./montar.mjs";
import { aplicarLeituras, enfileirarArtes, limparFila, PASTA } from "./arte/index.mjs";
import { paginaAgenda } from "./pagina.mjs";
import { postsDasCasas } from "./casas/index.mjs";
import { aplicarSitemap } from "./sitemap.mjs";
import { aplicarCorrecoes, lerCorrecoes } from "./correcoes.mjs";
import { separarSuspeitos, linhaSuspeito } from "./suspeitos/index.mjs";
import { separarSemProva } from "./prova/index.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const BANDAS = naRaiz("media/agenda/bandas.json");
const ESTADO = naRaiz("media/agenda/shows.json");
const PENDENTES = naRaiz(`${PASTA}/pendentes.json`);
const LIDAS = naRaiz(`${PASTA}/lidas.json`);

async function main() {
  const hoje = diaBRT();
  const { bandas } = await lerEstado(BANDAS, { bandas: [] });
  const antes = await lerEstado(ESTADO, { shows: [], bandas: {} });
  const lidas = await lerEstado(LIDAS, {}); // escrito pelo curador (routine)
  const fila = await lerEstado(PENDENTES, []);
  const pendentes = DRY ? fila : await limparFila(fila, lidas, { raiz: naRaiz(".") }); // apaga imagem já lida
  const shows = [], suspeitos = [];
  const infos = { ...antes.bandas };
  const aprovados = new Set((await lerEstado(naRaiz("media/agenda/aprovados.json"), { ids: [] })).ids);
  const correcoes = await lerCorrecoes(); // legenda ambígua corrigida à mão (correcoes.mjs)
  const dasCasas = await postsDasCasas(bandas); // posts de colaboração que só a casa tem no feed
  for (const b of bandas) {
    try {
      const conta = await lerConta(b.conta, { n: 30 });
      const comArte = aplicarLeituras(conta.posts, lidas);
      const novas = DRY ? 0 : await enfileirarArtes(b, conta.posts, { pendentes, lidas, hoje, raiz: naRaiz(".") });
      if (comArte || novas) console.log(`[agenda] @${b.conta}: ${comArte} arte(s) lida(s) usada(s), ${novas} nova(s) pro curador`);
      const deCasa = dasCasas.get(b.conta) || [];
      const montada = aplicarCorrecoes(montarAgenda(b, [...conta.posts, ...deCasa], hoje), correcoes);
      const { ok: comProva, semProva } = separarSemProva(montada, new Map([...conta.posts, ...deCasa].map((p) => [p.link, p])), aprovados);
      const { ok: agenda, suspeitos: susp } = separarSuspeitos(comProva, new Set(deCasa.map((p) => p.link)));
      suspeitos.push(...susp, ...semProva.map((x) => ({ ...x, motivo: "data não escrita na fonte" })));
      if (!DRY) await atualizarFoto(b.conta, conta.foto);
      shows.push(...agenda);
      infos[b.conta] = { lidoEm: new Date().toISOString(), seguidores: conta.seguidores, ultimoPost: conta.posts[0]?.data || null };
      console.log(`[agenda] @${b.conta}: ${agenda.length} show(s) de hoje em diante`);
    } catch (e) {
      console.warn(`[agenda] @${b.conta} falhou, mantém os shows de antes: ${e.message}`);
      shows.push(...antes.shows.filter((s) => s.banda === b.conta && s.data >= hoje));
    }
  }
  let oficial;
  try {
    oficial = await lerOficial(hoje);
    console.log(`[agenda] turnê oficial: ${oficial.length} data(s)`);
  } catch (e) {
    console.warn(`[agenda] turnê oficial falhou, mantém a de antes: ${e.message}`);
    oficial = (antes.oficial || []).filter((s) => s.data >= hoje);
  }
  shows.sort((a, b) => a.data.localeCompare(b.data) || a.nome.localeCompare(b.nome));
  const vistos = new Set(antes.shows.map((s) => s.id));
  const novos = shows.filter((s) => !vistos.has(s.id) && !s.fechado);
  const oficiaisAntes = new Set((antes.oficial || []).map((s) => s.id));
  const oficiaisNovos = oficial.filter((s) => !oficiaisAntes.has(s.id));
  console.log(`[agenda] total ${shows.length} | novos ${novos.length}`);
  if (DRY) {
    for (const s of oficial) console.log("  OFICIAL", s.data, s.artista, "|", s.casaNome, "|", s.cidade, s.pais);
    for (const s of shows) console.log(" ", s.data, s.nome, "|", s.casa || s.casaNome || "-", "|", s.cidade || "-", s.uf || "");
    for (const s of suspeitos) console.log("  SEGURADO", linhaSuspeito(s).replace(/\n/g, " "));
    return;
  }
  await gravarEstado(ESTADO, { atualizado: new Date().toISOString(), bandas: infos, oficial, shows });
  await gravarEstado(PENDENTES, pendentes);
  await fs.mkdir(naRaiz("agenda"), { recursive: true });
  await fs.writeFile(naRaiz("agenda/index.html"), paginaAgenda({ shows, bandas, oficial, hoje, fotos: fotosExistentes(bandas) }));
  await fs.writeFile(naRaiz("sitemap.xml"), aplicarSitemap(await fs.readFile(naRaiz("sitemap.xml"), "utf8"), hoje));
  await commitAndPush(["media/agenda/", "agenda/", "sitemap.xml", `${PASTA}/`], `agenda: ${shows.length} show(s), ${novos.length} novo(s) ${hoje}`, { dry: NO_GIT });
  if (oficiaisNovos.length) {
    const linhas = oficiaisNovos.map((s) => `• ${s.data.split("-").reverse().join("/")} <b>${escHtml(s.artista)}</b>`
      + ` em ${escHtml([s.casaNome, s.cidade, s.pais].filter(Boolean).join(", "))}${s.brasil ? " 🇧🇷" : ""}`);
    await enviarTelegram(`🚨 <b>Turnê oficial: ${oficiaisNovos.length} data(s) nova(s)</b>\n\n${linhas.join("\n")}`, { prefixo: "[agenda]" });
  }
  if (suspeitos.length) await enviarTelegram(`⚠️ <b>Agenda: ${suspeitos.length} show(s) SEGURADO(s)</b> (sem prova da data ou conflito com a agenda da banda; não entrou no site nem nos posts). Liberar: id em media/agenda/aprovados.json\n\n${suspeitos.map((s) => escHtml(linhaSuspeito(s))).join("\n")}\n\nSe for show de verdade, entra pelo correcoes.json ou pela própria banda.`, { prefixo: "[agenda]" });
  if (novos.length) {
    const linhas = novos.slice(0, 25).map((s) => `• ${s.data.split("-").reverse().slice(0, 2).join("/")} <b>${escHtml(s.nome)}</b>`
      + ` em ${escHtml(s.casa ? "@" + s.casa : s.casaNome || "?")}, ${escHtml([s.cidade, s.uf].filter(Boolean).join("/") || "?")}`);
    await enviarTelegram(`🎸 <b>Agenda: ${novos.length} show(s) novo(s)</b>\n\n${linhas.join("\n")}\n\nhttps://somaisumfadepearljam.com.br/agenda/`, { prefixo: "[agenda]" });
  }
}

main().catch((e) => {
  console.error("[agenda] FATAL:", e);
  process.exit(1);
});
