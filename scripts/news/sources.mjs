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

  // Midia BR
  { id: "folha-ilustrada", label: "Folha", group: "br", url: "https://feeds.folha.uol.com.br/ilustrada/rss091.xml", alwaysRelevant: false },

  // Fan archives
  { id: "pjonline-it", label: "PJ Online IT", group: "fan", url: "https://www.pearljamonline.it/news/feed/", alwaysRelevant: true },

  // Comunidade
  { id: "reddit-pj", label: "r/pearljam", group: "comunidade", url: "https://www.reddit.com/r/pearljam/hot.json?limit=25", alwaysRelevant: true, kind: "reddit" },
];

// Filtros especificos do Reddit pra cortar memes/shitposts:
export const REDDIT_FILTER = {
  minScore: 100,
  allowedFlairs: ["News", "Announcement", "Tour", "Setlist", "Concert", "Live"],
};
