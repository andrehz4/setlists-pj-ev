// API FALSA do painel de colaboradores, só pra ver as telas em localhost.
// Uso: node colab/dev/mock-api.mjs  (porta 8799) + servir a raiz do repo em outra porta.
// Sessão de dev: no console do navegador,
//   localStorage.contrib_sessao = '{"token":"dev","status":"aprovado","admin":true,"nome":"Andre HZ"}'
import http from "node:http";

const PORTA = 8799;
const agora = () => new Date().toISOString();
const slot = () => { const d = new Date(); d.setUTCMinutes(0, 0, 0); d.setUTCHours(d.getUTCHours() + 1, 30); return d; };
const rotulo = (d) => `${(d.getUTCHours() + 21) % 24}h${String(d.getUTCMinutes()).padStart(2, "0")}`;
const FALAS = [
  "Em agosto de 1991 saiu o Ten.",
  "Pouca gente lembra, mas a banda se chamava Mookie Blaylock.",
  "O nome veio de um jogador de basquete.",
  "E o disco levou quase um ano pra estourar.",
];
const envios = [
  { id: "a1", status: "publicado", title: "Minha fita do show de 2005 no Pacaembu", body: "x", media: [{ key: "a.jpg", url: null }], scheduled_at: "2026-09-24T23:30:00Z", scheduled_label: "20h30", reason: null, created_at: "2026-09-24T22:00:00Z" },
  { id: "a2", status: "ajustado", title: "Por que Yield é o disco mais subestimado", body: "x", media: [{ key: "b.jpg", url: null }], scheduled_at: "2026-09-22T14:30:00Z", scheduled_label: "11h30", reason: "Corrigimos o ano de lançamento (1998) e dois erros de digitação.", created_at: "2026-09-22T13:40:00Z" },
  { id: "a3", status: "recusado", title: "Black ao vivo cantado pela plateia", body: "x", media: [{ key: "c.mp4", url: null }], scheduled_at: "2026-09-20T19:30:00Z", scheduled_label: "16h30", reason: "O vídeo tem a música do show tocando no fundo (regra de ouro 1). Grave de novo só com a sua voz e reenvie.", created_at: "2026-09-20T18:10:00Z" },
];
const membros = [
  { id: "m1", email: "marina.tavares@gmail.com", nome: "Marina Tavares", avatar: null, status: "pendente", pedido_em: agora(), decidido_em: null, entrou: true },
  { id: "m2", email: "rafael.couto.pj@gmail.com", nome: null, avatar: null, status: "aprovado", pedido_em: agora(), decidido_em: agora(), entrou: false },
];

function legendaFalsa() {
  let t = 0.4;
  return FALAS.map((txt, i) => {
    const ws = txt.split(" ").map((w) => { const p = { w, s: +t.toFixed(2), e: +(t + 0.38).toFixed(2) }; t += 0.42; return p; });
    const tr = { start: ws[0].s, end: ws.at(-1).e, text: txt, words: ws, duvida: i === 2 };
    t += 0.5;
    return tr;
  });
}

const rotas = {
  "GET /contrib/config": () => ({ enabled: true, video_enabled: true, daily_limit: 2, max_fotos: 10, mimes: [], max_video_seg: 90, google_client_id: "", legenda_auto: true }),
  "GET /contrib/eu": () => ({ status: "aprovado", admin: true, nome: "Andre HZ", avatar: null }),
  "POST /contrib/legenda": () => ({ trechos: legendaFalsa() }),
  "POST /contrib/uploads": (b) => ({ key: `contrib/x/${Date.now()}.${b.mime.split("/")[1]}`, upload_url: `http://127.0.0.1:${PORTA}/put`, headers: { "Content-Type": b.mime }, expires_in: 900 }),
  "POST /contrib/submissions": (b) => { const s = slot(); const e = { id: "n" + Date.now(), status: "enviado", title: b.title, body: b.body, media: b.media_keys.map((key) => ({ key, url: null })), scheduled_at: s.toISOString(), scheduled_label: rotulo(s), reason: null, created_at: agora(), video: b.video || null }; envios.unshift(e); console.log("ENVIO", JSON.stringify(b).slice(0, 400)); return e; },
  "POST /contrib/perfil": (b) => ({ instagram: String(b.instagram || "").replace(/^@/, "").toLowerCase() || null }),
  "GET /contrib/submissions/mine": () => envios,
  "GET /contrib/admin/membros": () => membros,
  "POST /contrib/admin/membros": (b) => { const m = membros.find((x) => x.email === b.email); if (m) m.status = b.status; else membros.push({ id: "m" + Date.now(), email: b.email, nome: null, status: b.status, pedido_em: agora(), entrou: false }); return b; },
  "GET /contrib/admin/submissions": () => envios.map((e) => ({ ...e, nome: "Marina Tavares", email: "marina.tavares@gmail.com" })),
};

http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.end();
  const partes = [];
  for await (const p of req) partes.push(p);
  const bruto = Buffer.concat(partes);
  if (req.method === "PUT") return setTimeout(() => res.end(), 400);
  if (req.method === "DELETE") { const e = envios.find((x) => req.url.endsWith(x.id)); if (e) e.status = "cancelado"; return res.end("{}"); }
  const rota = rotas[`${req.method} ${req.url.split("?")[0]}`];
  if (!rota) { res.statusCode = 404; return res.end('{"detail":"rota falsa inexistente"}'); }
  let corpo = {};
  try { corpo = JSON.parse(bruto.toString() || "{}"); } catch (_) { /* áudio da legenda */ }
  const atraso = req.url.includes("legenda") ? 1500 : 150;
  setTimeout(() => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(rota(corpo))); }, atraso);
}).listen(PORTA, () => console.log(`API falsa do painel em http://127.0.0.1:${PORTA}`));
