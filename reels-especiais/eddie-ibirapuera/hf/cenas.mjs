// Cenas do reel "As 5 músicas que o Eddie Vedder sempre toca" (roteiro v7).
// Cada cena vira uma sub-composição em compositions/<id>.html, gerada por montar.mjs.
// Tempos locais (segundos dentro da cena) seguem a fala, medida por transcrição palavra a palavra.

const FP = '../assets/fonts';
const IMG = '../assets/fotos';

export const COR = {
  bg: '#0b0b0c', ink: '#f4efe6', verde: '#39e07a', ouro: '#f6c445',
  verm: '#ff3b30', amar: '#ffd60a', lar: '#ff8a1f',
};
const { ink, verde, ouro, verm, amar, lar } = COR;

// ---------- CSS comum (escopado pelo root de cada cena) ----------
const fontes = `
@font-face{font-family:Anton;src:url(${FP}/Anton-Regular.ttf)}
@font-face{font-family:InterX;src:url(${FP}/Inter-ExtraBold.ttf)}
@font-face{font-family:InterS;src:url(${FP}/Inter-SemiBold.ttf)}
@font-face{font-family:Mono;src:url(${FP}/JetBrainsMono-ExtraBold.ttf)}
@font-face{font-family:Marker;src:url(${FP}/PermanentMarker-Regular.ttf)}`;

const css = (id) => {
  const r = `#${id}-root`;
  return `${fontes}
${r}{position:absolute;inset:0;overflow:hidden;color:${ink};font-family:InterX,sans-serif}
${r} .st{position:absolute;inset:0}
${r} .a{position:absolute}
${r} .h{opacity:0}
${r} .anton{font-family:Anton,sans-serif;line-height:.92;letter-spacing:.005em;white-space:nowrap}
${r} .ix{font-family:InterX,sans-serif}
${r} .is{font-family:InterS,sans-serif}
${r} .mono{font-family:Mono,monospace;letter-spacing:.02em}
${r} .sh{text-shadow:0 6px 26px rgba(0,0,0,.85),0 2px 0 rgba(0,0,0,.6)}
${r} .row{display:flex;gap:24px}
${r} .dot{width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.45);border:5px solid rgba(244,239,230,.3);box-shadow:0 0 0px rgba(0,0,0,0)}
${r} .rl{font-family:Mono,monospace;font-size:28px;color:rgba(244,239,230,.85);white-space:nowrap}
${r} .chip{font-family:InterX,sans-serif;font-size:32px;padding:8px 18px;border-radius:10px;color:#0b0b0c;white-space:nowrap}
${r} .stamp{font-family:Marker,cursive;line-height:1.05;padding:4px 30px 0;border-radius:18px;border:10px solid;background:rgba(11,11,12,.55);white-space:nowrap;text-align:center}
${r} .card{border-radius:22px}
${r} .face{position:absolute;inset:0;border-radius:22px;display:flex;align-items:center;justify-content:center;backface-visibility:hidden}
${r} .back{background:#141414}
${r} .front{background:${ink};color:#0b0b0c;box-shadow:0 30px 60px rgba(0,0,0,.6)}
${r} .foto{overflow:hidden;border:10px solid ${ink};box-shadow:0 24px 50px rgba(0,0,0,.7);background:#222}
${r} .foto img,${r} .bgf img{width:100%;height:100%;object-fit:cover;display:block}
${r} .bgf{position:absolute;inset:0;overflow:hidden}
${r} .panel{border-radius:20px;overflow:hidden}`;
};

// ---------- JS comum (inline em cada cena) ----------
const helpers = `
const root=document.getElementById(ID+'-root');
const q=s=>root.querySelector(s), qa=s=>Array.from(root.querySelectorAll(s));
const tl=gsap.timeline({paused:true});
const st=q('.st'); const F=1/30;
function inn(el,t,from,d,ease){tl.fromTo(el,Object.assign({opacity:0},from),{opacity:1,x:0,y:0,scale:1,duration:d||0.32,ease:ease||'expo.out',immediateRender:false},t);}
function slam(el,t,s,d){inn(el,t,{scale:s||2.2},d||0.26,'expo.out');}
function pop(el,t,d){inn(el,t,{scale:0.3},d||0.38,'back.out(2.4)');}
function fromL(el,t,d){inn(el,t,{x:-1100},d||0.34);}
function fromR(el,t,d){inn(el,t,{x:1100},d||0.34);}
function fromB(el,t,d){inn(el,t,{y:420},d||0.34);}
function fromT(el,t,d){inn(el,t,{y:-700},d||0.4,'bounce.out');}
function out(el,t,d){tl.to(el,{opacity:0,duration:d||0.18,ease:'power1.in'},t);}
function shake(el,t,a,n){a=a||16;n=n||5;for(let i=0;i<n;i++){const k=(n-i)/n;tl.to(el,{x:(i%2?-a:a)*k,y:((i%3)-1)*a*0.6*k,duration:F,ease:'none'},t+i*F);}tl.to(el,{x:0,y:0,duration:F,ease:'none'},t+n*F);}
function tranco(t,a){shake(st,t,a||18);}
function punch(t,s){tl.fromTo(st,{scale:s||1.05},{scale:1,duration:0.3,ease:'power2.out',immediateRender:false},t);}
function count(el,a,b,t,d,ease){const o={v:a};tl.to(o,{v:b,duration:d,ease:ease||'power2.out',onUpdate:()=>{el.textContent=String(Math.round(o.v));}},t);}
function light(ds,t,s,col){ds.forEach((d,i)=>{const u=t+i*s;tl.to(d,{backgroundColor:col,borderColor:col,boxShadow:'0 0 34px '+col,duration:0.1,ease:'none'},u);tl.fromTo(d,{scale:1.7},{scale:1,duration:0.3,ease:'back.out(3)',immediateRender:false},u);});}
function dim(ds,t,s){ds.forEach((d,i)=>{const u=t+i*s;tl.to(d,{backgroundColor:'rgba(0,0,0,0.45)',borderColor:'rgba(244,239,230,0.3)',boxShadow:'0 0 0px rgba(0,0,0,0)',duration:0.14,ease:'none'},u);tl.fromTo(d,{scale:0.6},{scale:1,duration:0.25,ease:'back.out(2)',immediateRender:false},u);});}
function recolor(els,t,col){els.forEach(e=>tl.to(e,{color:col,duration:0.2,ease:'none'},t));}
function stamp(el,t,rot){rot=rot||-9;tl.fromTo(el,{opacity:0,scale:3,rotation:rot-12},{opacity:1,scale:1,rotation:rot,duration:0.18,ease:'power4.in',immediateRender:false},t);tranco(t+0.18,26);let i=0;for(let u=t+0.32;u<D-0.07;u+=0.07,i++){tl.to(el,{rotation:rot+(i%2?1.5:-1.5),x:((i%3)-1)*4,duration:0.07,ease:'none'},u);}}
function flip(card,t){const b=card.querySelector('.back'),f=card.querySelector('.front');tl.to(b,{rotationY:90,transformPerspective:1600,duration:0.12,ease:'power2.in'},t);tl.fromTo(f,{opacity:1,rotationY:-90,transformPerspective:1600},{rotationY:0,duration:0.34,ease:'back.out(1.8)',immediateRender:false},t+0.12);tranco(t+0.34,14);}
function kb(el,s0,s1,x1){tl.fromTo(el,{scale:s0||1.06,x:0},{scale:s1||1.2,x:x1===undefined?-30:x1,duration:D,ease:'none',immediateRender:false},0);}
function entrada(){tl.fromTo(st,{scale:1.08},{scale:1,duration:0.3,ease:'expo.out',immediateRender:false},0);}
`;

