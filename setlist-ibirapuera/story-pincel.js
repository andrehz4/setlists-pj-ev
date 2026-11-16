// Pincéis do story (foto e vídeo): cores, fontes, caixa arredondada, texto em pedaços com estilos e quebra de linha.
export const W = 1080, H = 1920, M = 40;
export const COR = { noite: '#0f0e0c', carta: 'rgba(28,25,20,.94)', linha: '#3a342b', texto: '#f3eee2', fraco: '#a59d8c',
  ouro: '#e8b04a', esc: '#1a1305', tinta: '#b8321f' };
export const DISP = '"Big Shoulders Display", Impact, sans-serif';
export const CORPO = '"Instrument Sans", system-ui, sans-serif';

export const carregar = (src) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = src; });
export const fontes = () => Promise.all([`900 150px ${DISP}`, `700 20px ${CORPO}`, `500 22px ${CORPO}`, `700 22px ${CORPO}`]
  .map((f) => document.fonts?.load(f).catch(() => {})));

export function tela(w, h) {
  const s = document.createElement('canvas');
  s.width = Math.ceil(w); s.height = Math.ceil(h);
  return s;
}

export function caixa(c, x, y, w, h, r, cor, borda, esp = 2) {
  // iOS < 16 não tem roundRect: cai pra retângulo reto
  c.beginPath(); if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
  if (cor) { c.fillStyle = cor; c.fill(); }
  if (borda) { c.strokeStyle = borda; c.lineWidth = esp; c.stroke(); }
}

// Texto com pedaços de estilos diferentes numa linha só; encolhe tudo até caber na largura.
export function linha(c, x, y, pedacos, maxW, alinhar = 'left') {
  let esc = 1, w = 0;
  const medir = () => pedacos.reduce((s, p) => { c.font = p.fonte(esc); return s + c.measureText(p.t).width; }, 0);
  while ((w = medir()) > maxW && esc > 0.5) esc -= 0.04;
  let px = alinhar === 'right' ? x - w : alinhar === 'center' ? x - w / 2 : x;
  c.textAlign = 'left';
  for (const p of pedacos) { c.font = p.fonte(esc); c.fillStyle = p.cor; c.fillText(p.t, px, y - (p.dy || 0) * esc); px += c.measureText(p.t).width; }
}

// Quebra os pedaços em até maxLinhas linhas (palavra por palavra); o que sobrar vai pra última, que encolhe.
export function quebrar(c, x, y, pedacos, maxW, entre, maxLinhas = 2) {
  const linhas = [[]];
  let w = 0;
  for (const p of pedacos) {
    for (const t of p.t.split(/(?=\s)/)) {
      c.font = p.fonte(1);
      const tw = c.measureText(t).width;
      if (w + tw > maxW && w > 0 && linhas.length < maxLinhas) { linhas.push([]); w = 0; }
      const fim = linhas.at(-1);
      fim.push({ ...p, t: fim.length ? t : t.trimStart() });
      w += tw;
    }
  }
  linhas.forEach((l, i) => linha(c, x, y + i * entre, l, maxW));
  return linhas.length;
}

// Converte o HTML de uma carta (<b>, <small>, <sup>) em pedaços pra linha().
export function pedacos(el, base, pular = '') {
  const out = [];
  el?.childNodes.forEach((n) => {
    const t = n.textContent.replace(/\s+/g, ' ');
    const tag = n.nodeName;
    if ((!t.trim() && !t.includes(' ')) || tag === pular) return;
    out.push(tag === 'B' ? { ...base.b, t } : tag === 'SMALL' ? { ...base.small, t } : tag === 'SUP' ? { ...base.sup, t } : { ...base.normal, t });
  });
  if (out.length) out[0].t = out[0].t.trimStart();
  return out;
}

export const tamanho = (px, fam, peso) => (e) => `${peso} ${Math.round(px * e)}px ${fam}`;
export const VAL = (cor, fraco, px) => ({ normal: { fonte: tamanho(px, DISP, 900), cor }, small: { fonte: tamanho(px * 0.45, DISP, 900), cor: fraco },
  sup: { fonte: tamanho(px * 0.5, DISP, 900), cor, dy: px * 0.4 }, b: { fonte: tamanho(px, DISP, 900), cor } });
export const TXT = (cor, forte, px) => ({ normal: { fonte: tamanho(px, CORPO, 500), cor }, small: { fonte: tamanho(px, CORPO, 500), cor },
  sup: { fonte: tamanho(px, CORPO, 500), cor }, b: { fonte: tamanho(px, CORPO, 700), cor: forte } });

export function rotulo(c, x, y, t, cor, px = 20) {
  c.font = `700 ${px}px ${CORPO}`; c.fillStyle = cor; c.textAlign = 'left';
  c.letterSpacing = '3px'; c.fillText(t.toUpperCase(), x, y); c.letterSpacing = '0px';
}
