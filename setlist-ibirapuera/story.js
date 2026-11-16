// Story 1080x1920 pra postar: título do resultado no topo ("A SETLIST ANDRÉ"), a folha no meio e as cartas
// de sorte embaixo. Lê o que a tela de resultado já mostra (#r-show, #r-nome, #sorte), então fica igual ao site.
const W = 1080, H = 1920, M = 40;
const COR = { noite: '#0f0e0c', carta: 'rgba(28,25,20,.92)', linha: '#3a342b', texto: '#f3eee2', fraco: '#a59d8c', ouro: '#e8b04a', esc: '#1a1305' };
const DISP = '"Big Shoulders Display", Impact, sans-serif';
const CORPO = '"Instrument Sans", system-ui, sans-serif';
const $ = (s) => document.querySelector(s);

const carregar = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });

function caixa(c, x, y, w, h, r, cor, borda) {
  c.beginPath(); c.roundRect(x, y, w, h, r); c.fillStyle = cor; c.fill();
  if (borda) { c.strokeStyle = borda; c.lineWidth = 2; c.stroke(); }
}

// Texto com pedaços de estilos diferentes numa linha só; encolhe tudo até caber na largura.
function linha(c, x, y, pedacos, maxW, alinhar = 'left') {
  let esc = 1, w = 0;
  const medir = () => pedacos.reduce((s, p) => { c.font = p.fonte(esc); return s + c.measureText(p.t).width; }, 0);
  while ((w = medir()) > maxW && esc > 0.5) esc -= 0.04;
  let px = alinhar === 'right' ? x - w : alinhar === 'center' ? x - w / 2 : x;
  c.textAlign = 'left';
  for (const p of pedacos) { c.font = p.fonte(esc); c.fillStyle = p.cor; c.fillText(p.t, px, y - (p.dy || 0) * esc); px += c.measureText(p.t).width; }
}

// Converte o HTML de uma carta (<b>, <small>, <sup>) em pedaços pra linha().
function pedacos(el, base) {
  const out = [];
  el?.childNodes.forEach((n) => {
    const t = n.textContent.replace(/\s+/g, ' ');
    if (!t.trim() && !t.includes(' ')) return;
    const tag = n.nodeName;
    out.push(tag === 'B' ? { ...base.b, t } : tag === 'SMALL' ? { ...base.small, t } : tag === 'SUP' ? { ...base.sup, t } : { ...base.normal, t });
  });
  if (out.length) out[0].t = out[0].t.trimStart();
  return out;
}

const tamanho = (px, fam, peso) => (e) => `${peso} ${Math.round(px * e)}px ${fam}`;
const VAL = (cor, fraco, px) => ({ normal: { fonte: tamanho(px, DISP, 900), cor }, small: { fonte: tamanho(px * 0.45, DISP, 900), cor: fraco },
  sup: { fonte: tamanho(px * 0.5, DISP, 900), cor, dy: px * 0.4 }, b: { fonte: tamanho(px, DISP, 900), cor } });
const TXT = (cor, forte, px) => ({ normal: { fonte: tamanho(px, CORPO, 500), cor }, small: { fonte: tamanho(px, CORPO, 500), cor },
  sup: { fonte: tamanho(px, CORPO, 500), cor }, b: { fonte: tamanho(px, CORPO, 700), cor: forte } });

function rotulo(c, x, y, t, cor) {
  c.font = `700 20px ${CORPO}`; c.fillStyle = cor; c.textAlign = 'left';
  c.letterSpacing = '3px'; c.fillText(t.toUpperCase(), x, y); c.letterSpacing = '0px';
}

function cartaIndice(c, el, y, h) {
  caixa(c, M, y, W - 2 * M, h, 26, COR.ouro);
  const val = pedacos(el.querySelector('.val'), VAL(COR.esc, 'rgba(26,19,5,.55)', 120));
  linha(c, W - M - 30, y + 112, val, 300, 'right');
  rotulo(c, M + 30, y + 46, el.querySelector('.rot').textContent, 'rgba(26,19,5,.75)');
  linha(c, M + 30, y + 86, pedacos(el.querySelector('.txt'), TXT('rgba(26,19,5,.8)', COR.esc, 24)), 640);
  const larg = W - 2 * M - 60, pct = parseFloat(el.querySelector('.medidor i')?.style.width) || 0;
  caixa(c, M + 30, y + h - 34, larg, 12, 6, 'rgba(26,19,5,.18)');
  caixa(c, M + 30, y + h - 34, Math.max(12, larg * pct / 100), 12, 6, COR.esc);
}