// ---------- peças de HTML ----------
const DOT_L = 101; // régua centrada na faixa útil (70 a 900)
const fila = (cls0, top, n, label) => {
  const [cls, h] = cls0.split(' ');
  return (label ? `<div class="a rl ${cls}-l ${h || ''}" style="left:${DOT_L}px;top:${top - 40}px">${label}</div>` : '') +
  `<div class="a row ${cls} ${h || ''}" style="left:${DOT_L}px;top:${top}px">${'<div class="dot"></div>'.repeat(n)}</div>`;
};

const card = (top, num, song, fs, ac, extra = '') => `
<div class="a card" style="left:70px;top:${top}px;width:830px;height:340px">
  <div class="face back" style="border:6px solid ${ac}"><span class="anton" style="font-size:280px;color:${ac}">${num}</span></div>
  <div class="face front h"><div class="a mono" style="left:30px;top:22px;font-size:26px;color:rgba(11,11,12,.6)">Nº ${num}</div><span class="anton" style="font-size:${fs}px">${song}</span>${extra}</div>
</div>`;

const foto = (cls, src, l, t, w, h) =>
  `<div class="a foto ${cls}" style="left:${l}px;top:${t}px;width:${w}px;height:${h}px"><img class="kbi" src="${IMG}/${src}.jpg" alt=""></div>`;

const bgFoto = (src, op) =>
  `<div class="bgf" style="opacity:${op}"><img class="bgi" src="${IMG}/${src}.jpg" alt=""></div>
   <div class="bgf" style="background:linear-gradient(180deg,rgba(11,11,12,.7),rgba(11,11,12,.25) 45%,rgba(11,11,12,.8))"></div>`;

const carimbo = (cls, txt, cor, fs, l, t) =>
  `<div class="a stamp ${cls} h" style="left:${l}px;top:${t}px;font-size:${fs}px;color:${cor};border-color:${cor}">${txt}</div>`;

const songFs = (s, max = 170, w = 730) => Math.min(max, Math.floor(w / (s.length * 0.5)));

// ---------- molde das 5 certas ----------
function certa(o) {
  const { pos, song, ac, foto: fsrc, rows17 } = o;
  const fs = o.fs || songFs(song);
  const extra = o.cardChip ? `<div class="a chip" style="right:24px;bottom:22px;background:${ouro}">${o.cardChip}</div>` : '';
  const y9 = 1040, yBr = 1170;
  const cntTop = rows17 ? 1252 : 1126; const cfs = rows17 ? 150 : 170;
  const html = `
${foto('pol', fsrc, 606, 252, 290, 300)}
<div class="a anton sh badge" style="left:62px;top:226px;font-size:260px;color:${ac}">${pos}</div>
${o.badgeNext ? `<div class="a anton sh badge2 h" style="left:62px;top:226px;font-size:260px;color:${verde}">${o.badgeNext}</div>` : ''}
<div class="a ix sh kick" style="left:250px;top:300px;font-size:36px;color:${ac};letter-spacing:.1em">NÚMERO ${pos}</div>
<div class="a is sh kick2" style="left:250px;top:350px;font-size:30px">das 5 certas</div>
${card(600, pos, song, fs, ac, extra)}
${fila('r9', y9, 9, 'DESDE 2023 · 9 SHOWS SOLO')}
${rows17 ? fila('rbr h', yBr, 8, 'BRASIL · 2014 E 2018') : ''}
<div class="a anton sh cnt h" style="left:70px;top:${cntTop}px;font-size:${cfs}px;color:${ac}"><span class="n">${o.cntFrom ?? 9}</span> DE ${o.cntDe ?? 9}</div>
${o.cnt2 ? `<div class="a anton sh cnt2 h" style="left:70px;top:${cntTop}px;font-size:${cfs}px;color:${ouro}"><span class="n">9</span> DE 17</div>` : ''}
${o.brChip ? `<div class="a chip brchip h" style="left:560px;top:${yBr - 50}px;background:${ouro}">BRASIL: 8 DE 8</div>` : ''}
<div class="a is sh sub h" style="left:72px;top:${cntTop + cfs}px;font-size:34px">${o.sub}</div>
${carimbo('certa', 'CERTA', ouro, 92, 540, 850)}`;
  return { html, js: o.js };
}

