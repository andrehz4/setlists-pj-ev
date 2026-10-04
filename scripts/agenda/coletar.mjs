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
import { montarAgenda } from "./montar.mjs";
import { paginaAgenda } from "./pagina.mjs";
import { aplicarSitemap } from "./sitemap.mjs";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const NO_GIT = args.includes("--no-git");
const BANDAS = naRaiz("media/agenda/bandas.json");
const ESTADO = naRaiz("media/agenda/shows.json");

async function main() {
  const hoje = diaBRT();
  const { bandas } = await lerEstado(BANDAS, { bandas: [] });
  const antes = await lerEstado(ESTADO, { shows: [], bandas: {} });
  const shows = [];
  const infos = { ...antes.bandas };
  for (const b of bandas) {
    try {
      const conta = await lerConta(b.conta, { n: 30 });
      const agenda = montarAgenda(b, conta.posts, hoje);
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
    return;
  }
  await gravarEstado(ESTADO, { atualizado: new Date().toISOString(), bandas: infos, oficial, shows });
  await fs.mkdir(naRaiz("agenda"), { recursive: true });
  await fs.writeFile(naRaiz("agenda/index.html"), paginaAgenda({ shows, bandas, oficial, hoje }));
  await fs.writeFile(naRaiz("sitemap.xml"), aplicarSitemap(await fs.readFile(naRaiz("sitemap.xml"), "utf8")));
  await commitAndPush(["media/agenda/", "agenda/", "sitemap.xml"], `agenda: ${shows.length} show(s), ${novos.length} novo(s) ${hoje}`, { dry: NO_GIT });
  if (oficiaisNovos.length) {
    const linhas = oficiaisNovos.map((s) => `• ${s.data.split("-").reverse().join("/")} <b>${escHtml(s.artista)}</b>`
      + ` em ${escHtml([s.casaNome, s.cidade, s.pais].filter(Boolean).join(", "))}${s.brasil ? " 🇧🇷" : ""}`);
    await enviarTelegram(`🚨 <b>Turnê oficial: ${oficiaisNovos.length} data(s) nova(s)</b>\n\n${linhas.join("\n")}`, { prefixo: "[agenda]" });
  }
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