function carta(c, el, x, y, w, h) {
  caixa(c, x, y, w, h, 22, COR.carta, COR.linha);
  rotulo(c, x + 26, y + 40, el.querySelector('.rot').textContent, COR.fraco);
  linha(c, x + 26, y + 98, pedacos(el.querySelector('.val'), VAL(COR.texto, COR.fraco, 58)), w - 52);
  linha(c, x + 26, y + h - 22, pedacos(el.querySelector('.txt'), TXT(COR.fraco, COR.texto, 22)), w - 52);
}

function titulo(c) {
  rotulo(c, M, 92, $('#r-show')?.textContent || 'Ibirapuera', COR.ouro);
  const h1 = $('#r-nome');
  const base = { normal: { fonte: tamanho(150, DISP, 900), cor: COR.texto }, b: { fonte: tamanho(150, DISP, 900), cor: COR.texto } };
  const ped = [...(h1?.childNodes || [])].map((n) => ({ ...(n.nodeName === 'EM' ? { ...base.normal, cor: COR.ouro } : base.normal), t: n.textContent.toUpperCase() }));
  if (ped.length) ped[0].t = ped[0].t.trimStart();
  linha(c, M - 4, 236, ped.length ? ped : [{ ...base.normal, t: 'A MINHA SETLIST' }], W - 2 * M);
}

function folhaNoMeio(c, folha, y, larg) {
  const alt = folha.height * (larg / folha.width), x = (W - larg) / 2;
  c.save(); c.translate(W / 2, y + alt / 2); c.rotate(-0.012); c.translate(-W / 2, -(y + alt / 2));
  c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 40; c.shadowOffsetY = 14;
  c.drawImage(folha, x, y, larg, alt); c.restore();
  c.fillStyle = 'rgba(222,205,160,.85)';
  for (const [fx, ang] of [[x + 50, -0.2], [x + larg - 150, 0.16]]) {
    c.save(); c.translate(fx + 50, y + 2); c.rotate(ang); c.fillRect(-55, -16, 110, 32); c.restore();
  }
  return y + alt;
}

export async function story(folha) {
  await Promise.all([`900 150px ${DISP}`, `700 20px ${CORPO}`, `500 22px ${CORPO}`].map((f) => document.fonts?.load(f).catch(() => {})));
  const s = document.createElement('canvas');
  s.width = W; s.height = H;
  const c = s.getContext('2d');
  c.fillStyle = COR.noite; c.fillRect(0, 0, W, H);
  const fundo = await carregar('fundo-eddie-quadro.jpg');
  if (fundo) {
    c.globalAlpha = 0.35; c.drawImage(fundo, -100, 0, 1280, 720); c.globalAlpha = 1;
    const g = c.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, 'rgba(15,14,12,.35)'); g.addColorStop(1, COR.noite);
    c.fillStyle = g; c.fillRect(0, 0, W, 720);
  }
  titulo(c);
  const fim = folhaNoMeio(c, folha, 286, 660);
  const cartas = [...document.querySelectorAll('#sorte .carta:not(.esqueleto)')];
  let y = fim + 34;
  const ind = cartas.find((el) => el.classList.contains('indice'));
  if (ind) { cartaIndice(c, ind, y, 150); y += 166; }
  const meio = cartas.filter((el) => !el.classList.contains('larga'));
  const w = (W - 2 * M - 16) / 2;
  meio.slice(0, 4).forEach((el, i) => carta(c, el, M + (i % 2) * (w + 16), y + Math.floor(i / 2) * 166, w, 150));
  y += Math.ceil(Math.min(meio.length, 4) / 2) * 166;
  const chance = cartas.find((el) => el.classList.contains('larga') && !el.classList.contains('indice'));
  if (chance && y + 150 < H - 66) carta(c, chance, M, y, W - 2 * M, 150);
  c.fillStyle = COR.fraco; c.textAlign = 'center'; c.font = `500 28px ${CORPO}`;
  c.fillText('Monte a sua: somaisumfadepearljam.com.br/setlist-ibirapuera', W / 2, H - 34);
  return s;
}