// ---------- cenas ----------
export const CENAS = {
  c1: { tint: '#d9a640', build: () => ({
    html: `
<div class="a anton sh as" style="left:70px;top:262px;font-size:96px">AS</div>
<div class="a anton sh cinco" style="left:46px;top:384px;font-size:760px;line-height:.8;color:${ouro}">5</div>
<div class="a tit" style="left:478px;top:370px;width:430px">
  ${['MÚSICAS', 'QUE O', 'EDDIE', 'VEDDER', 'SEMPRE', 'TOCA'].map((w, i) => `<div class="anton sh w${i}" style="font-size:100px;line-height:.96">${w}</div>`).join('')}
</div>
<div class="a bar h" style="left:478px;top:960px;width:330px;height:12px;background:${ouro};transform-origin:left center"></div>
<div class="a anton slab" style="left:70px;top:1010px;font-size:74px;line-height:1.12;padding:2px 20px 0;background:${verm};color:${ink}">BEST OF BLUES AND ROCK</div>
<div class="a ix sh ibi" style="left:72px;top:1112px;font-size:46px">IBIRAPUERA · 20 E 22/11</div>
${[5, 4, 3, 2, 1].map((n, i) => `<div class="a fan f${i} h" style="left:${86 + i * 106}px;top:1200px;width:98px;height:140px;border-radius:12px;background:#141414;border:5px solid ${ouro};display:flex;align-items:center;justify-content:center"><span class="anton" style="font-size:90px;color:${ouro}">${n}</span></div>`).join('')}
<div class="a is sh palp" style="left:72px;top:1372px;font-size:27px;color:rgba(244,239,230,.9)">palpite pelo histórico, não é setlist oficial</div>
<svg class="a cpring" style="left:626px;top:1064px;width:336px;height:410px;overflow:visible" viewBox="0 0 410 450" preserveAspectRatio="none"><path vector-effect="non-scaling-stroke" pathLength="1" d="M60 95 C120 20 300 10 360 90 C415 170 400 330 330 400 C250 465 110 450 55 380 C5 310 10 170 75 80 C95 55 130 40 160 38" fill="none" stroke="${ouro}" stroke-width="9" stroke-linecap="round" stroke-dasharray="1" stroke-dashoffset="1"/></svg>
${[[612, 1070, 48, 0.62], [900, 1100, 38, 0.74], [618, 1408, 40, 2.78], [890, 1428, 52, 2.86], [902, 1262, 34, 4.02]].map(([l, t, fs, at], i) => `<div class="a spk spk${i}" data-at="${at}" style="left:${l}px;top:${t}px;font-size:${fs}px;color:${ouro};opacity:0;text-shadow:0 0 18px rgba(240,190,70,.8)">✦</div>`).join('')}
<div class="a capol" style="left:652px;top:1112px;width:250px;padding:12px 12px 0;background:#f4efe6;box-shadow:0 18px 40px rgba(0,0,0,.6);transform:rotate(6deg)">
  <div style="position:absolute;left:-26px;top:-14px;width:96px;height:30px;background:rgba(240,225,170,.75);transform:rotate(-32deg)"></div><div style="position:absolute;right:-26px;top:-14px;width:96px;height:30px;background:rgba(240,225,170,.75);transform:rotate(30deg)"></div>
  <div style="width:226px;height:236px;overflow:hidden"><img class="cpi" src="${IMG}/eddie-rosto-2018.jpg" alt="" style="width:100%;height:100%;object-fit:cover;object-position:50% 40%"></div>
  <div style="font-family:Marker,cursive;color:#0b0b0c;font-size:33px;line-height:1;text-align:center;padding:12px 0 14px">EDDIE VEDDER</div>
</div>`,
    js: `
tl.fromTo(q('.cinco'),{scale:1.06},{scale:1,duration:0.35,ease:'power2.out',immediateRender:false},0.15);
recolor([q('.w2')],1.38,'${ouro}'); recolor([q('.w3')],1.77,'${ouro}');
tl.fromTo(q('.w2'),{scale:1.25},{scale:1,duration:0.25,ease:'back.out(3)',immediateRender:false},1.38);
tl.fromTo(q('.w3'),{scale:1.25},{scale:1,duration:0.25,ease:'back.out(3)',immediateRender:false},1.77);
punch(0.54,1.03);
tl.fromTo(q('.bar'),{opacity:1,scaleX:0},{scaleX:1,duration:0.3,ease:'expo.out',immediateRender:false},2.25);
qa('.fan').forEach((f,i)=>{tl.fromTo(f,{opacity:0,y:420,rotation:0},{opacity:1,y:0,rotation:(i-2)*7,duration:0.36,ease:'back.out(1.8)',immediateRender:false},2.3+i*0.07);});
punch(2.75,1.04);
shake(q('.slab'),3.33,10);
tl.to(q('.slab'),{backgroundColor:'${ouro}',color:'#0b0b0c',duration:0.08,ease:'none'},4.0);
tl.fromTo(q('.slab'),{scale:1.12},{scale:1,duration:0.3,ease:'back.out(3)',immediateRender:false},4.0);
tranco(4.0,12);
qa('.fan').forEach((f,i)=>{tl.to(f,{y:-26,duration:0.12,yoyo:true,repeat:1,ease:'power2.out'},4.5+i*0.06);});
tl.to(q('.cinco'),{scale:1.1,duration:0.3,ease:'power2.in'},D-0.3);
tl.fromTo(q('.cpi'),{scale:1.04},{scale:1.16,duration:D,ease:'none',immediateRender:false},0);
tl.fromTo(q('.capol'),{rotation:6},{rotation:3,duration:0.3,ease:'back.out(3)',immediateRender:false},2.75);
tl.to(q('.cpring path'),{attr:{'stroke-dashoffset':0},duration:0.55,ease:'power2.inOut'},0.3);
tl.fromTo(q('.cpring'),{scale:1},{scale:1.05,duration:0.15,yoyo:true,repeat:1,ease:'power2.out',transformOrigin:'50% 50%',immediateRender:false},2.75);
qa('.spk').forEach((e)=>{const at=+e.dataset.at;tl.fromTo(e,{opacity:0,scale:0,rotation:-60},{opacity:1,scale:1.3,rotation:0,duration:0.18,ease:'back.out(3)',immediateRender:false},at);tl.to(e,{opacity:0,scale:0.4,rotation:40,duration:0.35,ease:'power2.in'},at+0.45);});
for(let u=0.2;u<D-0.4;u+=1.2){tl.to(q('.capol'),{y:-8,duration:0.6,yoyo:true,repeat:1,ease:'sine.inOut'},u);}`,
  }) },

  c2: { tint: '#4fbf7a', build: () => ({
    html: `
${bgFoto('ohanasep18-148', 0.45)}
<div class="a ix sh k h" style="left:72px;top:268px;font-size:40px;color:${verde};letter-spacing:.14em">O CRITÉRIO</div>
<div class="a anton sh l1 h" style="left:70px;top:326px;font-size:128px">TOCOU NOS</div>
<div class="a anton sh l2 h" style="left:70px;top:448px;font-size:128px"><span style="color:${verde}">9</span> SHOWS SOLO</div>
<div class="a anton sh l3 h" style="left:70px;top:570px;font-size:128px">DESDE 2023</div>
<div class="a mono sh per h" style="left:72px;top:712px;font-size:28px;color:rgba(244,239,230,.9)">fev/2023 a abr/2026</div>
${['TEMPE 2023', 'SEATTLE 2023', 'SEATTLE 2023', 'SEATTLE 2024', 'VANCOUVER 2025', 'JAPÃO 2026', 'JAPÃO 2026', 'JAPÃO 2026', 'JAPÃO 2026'].map((c, i) => `<div class="a anton sh city c${i} h" style="left:${DOT_L}px;top:830px;font-size:74px;color:${verde}">${c}</div>`).join('')}
${fila('r9 h', 950, 9)}
<div class="a rl" style="left:${DOT_L}px;top:1026px">fev/2023</div><div class="a rl" style="left:760px;top:1026px">abr/2026</div>
<div class="a anton sh cnt h" style="left:70px;top:1090px;font-size:220px;color:${verde}">9 DE 9</div>`,
    js: `
kb(q('.bgi'),1.08,1.22,-40); entrada();
slam(q('.k'),0.02,1.6); fromL(q('.l1'),0.1); fromR(q('.l2'),0.62); fromL(q('.l3'),1.2); inn(q('.per'),1.45,{y:20},0.3);
pop(q('.r9'),1.4,0.3);
const cs=qa('.city'), ds=qa('.r9 .dot'); const t0=1.65, s=0.19;
light(ds,t0,s,'${verde}');
cs.forEach((c,i)=>{inn(c,t0+i*s,{y:30},0.12); if(i<8) out(c,t0+(i+1)*s-0.02,0.06);});
punch(1.65,1.04); out(cs[8],3.4,0.1);
slam(q('.cnt'),3.42,2.4); tranco(3.62,20);`,
  }) },

  c3: { tint: '#4fbf7a', build: () => certa({
    pos: 5, song: 'BETTER MAN', ac: verde, foto: 'ohanasep18-159', badgeNext: '4',
    sub: '14 de 17 contando o Brasil',
    js: `
entrada(); slam(q('.badge'),0,2.6,0.24); pop(q('.kick'),0.1); pop(q('.kick2'),0.16);
inn(q('.pol'),0.12,{x:500},0.35); tl.fromTo(q('.pol'),{rotation:14},{rotation:5,duration:0.4,ease:'back.out(2)',immediateRender:false},0.12); kb(q('.pol .kbi'));
fromB(q('.card'),0.0,0.28); flip(q('.card'),0.92);
light(qa('.r9 .dot'),1.7,0.035,'${verde}'); punch(1.7);
slam(q('.cnt'),2.08,2.2); inn(q('.sub'),2.2,{y:20},0.2); stamp(q('.certa'),2.3,-8);
tl.to(q('.badge'),{rotationX:90,transformPerspective:900,duration:0.14,ease:'power2.in'},2.45);
tl.fromTo(q('.badge2'),{opacity:1,rotationX:-90,transformPerspective:900},{rotationX:-25,duration:0.12,ease:'power2.out',immediateRender:false},2.59);`,
  }) },

  c4: { tint: '#e0483c', build: () => ({
    html: `
<div class="a anton sh q1 h" style="left:70px;top:262px;font-size:96px">MAS E A</div>
<div class="a anton sh q2 h" style="left:66px;top:356px;font-size:236px;color:${verm}">SIRENS?</div>
<div class="a chip ped h" style="left:70px;top:620px;background:${verm};color:${ink}">10 PEDIDOS</div>
${carimbo('esq', 'ESQUECE', verm, 120, 380, 590)}
${fila('r9 h', 850, 9, 'DESDE 2023')}
${fila('rbr h', 966, 8, 'BRASIL')}
<div class="a anton sh zero h" style="left:70px;top:1070px;font-size:380px;color:${verm}">0</div>
<div class="a anton sh de h" style="left:330px;top:1110px;font-size:150px">DE 17</div>
<div class="a anton sh ss h" style="left:334px;top:1260px;font-size:76px;color:rgba(244,239,230,.9)">SHOWS SOLO</div>`,
    js: `
entrada(); fromL(q('.q1'),0.0,0.25); slam(q('.q2'),0.38,2.4); tranco(0.62,16);
pop(q('.ped'),0.72); stamp(q('.esq'),1.08,-9);
inn(q('.r9'),1.45,{x:-300},0.25); inn(q('.rbr'),1.52,{x:300},0.25); pop(q('.r9-l'),1.45);
slam(q('.zero'),1.84,2.8); tranco(2.04,22); fromR(q('.de'),2.26,0.28); fromB(q('.ss'),2.62,0.28);
qa('.dot').forEach((d,i)=>{tl.to(d,{borderColor:'rgba(255,59,48,0.75)',duration:0.05,ease:'none'},1.9+i*0.03);});
punch(2.8,1.03);`,
  }) },

  c5: { tint: '#4fbf7a', build: () => certa({
    pos: 4, song: 'JUST BREATHE', ac: verde, foto: 'ohanasep18-151', badgeNext: '3',
    sub: '14 de 17 contando o Brasil',
    js: `
entrada(); tl.fromTo(q('.badge'),{opacity:1,rotationX:-90,transformPerspective:900},{rotationX:0,duration:0.22,ease:'back.out(2)',immediateRender:false},0);
pop(q('.kick'),0.05); pop(q('.kick2'),0.1);
inn(q('.pol'),0.1,{x:500},0.35); tl.fromTo(q('.pol'),{rotation:-12},{rotation:-4,duration:0.4,ease:'back.out(2)',immediateRender:false},0.1); kb(q('.pol .kbi'),1.08,1.24,30);
fromB(q('.card'),0.0,0.26); flip(q('.card'),0.34);
light(qa('.r9 .dot'),1.62,0.04,'${verde}'); punch(1.62);
slam(q('.cnt'),2.2,2.2); inn(q('.sub'),2.35,{y:20},0.2); stamp(q('.certa'),2.5,-7);
tl.to(q('.badge'),{rotationX:90,transformPerspective:900,duration:0.12,ease:'power2.in'},2.76);
tl.fromTo(q('.badge2'),{opacity:1,rotationX:-90,transformPerspective:900},{rotationX:-30,duration:0.1,ease:'power2.out',immediateRender:false},2.88);`,
  }) },

  c6: { tint: '#e0483c', build: () => ({
    html: `
<div class="a anton sh q1 h" style="left:70px;top:262px;font-size:86px">E A</div>
<div class="a anton sh q2 h" style="left:66px;top:344px;font-size:150px;color:${verm}">INVINCIBLE?</div>
<div class="a panel pl h" style="left:70px;top:610px;width:405px;height:600px;background:rgba(255,59,48,.2);border:5px solid ${verm}">
  <div class="a ix" style="left:28px;top:30px;font-size:32px;letter-spacing:.08em">COM A BANDA</div>
  <div class="a anton" style="left:26px;top:76px;font-size:70px;color:${verm}">EARTHLINGS</div>
  <div class="a anton n14" style="left:24px;top:200px;font-size:330px">0</div>
  <div class="a mono" style="left:28px;top:530px;font-size:28px">vezes desde 2022</div>
</div>
<div class="a panel pr h" style="left:495px;top:610px;width:405px;height:600px;border:5px solid ${ink}">
  <div class="bgf" style="opacity:.42"><img class="kbi" src="${IMG}/ohana2019-99.jpg" alt=""></div>
  <div class="a ix" style="left:28px;top:30px;font-size:32px;letter-spacing:.08em">SOZINHO</div>
  <div class="a anton" style="left:26px;top:76px;font-size:70px">SOLO</div>
  <div class="a anton sh z0" style="left:24px;top:200px;font-size:330px;color:${verm}">0</div>
  <div class="a mono" style="left:28px;top:530px;font-size:28px">em 17 shows solo</div>
</div>
<div class="a pin h" style="left:600px;top:500px;width:300px;height:110px">
  <svg class="a" style="left:0;top:0" width="70" height="100" viewBox="0 0 70 100"><path d="M35 98 C35 98 4 58 4 35 A31 31 0 1 1 66 35 C66 58 35 98 35 98Z" fill="${verm}" stroke="${ink}" stroke-width="5"/><circle cx="35" cy="35" r="12" fill="${ink}"/></svg>
  <div class="a chip" style="left:78px;top:24px;background:${ink}">IBIRAPUERA</div>
</div>
${carimbo('nv', 'NÃO VAI', verm, 78, 86, 900)}
<div class="a ix sh foot h" style="left:72px;top:1236px;font-size:38px">IBIRAPUERA É SOLO <span class="is" style="font-size:30px;color:rgba(244,239,230,.8)">(segundo a imprensa)</span></div>`,
    js: `
entrada(); fromL(q('.q1'),0.0,0.25); slam(q('.q2'),0.1,2.2); tranco(0.36,14);
fromL(q('.pl'),0.9,0.32); fromR(q('.pr'),1.0,0.32); kb(q('.pr .kbi'),1.05,1.2,0);
count(q('.n14'),0,14,1.41,0.95,'power1.out'); punch(1.9,1.04); tl.fromTo(q('.n14'),{scale:1.25},{scale:1,duration:0.3,ease:'back.out(3)',immediateRender:false},2.36);
tl.fromTo(q('.z0'),{scale:1.5},{scale:1,duration:0.3,ease:'back.out(3)',immediateRender:false},2.89); shake(q('.pr'),2.95,14);
fromT(q('.pin'),3.95,0.5); tl.to(q('.pl'),{opacity:0.3,duration:0.3,ease:'power1.out'},4.05); inn(q('.foot'),4.1,{y:30},0.25);
stamp(q('.nv'),4.72,-12);`,
  }) },

  c7: { tint: '#d9a640', build: () => certa({
    pos: 3, song: 'FAR BEHIND', ac: verde, foto: 'eddie-vedder-2018', rows17: true, cnt2: true, brChip: true,
    sub: 'e nunca falhou no Brasil', cntFrom: 9, cntDe: 9,
    js: `
entrada(); tl.fromTo(q('.badge'),{opacity:1,rotationX:-90,transformPerspective:900},{rotationX:0,duration:0.22,ease:'back.out(2)',immediateRender:false},0);
pop(q('.kick'),0.05); pop(q('.kick2'),0.1);
inn(q('.pol'),0.1,{x:500},0.35); tl.fromTo(q('.pol'),{rotation:12},{rotation:4,duration:0.4,ease:'back.out(2)',immediateRender:false},0.1); kb(q('.pol .kbi'));
fromB(q('.card'),0.0,0.26); flip(q('.card'),0.42);
light(qa('.r9 .dot'),1.05,0.035,'${verde}'); slam(q('.cnt'),1.45,2); inn(q('.sub'),1.7,{y:20},0.2);
recolor([q('.badge'),q('.kick'),q('.cnt')],2.75,'${ouro}');
qa('.r9 .dot').forEach(d=>tl.to(d,{backgroundColor:'${ouro}',borderColor:'${ouro}',boxShadow:'0 0 34px ${ouro}',duration:0.2,ease:'none'},2.75));
inn(q('.rbr'),2.85,{x:-900},0.3); pop(q('.rbr-l'),2.85); punch(2.89);
light(qa('.rbr .dot'),3.3,0.04,'${ouro}'); pop(q('.brchip'),3.42);
out(q('.cnt'),3.66,0.08); out(q('.sub'),3.66,0.08); slam(q('.cnt2'),3.72,1.6,0.2); count(q('.cnt2 .n'),9,17,3.75,0.4,'power1.out'); tranco(4.16,18);
stamp(q('.certa'),4.12,-8);`,
  }) },

  c8: { tint: '#e6c23a', build: () => ({
    html: `
<div class="a anton sh q1 h" style="left:70px;top:262px;font-size:80px">E A</div>
<div class="a anton sh q2 h" style="left:66px;top:336px;font-size:132px;color:${amar}">BETTER DAYS?</div>
<svg class="a gauge h" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920">
  <defs><linearGradient id="c8-g" x1="0" x2="1"><stop offset="0" stop-color="${verm}"/><stop offset=".5" stop-color="${amar}"/><stop offset="1" stop-color="${verde}"/></linearGradient></defs>
  <path d="M225 770 A260 260 0 0 1 745 770" fill="none" stroke="url(#c8-g)" stroke-width="34" stroke-linecap="round"/>
  <g class="needle"><line x1="485" y1="770" x2="485" y2="545" stroke="${ink}" stroke-width="12" stroke-linecap="round"/><circle cx="485" cy="770" r="22" fill="${ink}"/></g>
</svg>
<div class="a ix sh gl h" style="left:150px;top:800px;font-size:28px;color:${verm}">ESQUECE</div>
<div class="a ix sh gr h" style="left:690px;top:800px;font-size:28px;color:${verde}">CERTA</div>
${carimbo('tv', 'TALVEZ', amar, 120, 300, 600)}
${fila('rbr h', 920, 8, 'BRASIL: 5 DE 8')}
${fila('r9 h', 1052, 9, 'DESDE 2023: 0 DE 9')}
<div class="a anton sh only h" style="left:70px;top:1160px;font-size:96px;color:${amar}">SÓ TOCOU NO BRASIL</div>`,
    js: `
entrada(); fromL(q('.q1'),0.0,0.22); slam(q('.q2'),0.12,2.2); tranco(0.36,12);
pop(q('.gauge'),0.4,0.3); pop(q('.gl'),0.5); pop(q('.gr'),0.55);
const nd=q('.needle');
tl.fromTo(nd,{rotation:-80,svgOrigin:'485 770'},{rotation:70,duration:0.28,ease:'power2.inOut',immediateRender:false},0.45);
tl.to(nd,{rotation:-50,duration:0.22,ease:'power2.inOut'},0.73); tl.to(nd,{rotation:30,duration:0.18,ease:'power2.inOut'},0.95);
tl.to(nd,{rotation:-12,duration:0.16,ease:'power2.inOut'},1.13); tl.to(nd,{rotation:0,duration:0.2,ease:'back.out(3)'},1.29);
stamp(q('.tv'),1.11,-7);
inn(q('.rbr'),1.7,{x:-400},0.25); pop(q('.rbr-l'),1.7); inn(q('.r9'),1.8,{x:400},0.25); pop(q('.r9-l'),1.8);
slam(q('.only'),1.95,1.8); punch(2.43,1.03);
light(qa('.rbr .dot').slice(0,5),2.5,0.15,'${amar}'); tranco(3.15,12);
qa('.r9 .dot').forEach((d,i)=>tl.fromTo(d,{scale:0.7},{scale:1,duration:0.2,ease:'back.out(2)',immediateRender:false},3.3+i*0.03));`,
  }) },

  c9: { tint: '#d9a640', build: () => certa({
    pos: 2, song: 'HARD SUN', ac: ouro, foto: 'ohanasep18-51', rows17: true,
    sub: 'contando o Brasil', cntFrom: 0, cntDe: 17,
    js: `
entrada(); slam(q('.badge'),0,2.6,0.24); pop(q('.kick'),0.05); pop(q('.kick2'),0.1);
inn(q('.pol'),0.1,{x:500},0.35); tl.fromTo(q('.pol'),{rotation:-12},{rotation:-5,duration:0.4,ease:'back.out(2)',immediateRender:false},0.1); kb(q('.pol .kbi'),1.08,1.25,20);
fromB(q('.card'),0.0,0.26); flip(q('.card'),0.3);
inn(q('.rbr'),0.9,{x:-900},0.3); pop(q('.rbr-l'),0.9);
slam(q('.cnt'),1.2,1.6,0.2);
const a=qa('.r9 .dot'), b=qa('.rbr .dot');
light(a,1.24,0.06,'${ouro}'); light(b,1.24,0.066,'${ouro}'); count(q('.cnt .n'),0,17,1.24,0.62,'power1.out');
punch(1.24); tranco(1.88,20); inn(q('.sub'),2.44,{y:20},0.2); stamp(q('.certa'),2.7,-8);`,
  }) },

  c10: { tint: '#e07a2a', build: () => ({
    html: `
${['5 · BETTER MAN', '4 · JUST BREATHE', '3 · FAR BEHIND', '2 · HARD SUN'].map((s, i) => `<div class="a anton mini m${i}" style="left:70px;top:${720 + i * 96}px;font-size:66px;padding:6px 18px 0;border-radius:12px;background:${ouro};color:#0b0b0c">${s}</div>`).join('')}
<div class="a anton sh q1 h" style="left:70px;top:262px;font-size:96px">MAS E A</div>
<div class="a anton sh q2 h" style="left:62px;top:352px;font-size:300px;color:${lar}">BLACK?</div>
<div class="a chip ped h" style="left:70px;top:684px;background:${lar}">21 PEDIDOS</div>
${carimbo('dif', 'DIFÍCIL', lar, 112, 420, 652)}
${fila('r9 h', 912, 9, 'DESDE 2023 · 9 SHOWS SOLO')}
<div class="a rl tm h" style="left:${DOT_L}px;top:988px;color:${lar}">TEMPE 2023</div><div class="a rl" style="left:744px;top:988px">JAPÃO 2026</div>
<div class="a anton sh zero h" style="left:70px;top:1060px;font-size:300px;color:${lar}">0</div>
<div class="a anton sh u1 h" style="left:290px;top:1094px;font-size:96px">NOS ÚLTIMOS</div>
<div class="a anton sh u2 h" style="left:290px;top:1196px;font-size:96px">8 SHOWS SOLO</div>`,
    js: `
qa('.mini').forEach((m,i)=>{tl.fromTo(m,{x:0},{x:1200,duration:0.26,ease:'power3.in',immediateRender:false},0.02+i*0.05);});
fromL(q('.q1'),0.0,0.25); slam(q('.q2'),0.45,2.4); tranco(0.7,20);
pop(q('.ped'),0.95); stamp(q('.dif'),1.8,-8);
pop(q('.r9'),2.2,0.25); pop(q('.r9-l'),2.2);
const ds=qa('.r9 .dot'); light(ds,2.4,0.03,'${lar}'); pop(q('.tm'),2.5); punch(2.95,1.03);
dim(ds.slice(1),3.23,0.2);
slam(q('.zero'),4.3,2.6); fromR(q('.u1'),4.42,0.25); fromR(q('.u2'),4.55,0.25); tranco(4.55,16);
tl.fromTo(ds[0],{scale:1},{scale:1.5,duration:0.25,ease:'power2.in',immediateRender:false},D-0.25);`,
  }) },

  c11: { tint: '#b0602a', build: () => mapa() },

  c12: { tint: '#d9a640', build: () => ({
    html: `
<div class="a anton sh big1" style="left:300px;top:120px;font-size:1500px;line-height:1;color:${ouro};opacity:0">1</div>
<div class="a anton sh badge h" style="left:62px;top:226px;font-size:260px;color:${ouro}">1</div>
<div class="a ix sh kick h" style="left:250px;top:300px;font-size:36px;color:${ouro};letter-spacing:.1em">NÚMERO 1</div>
<div class="a is sh kick2 h" style="left:250px;top:350px;font-size:30px">a mais tocada da carreira solo</div>
${card(470, 1, 'PORCH', 230, ouro, `<div class="a chip" style="right:24px;bottom:22px;background:${ouro}">17 DE 17</div>`)}
${fila('r9', 870, 9, 'DESDE 2023')}
${fila('rbr', 990, 8, 'BRASIL')}
<div class="a anton sh cnt h" style="left:66px;top:1090px;font-size:280px;color:${ouro}">0</div>
<div class="a anton sh vz h" style="left:70px;top:1352px;font-size:58px">VEZES NA CARREIRA SOLO</div>
<div class="a vz2 h"></div>
${carimbo('certa', 'CERTA', ouro, 112, 470, 1130)}
<div class="a lineup h" style="left:0;top:0;width:1080px;height:1920px;background:rgba(11,11,12,.82)">
${[[5, 'BETTER', 'MAN'], [4, 'JUST', 'BREATHE'], [3, 'FAR', 'BEHIND'], [2, 'HARD', 'SUN'], [1, 'PORCH', '']].map(([n, a, b], i) => `<div class="a lc lc${i}" style="left:${80 + i * 165}px;top:640px;width:150px;height:340px;border-radius:16px;background:${i === 4 ? ouro : ink};color:#0b0b0c;text-align:center"><div class="anton" style="font-size:120px;margin-top:20px">${n}</div><div class="anton" style="font-size:36px;margin-top:30px">${a}</div><div class="anton" style="font-size:36px">${b}</div></div>`).join('')}
<div class="a anton sh" style="left:80px;top:1010px;font-size:70px;color:${ouro}">AS 5 CERTAS</div>
</div>`,
    js: `
tl.fromTo(q('.big1'),{opacity:1,scale:0.25},{scale:1,duration:0.3,ease:'expo.out',immediateRender:false},0.0); tranco(0.3,24);
tl.to(q('.big1'),{scale:2.4,opacity:0,duration:0.28,ease:'power2.in'},0.62);
slam(q('.badge'),0.7,2.2); pop(q('.kick'),0.78);
fromB(q('.card'),0.7,0.22); flip(q('.card'),0.88);
light(qa('.r9 .dot').concat(qa('.rbr .dot')),1.41,0.025,'${ouro}');
pop(q('.kick2'),1.5); slam(q('.cnt'),1.48,1.6,0.2); count(q('.cnt'),0,192,1.48,1.4,'power2.out');
fromR(q('.vz'),1.8,0.25); fromR(q('.vz2'),1.9,0.25); punch(2.2,1.03);
stamp(q('.certa'),2.9,-10); tranco(3.1,30);
inn(q('.lineup'),3.3,{},0.1,'none');
qa('.lc').forEach((c,i)=>{tl.fromTo(c,{opacity:0,y:300,rotation:(i-2)*8},{opacity:1,y:0,rotation:0,duration:0.24,ease:'back.out(2)',immediateRender:false},3.32+i*0.05);});`,
  }) },

  c13: { tint: '#8a8a8a', build: () => ({
    html: `
<div class="a mono sh palp h" style="left:72px;top:262px;font-size:28px;color:${amar}">PALPITE PELO HISTÓRICO, NÃO É SETLIST OFICIAL</div>
${[[5, 'BETTER MAN'], [4, 'JUST BREATHE'], [3, 'FAR BEHIND'], [2, 'HARD SUN'], [1, 'PORCH']].map(([n, s], i) => `
<div class="a li li${i} h" style="left:70px;top:${318 + i * 82}px;width:830px;height:74px;border-bottom:2px solid rgba(244,239,230,.18)">
  <span class="a anton" style="left:0;top:2px;font-size:66px;color:${ouro}">${n}</span>
  <span class="a anton sh" style="left:70px;top:2px;font-size:66px">${s}</span>
  <span class="a" style="right:0;top:10px;font-family:Marker;font-size:30px;color:${verde};border:4px solid ${verde};border-radius:10px;padding:0 12px">CERTA</span>
</div>`).join('')}
${[['BLACK', 'DIFÍCIL', lar], ['SIRENS', 'ESQUECE', verm], ['INVINCIBLE', 'NÃO VAI', verm], ['BETTER DAYS', 'TALVEZ', amar]].map(([s, c, k], i) => `
<div class="a pe pe${i} h" style="left:${i % 2 ? 495 : 70}px;top:${746 + Math.floor(i / 2) * 74}px;width:405px;height:64px">
  <span class="a ix sh" style="left:0;top:12px;font-size:30px">${s}</span>
  <span class="a" style="right:12px;top:4px;font-family:Marker;font-size:30px;color:${k};border:4px solid ${k};border-radius:10px;padding:0 10px">${c}</span>
</div>`).join('')}
<div class="a anton sh ans h" style="left:70px;top:918px;font-size:118px;color:${amar}">TÁ ANSIOSO?</div>
<div class="a ix sh manda h" style="left:72px;top:1046px;font-size:42px">MANDA PARA QUEM VAI COM VOCÊ</div>
<div class="a ix sh com h" style="left:72px;top:1112px;font-size:42px;color:${amar}">COMENTA A SUA APOSTA</div>
<div class="a vaz h" style="left:640px;top:1100px;width:150px;height:70px;border:4px dashed ${ink};border-radius:12px;text-align:center"><span class="anton" style="font-size:54px;line-height:66px">?</span></div>
<div class="a anton amanha h" style="left:70px;top:1196px;font-size:62px;padding:6px 22px 0;background:${ouro};color:#0b0b0c;border-radius:10px">AMANHÃ: O RANKING COMPLETO</div>
<div class="a mono sh site h" style="left:72px;top:1316px;font-size:40px">somaisumfadepearljam.com.br</div>`,
    js: `
entrada(); inn(q('.palp'),0.0,{x:-40},0.25);
qa('.li').forEach((l,i)=>fromL(l,0.1+i*0.07,0.3));
qa('.pe').forEach((p,i)=>pop(p,0.55+i*0.08,0.3)); punch(0.82,1.03);
slam(q('.ans'),1.74,2); tranco(1.94,14);
fromL(q('.manda'),2.95,0.28); fromR(q('.amanha'),3.6,0.32);
fromL(q('.com'),4.15,0.26); pop(q('.vaz'),4.3,0.3);
tl.to(q('.vaz'),{opacity:0.15,duration:0.18,yoyo:true,repeat:7,ease:'none'},4.75);
inn(q('.site'),0.3,{y:20},0.25); tl.fromTo(q('.site'),{scale:1.15},{scale:1,duration:0.3,ease:'back.out(3)',immediateRender:false},5.1);`,
  }) },
};

