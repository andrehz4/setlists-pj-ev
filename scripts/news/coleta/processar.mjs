// Processa cada candidato: texto e imagem (scrape ou pré-extraídos), cache da imagem e o curador.
// Curador "routine" devolve PENDING (vai pro _pending.json cru); os outros devolvem a matéria pronta.
import { scrapeArticle } from "../extract.mjs";
import { cacheImage } from "../image-cache.mjs";

async function textoEImagem(c) {
  // Fontes com texto/imagem pré-extraídos (loja, pjcom-news) pulam o scrape.
  if (c.preText || c.preImg) {
    let articleText = c.preText || "";
    let imgUrl = c.preImg || null;
    if (!articleText) {
      const scraped = await scrapeArticle(c.url);
      articleText = scraped.articleText;
      if (!imgUrl) imgUrl = scraped.imgUrl;
    }
    return { imgUrl, articleText };
  }
  return scrapeArticle(c.url);
}

const base = (c, localImg) => ({
  id: c.hash,
  url: c.url,
  source: c.sourceId,
  sourceLabel: c.sourceLabel,
  group: c.group,
  pubDate: c.pubDate,
  fetchedAt: new Date().toISOString(),
  img: localImg,
});

// Muta `seen` (skip, curado, erro). Pendente NÃO entra no seen: só depois que a routine commitar.
export async function processarCandidatos(fresh, curator, seen, warnings) {
  const curated = [];
  const pending = [];
  for (const c of fresh) {
    console.log(`[news] processando: ${c.sourceLabel} | ${c.title.slice(0, 70)}`);
    try {
      const { imgUrl, articleText } = await textoEImagem(c);
      const localImg = await cacheImage(imgUrl, c.hash);
      const out = await curator.curate({
        title: c.title,
        sourceLabel: c.sourceLabel,
        articleText: articleText || c.snippet,
        url: c.url,
        pubDate: c.pubDate,
      });
      if (out === "SKIP") {
        console.log(`[news] SKIP: ${c.title.slice(0, 70)}`);
        seen[c.hash] = { skipped: true, ts: Date.now(), title: c.title };
        continue;
      }
      if (out === "PENDING") {
        const item = { ...base(c, localImg), title_orig: c.title, article_text: articleText || c.snippet || "" };
        if (c.kind) item.kind = c.kind; // loja, pjcom-news...: a curadoria aplica a regra do tipo
        pending.push(item);
        continue;
      }
      curated.push({
        ...base(c, localImg),
        title_pt: out.titulo_pt,
        title_ig: out.titulo_ig, // manchete curta do card; undefined some no JSON (fallback title_pt)
        intro_pt: out.intro_pt,
        body_pt: out.corpo_pt,
        tags: out.tags,
      });
      seen[c.hash] = { firstSeen: Date.now(), title: c.title };
    } catch (err) {
      console.warn(`[news] ERRO em "${c.title.slice(0, 60)}" (${c.url}): ${err.message}`);
      warnings.push(`Item com erro [${c.sourceLabel}] "${c.title.slice(0, 60)}": ${err.message}`);
      // marca erro no seen pra não reprocessar em loop; volta só se o seen for limpo à mão
      seen[c.hash] = { error: true, ts: Date.now(), title: c.title, msg: err.message };
    }
  }
  return { curated, pending };
}
