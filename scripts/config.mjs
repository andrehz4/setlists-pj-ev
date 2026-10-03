// Configuração central do pipeline: domínio, APIs e caminhos. Tudo que for endereço ou versão mora aqui
// (antes estava espalhado em ~30 arquivos). Valores com env podem ser trocados no mock e nos testes.
import path from "node:path";
import { fileURLToPath } from "node:url";

// Raiz do repo, independente do diretório de onde o script roda. SMUFDPJ_RAIZ troca a raiz (testes em pasta temporária).
export const RAIZ = process.env.SMUFDPJ_RAIZ
  ? path.resolve(process.env.SMUFDPJ_RAIZ)
  : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const naRaiz = (...partes) => path.join(RAIZ, ...partes);

// Site
export const SITE_DOMINIO = "somaisumfadepearljam.com.br";
export const SITE_URL = process.env.SITE_BASE || `https://${SITE_DOMINIO}`;
export const linkNoticia = (id) => `${SITE_URL}/n/${id}`;

// Fórum (Railway). Os robôs mandam o Origin antigo de propósito (o backend aceita os dois).
export const FORUM_API = "https://perpetual-energy-production-1a69.up.railway.app";
export const ORIGIN_ROBOS = "https://setlists-pj-ev.pages.dev";

// Meta Graph API (Instagram e Facebook)
export const GRAPH_VERSAO = process.env.GRAPH_VERSAO || "v21.0";
export const GRAPH_IG = `https://graph.instagram.com/${GRAPH_VERSAO}`;
export const GRAPH_FB = `https://graph.facebook.com/${GRAPH_VERSAO}`;

// User-agent do robô de coleta (fontes que bloqueiam bot usam UA de navegador próprio, ver setlistfm.mjs)
export const UA_ROBO = `setlists-pj-news-bot/1.0 (+${SITE_URL})`;

// Estado do pipeline (media/news). Ler com lerEstado e gravar via commitAndPush (scripts/lib/).
export const NEWS_DIR = naRaiz("media/news");
export const ESTADO = {
  index: naRaiz("media/news/index.json"),
  pendentes: naRaiz("media/news/_pending.json"),
  fila: naRaiz("media/news/_publish-queue.json"),
  seen: naRaiz("media/news/seen.json"),
  denylist: naRaiz("media/news/_deleted-from-ig.json"),
  cooldown: naRaiz("media/news/_ig-cooldown.json"),
  logStory: naRaiz("media/news/instagram-stories/_story-log.json"),
  logReel: naRaiz("media/news/instagram-reels/_reel-log.json"),
};