// ---------- mapa (c11) ----------
function mapa() {
  const X = (lon) => Math.round(70 + (lon + 168) * 5.9);
  const Y = (lat) => Math.round(470 + (75 - lat) * 6.2);
  const P = (pts) => 'M' + pts.map(([lo, la]) => `${X(lo)} ${Y(la)}`).join(' L') + ' Z';
  const na = [[-165, 68], [-156, 71], [-130, 70], [-110, 72], [-95, 72], [-82, 68], [-78, 62], [-65, 60], [-56, 52], [-66, 45], [-70, 42], [-76, 38], [-76, 35], [-81, 31], [-80, 26], [-82, 27], [-85, 30], [-90, 30], [-97, 27], [-97, 22], [-92, 18], [-87, 21], [-88, 16], [-84, 11], [-79, 9], [-78, 8], [-80, 8], [-83, 8], [-86, 12], [-92, 14], [-96, 16], [-105, 20], [-106, 23], [-110, 24], [-112, 29], [-117, 32], [-121, 35], [-124, 40], [-124, 46], [-123, 49], [-130, 54], [-135, 58], [-142, 60], [-152, 59], [-158, 57], [-165, 60]];
  const sa = [[-78, 8], [-72, 12], [-63, 11], [-60, 8], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-35, -9], [-39, -15], [-41, -22], [-48, -26], [-53, -34], [-58, -38], [-62, -40], [-65, -45], [-68, -50], [-69, -54], [-72, -53], [-75, -47], [-73, -40], [-71, -30], [-70, -18], [-76, -14], [-81, -6], [-80, -1], [-77, 4]];
  const [tx, ty] = [X(-111.9), Y(33.4)], [ix, iy] = [X(-46.66), Y(-23.59)];
  const grat = [];
  for (let lo = -160; lo <= -40; lo += 20) grat.push(`M${X(lo)} ${Y(75)} L${X(lo)} ${Y(-57)}`);
  for (let la = 60; la >= -50; la -= 20) grat.push(`M${X(-168)} ${Y(la)} L${X(-30)} ${Y(la)}`);
  const pin = (cls, x, y, cor) => `<svg class="a ${cls} h" style="left:${x - 30}px;top:${y - 84}px" width="60" height="86" viewBox="0 0 70 100"><path d="M35 98 C35 98 4 58 4 35 A31 31 0 1 1 66 35 C66 58 35 98 35 98Z" fill="${cor}" stroke="${ink}" stroke-width="6"/><circle cx="35" cy="35" r="12" fill="${ink}"/></svg>`;
  const tags = (cls, x, y, right) => ['SOLO', 'FESTIVAL', 'AO AR LIVRE'].map((t, i) =>
    `<div class="a chip ${cls} ${cls}${i} h" style="${right ? `right:${1080 - x}px` : `left:${x}px`};top:${y + i * 62}px;background:${i === 0 ? ink : lar};font-size:28px">${t}</div>`).join('');
  return {
    html: `
<div class="bgf" style="background:rgba(11,11,12,.55)"></div>
<svg class="a mapa" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920">
  <g stroke="rgba(244,239,230,.12)" stroke-width="2" fill="none">${grat.map((d) => `<path d="${d}"/>`).join('')}</g>
  <path class="cont" d="${P(na)}" fill="rgba(244,239,230,.06)" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path class="cont" d="${P(sa)}" fill="rgba(244,239,230,.06)" stroke="${ink}" stroke-width="4" stroke-linejoin="round"/>
  <path class="rota" d="M${tx} ${ty} Q ${tx + 330} ${ty + 80} ${ix} ${iy}" fill="none" stroke="${lar}" stroke-width="8" stroke-linecap="round"/>
</svg>
<svg class="a dash h" style="left:0;top:0" width="1080" height="1920" viewBox="0 0 1080 1920"><path d="M${tx} ${ty} Q ${tx + 330} ${ty + 80} ${ix} ${iy}" fill="none" stroke="#0b0b0c" stroke-width="10" stroke-dasharray="4 18"/></svg>
<div class="a bola" style="left:${DOT_L}px;top:912px;width:64px;height:64px;border-radius:50%;background:${lar}"></div>
<div class="a ix sh k h" style="left:72px;top:262px;font-size:36px;color:${lar};letter-spacing:.1em">ÚLTIMA VEZ:</div>
<div class="a anton sh tit h" style="left:70px;top:310px;font-size:84px">TEMPE (EUA), 26/02/2023</div>
${pin('pt', tx, ty, lar)}${pin('pi', ix, iy, ouro)}
<div class="a ix sh lt h" style="left:${tx + 40}px;top:${ty - 66}px;font-size:30px">INNINGS FESTIVAL</div>
<div class="a ix sh li h" style="left:${ix - 260}px;top:${iy - 74}px;font-size:30px;color:${ouro}">IBIRAPUERA</div>
${tags('tt', tx - 44, ty - 40, true)}
${tags('ti', ix - 50, iy + 40, true)}
${carimbo('dif', 'DIFÍCIL<span class="qm" style="display:inline-block;opacity:0">?</span>', lar, 72, 84, 1170)}`,
    js: `
const b=q('.bola');
tl.fromTo(b,{scale:1,opacity:1},{scale:46,duration:0.32,ease:'power3.in',immediateRender:false},0.0);
tl.to(b,{opacity:0,duration:0.2,ease:'none'},0.3);
const cs=qa('.cont'); cs.forEach((c,i)=>{const L=c.getTotalLength(); tl.fromTo(c,{strokeDasharray:L,strokeDashoffset:L},{strokeDashoffset:0,duration:0.9,ease:'power2.out',immediateRender:false},0.25+i*0.15);});
const r=q('.rota'), RL=r.getTotalLength(); tl.fromTo(r,{strokeDasharray:RL,strokeDashoffset:RL},{strokeDashoffset:0,duration:0.8,ease:'power1.inOut'},1.29);
tl.fromTo(q('.dash'),{opacity:0},{opacity:1,duration:0.1,immediateRender:false},2.1);
inn(q('.k'),0.3,{x:-60},0.2); slam(q('.tit'),0.41,1.8);
fromT(q('.pt'),0.45,0.4); pop(q('.lt'),0.7);
qa('.tt').forEach((t,i)=>pop(t,0.85+i*0.12,0.25));
fromT(q('.pi'),2.05,0.4); pop(q('.li'),2.2);
const ti=qa('.ti'); pop(ti[0],2.26,0.25); pop(ti[1],2.4,0.25); pop(ti[2],2.86,0.25); punch(2.86,1.03);
pop(q('.dif'),0.6,0.3); tl.fromTo(q('.dif'),{rotation:-8},{rotation:-8,duration:0.01,immediateRender:false},0.6);
slam(q('.qm'),3.2,3.2); shake(q('.dif'),3.36,12);
tl.fromTo(q('.mapa'),{scale:1},{scale:1.06,duration:D,ease:'none',immediateRender:false},0);`,
  };
}

export function arquivoCena(id, D) {
  const c = CENAS[id].build();
  return `<!doctype html>
<html><head><meta charset="UTF-8" /></head>
<body>
<template>
<style>${css(id)}
</style>
<div id="${id}-root" data-composition-id="${id}" data-width="1080" data-height="1920" data-duration="${D}">
<div class="st">${c.html}
</div>
</div>
<script>
(function(){
const ID='${id}', D=${D};
${helpers}
${c.js}
window.__timelines['${id}']=tl;
})();
</script>
</template>
</body></html>
`;
}
