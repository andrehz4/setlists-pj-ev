// Fontes de noticias do Pearl Jam.
// `alwaysRelevant: true` significa que toda noticia do feed eh relevante (canal dedicado);
// caso contrario o filtro de relevancia (regex PJ) eh aplicado no titulo+descricao.

// Fontes validadas em 2026-05-12. Removidos: pearljam.com/news/feed (XML invalido),
// brooklynvegan (403), whiplash (404 no /rss/news.xml), tenebrarum (DNS), tenho+discos (DNS),
// yt-pjvevo (channel_id errado). Tentar reativar quando achar URLs corretas.
//
// Revalidacao 2026-06-02: 4 URLs atualizadas pro destino canonico porque a antiga
// so respondia via redirect (risco de feed vazio em silencio): stereogum (www ->
// apex, sem barra final), pitchfork (/rss/news -> /feed/feed-news/rss), rolling-stone-br
// (uol.com.br -> rollingstone.com.br, mudou de dominio), cnn-br (www -> admin.).
// Removido oglobo-musica: feed praticamente morto (1 item, titulo vazio).

export const SOURCES = [
  // Midia EUA (feeds dedicados quando existem)
  { id: "stereogum-pj", label: "Stereogum", group: "us", url: "https://stereogum.com/tag/pearl-jam/feed", alwaysRelevant: true },
  { id: "consequence-pj", label: "Consequence", group: "us", url: "https://consequence.net/tag/pearl-jam/feed/", alwaysRelevant: true },
  { id: "nme-pj", label: "NME", group: "us", url: "https://www.nme.com/artists/pearl-jam/feed", alwaysRelevant: true },
  { id: "pitchfork-news", label: "Pitchfork", group: "us", url: "https://pitchfork.com/feed/feed-news/rss", alwaysRelevant: false },
  { id: "rollingstone-music", label: "Rolling Stone", group: "us", url: "https://www.rollingstone.com/music/music-news/feed/", alwaysRelevant: false },
  // Adicionadas 2026-06-02 (validadas ao vivo, deep-research). Genericas: feed
  // traz texto completo via content:encoded, filtro regex PJ aplica.
  { id: "spin-music", label: "SPIN", group: "us", url: "https://spinmagazine.com/feed/", alwaysRelevant: false },
  { id: "uproxx-music", label: "UPROXX Music", group: "us", url: "https://uproxx.com/music/feed/", alwaysRelevant: false },
  // Dedicada PJ (tag-feed): so excerto no RSS, o scrapeArticle puxa o corpo da pagina (igual portais BR).
  { id: "american-songwriter-pj", label: "American Songwriter (PJ)", group: "us", url: "https://americansongwriter.com/tag/pearl-jam/feed/", alwaysRelevant: true },

  // Midia BR. alwaysRelevant=false porque sao portais genericos: o filtro de
  // relevancia (regex PJ) corta o que nao for sobre a banda/integrantes/Ten Club.
  // Replicas de wire (AP/Reuters/press release) entre esses sites sao dedupadas
  // por similaridade de conteudo em dedupe.mjs antes do MAX_NEW_PER_RUN.
  { id: "folha-ilustrada", label: "Folha", group: "br", url: "https://feeds.folha.uol.com.br/ilustrada/rss091.xml", alwaysRelevant: false },
  { id: "rolling-stone-br", label: "Rolling Stone Brasil", group: "br", url: "https://rollingstone.com.br/feed/", alwaysRelevant: false },
  { id: "billboard-br", label: "Billboard Brasil", group: "br", url: "https://billboard.com.br/feed/", alwaysRelevant: false },
  { id: "cnn-br", label: "CNN Brasil", group: "br", url: "https://admin.cnnbrasil.com.br/feed/", alwaysRelevant: false },
  { id: "terra-musica", label: "Terra", group: "br", url: "https://www.terra.com.br/diversao/musica/rss.xml", alwaysRelevant: false },
  // Rock/musica dedicado (cobertura maior de PJ): mesmo assim filtro aplica
  // porque tambem cobrem outras bandas grandes
  { id: "igor-miranda", label: "Igor Miranda", group: "br", url: "https://igormiranda.com.br/feed/", alwaysRelevant: false },
  { id: "tenho-mais-discos", label: "Tenho Mais Discos Que Amigos", group: "br", url: "https://www.tenhomaisdiscosqueamigos.com/feed/", alwaysRelevant: false },
  { id: "wikimetal", label: "Wikimetal", group: "br", url: "https://www.wikimetal.com.br/feed/", alwaysRelevant: false },

  // Internacional. Idioma nao-PT/EN nao e problema: a curadoria (Sonnet) traduz.
  // Dedicadas PJ (tag-feed) trazem so excerto, o scrapeArticle puxa o corpo da pagina.
  // Adicionadas 2026-06-02 (validadas ao vivo, deep-research).
  { id: "rollingstone-de-pj", label: "Rolling Stone (DE, PJ)", group: "intl", url: "https://www.rollingstone.de/themen/pearl-jam/feed/", alwaysRelevant: true },
  { id: "musikexpress-pj", label: "Musikexpress (DE, PJ)", group: "intl", url: "https://www.musikexpress.de/tag/pearl-jam/feed/", alwaysRelevant: true },
  // America Latina + Espanha (base de fas gigante de PJ). Dedicadas via tag-feed.
  { id: "indiehoy-ar-pj", label: "Indie Hoy (AR, PJ)", group: "intl", url: "https://indiehoy.com/tag/pearl-jam/feed/", alwaysRelevant: true },
  { id: "mondosonoro-es-pj", label: "Mondo Sonoro (ES, PJ)", group: "intl", url: "https://www.mondosonoro.com/tag/pearl-jam/feed/", alwaysRelevant: true },
  // Genericas intl: texto completo no feed, filtro regex PJ aplica.
  { id: "visions-de", label: "Visions (DE)", group: "intl", url: "https://www.visions.de/feed/", alwaysRelevant: false },
  { id: "ondarock-it", label: "OndaRock (IT)", group: "intl", url: "https://www.ondarock.it/feed", alwaysRelevant: false },
  { id: "sopitas-mx", label: "Sopitas (MX)", group: "intl", url: "https://www.sopitas.com/feed/", alwaysRelevant: false },
  { id: "jenesaispop-es", label: "Jenesaispop (ES)", group: "intl", url: "https://jenesaispop.com/feed/", alwaysRelevant: false },
  // 2a passada 2026-06-02 (deep-research por mercado: turne setlist.fm + charts kworb).
  // Cobre lacunas geograficas reais: Chile, Australia, Mexico(reforco), Canada, UK.
  // Dedicadas PJ (tag-feed):
  { id: "irock-cl-pj", label: "iRock.CL (CL, PJ)", group: "intl", url: "https://www.irock.cl/tag/pearl-jam/feed/", alwaysRelevant: true },
  { id: "tonedeaf-au-pj", label: "Tone Deaf (AU, PJ)", group: "intl", url: "https://tonedeaf.thebrag.com/tag/pearl-jam/feed/", alwaysRelevant: true },
  { id: "monterrey-rock-pj", label: "Monterrey Rock (MX, PJ)", group: "intl", url: "https://monterreyrock.com/tag/pearl-jam/feed/", alwaysRelevant: true },
  // Genericas (texto/itens validados, filtro regex PJ):
  { id: "exclaim-ca", label: "Exclaim (CA)", group: "intl", url: "https://feeds.feedburner.com/NewsExclaimca", alwaysRelevant: false },
  { id: "loudersound-uk", label: "Louder (UK)", group: "intl", url: "https://www.loudersound.com/feeds.xml", alwaysRelevant: false },
  { id: "lineofbestfit-uk", label: "The Line of Best Fit (UK)", group: "intl", url: "https://www.thelineofbestfit.com/feed", alwaysRelevant: false },

  // Fan archives
  { id: "pjonline-it", label: "PJ Online IT", group: "fan", url: "https://www.pearljamonline.it/news/feed/", alwaysRelevant: true },
  // Red Mosquito: fan site classico de PJ (Blogger). Feed traz texto completo.
  { id: "red-mosquito", label: "Red Mosquito", group: "fan", url: "https://www.theskyiscrape.com/feeds/posts/default", alwaysRelevant: true },
  // Podcast dedicado a PJ (Acast). Feed de audio: o texto vem da descricao rica do episodio.
  { id: "solat-podcast", label: "State of Love & Trust (Podcast)", group: "fan", url: "https://feeds.acast.com/public/shows/5eb984087ddaae6f69daa3dc", alwaysRelevant: true },

  // Comunidade
  { id: "reddit-pj", label: "r/pearljam", group: "comunidade", url: "https://www.reddit.com/r/pearljam/hot.json?limit=25", alwaysRelevant: true, kind: "reddit" },

  // Oficial: news + loja (Shopify products.json). Tudo daqui e relevante.
  // Loja: produtos novos (Mirror Ball reissue, vinyl, boxset, etc) viram
  // noticia editorial via curador, nao ad de venda.
  { id: "pj-shop-featured", label: "Loja Pearl Jam", group: "tenclub", url: "https://shop.pearljam.com/collections/featured/products.json?limit=30", alwaysRelevant: true, kind: "shopify" },
  { id: "pj-shop-music", label: "Loja Pearl Jam", group: "tenclub", url: "https://shop.pearljam.com/collections/music/products.json?limit=30", alwaysRelevant: true, kind: "shopify" },
  // News oficial: RSS quebrado em 2026-05-12. Scraping do JSON inline no HTML.
  { id: "pj-com-news", label: "Pearl Jam Oficial", group: "tenclub", url: "https://pearljam.com/news/", alwaysRelevant: true, kind: "pjcom-news" },

  // Turne: setlists dos shows via setlist.fm API (precisa do secret SETLISTFM_API_KEY).
  // Cada show recente vira materia com o setlist completo (preText). Dormante fora de
  // turne (filtra shows dos ultimos 45 dias); em turne, cada show novo vira candidato.
  // O handler manda User-Agent de browser porque o setlist.fm bloqueia UA de bot (403).
  { id: "setlistfm-pj", label: "Setlist.fm", group: "turne", url: "https://api.setlist.fm/rest/1.0/artist/83b9cbe7-9857-49e2-ab8e-b57b01038103/setlists?p=1", alwaysRelevant: true, kind: "setlistfm" },

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
