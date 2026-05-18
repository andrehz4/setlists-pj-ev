// Fontes de noticias do Pearl Jam.
// `alwaysRelevant: true` significa que toda noticia do feed eh relevante (canal dedicado);
// caso contrario o filtro de relevancia (regex PJ) eh aplicado no titulo+descricao.

// Fontes validadas em 2026-05-12. Removidos: pearljam.com/news/feed (XML invalido),
// brooklynvegan (403), whiplash (404 no /rss/news.xml), tenebrarum (DNS), tenho+discos (DNS),
// yt-pjvevo (channel_id errado). Tentar reativar quando achar URLs corretas.

export const SOURCES = [
  // Midia EUA (feeds dedicados quando existem)
  { id: "stereogum-pj", label: "Stereogum", group: "us", url: "https://www.stereogum.com/tag/pearl-jam/feed/", alwaysRelevant: true },
  { id: "consequence-pj", label: "Consequence", group: "us", url: "https://consequence.net/tag/pearl-jam/feed/", alwaysRelevant: true },
  { id: "nme-pj", label: "NME", group: "us", url: "https://www.nme.com/artists/pearl-jam/feed", alwaysRelevant: true },
  { id: "pitchfork-news", label: "Pitchfork", group: "us", url: "https://pitchfork.com/rss/news/", alwaysRelevant: false },
  { id: "rollingstone-music", label: "Rolling Stone", group: "us", url: "https://www.rollingstone.com/music/music-news/feed/", alwaysRelevant: false },

  // Midia BR. alwaysRelevant=false porque sao portais genericos: o filtro de
  // relevancia (regex PJ) corta o que nao for sobre a banda/integrantes/Ten Club.
  // Replicas de wire (AP/Reuters/press release) entre esses sites sao dedupadas
  // por similaridade de conteudo em dedupe.mjs antes do MAX_NEW_PER_RUN.
  { id: "folha-ilustrada", label: "Folha", group: "br", url: "https://feeds.folha.uol.com.br/ilustrada/rss091.xml", alwaysRelevant: false },
  { id: "rolling-stone-br", label: "Rolling Stone Brasil", group: "br", url: "https://rollingstone.uol.com.br/feed/", alwaysRelevant: false },
  { id: "billboard-br", label: "Billboard Brasil", group: "br", url: "https://billboard.com.br/feed/", alwaysRelevant: false },
  { id: "cnn-br", label: "CNN Brasil", group: "br", url: "https://www.cnnbrasil.com.br/feed/", alwaysRelevant: false },
  { id: "terra-musica", label: "Terra", group: "br", url: "https://www.terra.com.br/diversao/musica/rss.xml", alwaysRelevant: false },
  { id: "oglobo-musica", label: "O Globo", group: "br", url: "https://oglobo.globo.com/cultura/musica/rss.xml", alwaysRelevant: false },
  // Rock/musica dedicado (cobertura maior de PJ): mesmo assim filtro aplica
  // porque tambem cobrem outras bandas grandes
  { id: "igor-miranda", label: "Igor Miranda", group: "br", url: "https://igormiranda.com.br/feed/", alwaysRelevant: false },
  { id: "tenho-mais-discos", label: "Tenho Mais Discos Que Amigos", group: "br", url: "https://www.tenhomaisdiscosqueamigos.com/feed/", alwaysRelevant: false },
  { id: "wikimetal", label: "Wikimetal", group: "br", url: "https://www.wikimetal.com.br/feed/", alwaysRelevant: false },

  // Fan archives
  { id: "pjonline-it", label: "PJ Online IT", group: "fan", url: "https://www.pearljamonline.it/news/feed/", alwaysRelevant: true },

  // Comunidade
  { id: "reddit-pj", label: "r/pearljam", group: "comunidade", url: "https://www.reddit.com/r/pearljam/hot.json?limit=25", alwaysRelevant: true, kind: "reddit" },

  // Oficial: news + loja (Shopify products.json). Tudo daqui e relevante.
  // Loja: produtos novos (Mirror Ball reissue, vinyl, boxset, etc) viram
  // noticia editorial via curador, nao ad de venda.
  { id: "pj-shop-featured", label: "Loja Pearl Jam", group: "tenclub", url: "https://shop.pearljam.com/collections/featured/products.json?limit=30", alwaysRelevant: true, kind: "shopify" },
  { id: "pj-shop-music", label: "Loja Pearl Jam", group: "tenclub", url: "https://shop.pearljam.com/collections/music/products.json?limit=30", alwaysRelevant: true, kind: "shopify" },
  // News oficial: RSS quebrado em 2026-05-12. Scraping do JSON inline no HTML.
  { id: "pj-com-news", label: "Pearl Jam Oficial", group: "tenclub", url: "https://pearljam.com/news/", alwaysRelevant: true, kind: "pjcom-news" },

  // Reddit Search: captura posts sobre Pearl Jam em qualquer subreddit (r/music, r/alternativerock, etc.)
  // Complementa r/pearljam: pega anuncios, releases e discussoes que aparecem fora da comunidade dedicada.
  // Posts de r/pearljam sao filtrados no handler pra evitar overlap com community-fetch.mjs.
  { id: "reddit-search-pj", label: "Reddit Search (Pearl Jam)", group: "comunidade", url: "https://www.reddit.com/search.rss?q=%22Pearl+Jam%22&sort=top&t=week&limit=25", alwaysRelevant: true, kind: "reddit-search-rss" },
];

// Filtros especificos do Reddit pra cortar memes/shitposts:
export const REDDIT_FILTER = {
  minScore: 100,
  allowedFlairs: ["News", "Announcement", "Tour", "Setlist", "Concert", "Live"],
};
