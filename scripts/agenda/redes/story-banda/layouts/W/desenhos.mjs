// Layout W: desenhos próprios de tirinha de verão, genéricos e simples (sol, onda, prancha, coqueiro, guitarra,
// ônibus de turnê, ingresso e a tecla de apagar da máquina de escrever). Contorno de 3 px, cor chapada, um brilho e
// uma sombra em cada peça. Caixa ~ 200 x 200 em s = 1, centrada em (cx, cy).
import { f1, txt } from "./pecas.mjs";

const g = (cx, cy, s, miolo, rot = 0) => `<g transform="translate(${f1(cx)} ${f1(cy)}) rotate(${f1(rot)}) scale(${s})" stroke-linejoin="round" stroke-linecap="round">${miolo}</g>`;
const L = (cor, w = 3) => `stroke="${cor.linha}" stroke-width="${w}"`;

// Sol: raios em triângulo que giram com `giro` (graus), disco com sombra em meia-lua e brilho
export function sol(cx, cy, s, cor, giro = 0) {
  const raios = Array.from({ length: 12 }, (_, i) => `<path d="M-12,-74 L0,-104 L12,-74 Z" transform="rotate(${i * 30 + giro})" fill="${cor.laranja}" ${L(cor)}/>`).join("");
  return g(cx, cy, s, `${raios}<circle r="64" fill="${cor.amarelo}" ${L(cor, 3.5)}/>
    <path d="M30,-50 A64,64 0 0 1 22,60 A54,54 0 0 0 30,-50 Z" fill="${cor.laranja}" opacity="0.55"/>
    <path d="M-38,-24 A44,44 0 0 1 -14,-46" fill="none" stroke="#fff" stroke-width="6" opacity="0.8"/>`);
}

// Onda que quebra: crista enrolada em azul, espuma branca e duas linhas de movimento
export function onda(cx, cy, s, cor) {
  return g(cx, cy, s, `<path d="M-110,70 C-90,10 -50,-60 10,-70 C60,-78 98,-40 92,0 C88,28 60,36 44,18 C30,2 44,-20 60,-14 C40,-40 -10,-30 -30,20 C-44,52 -40,70 -40,70 Z" fill="${cor.piscina}" ${L(cor, 3.5)}/>
    <path d="M-30,20 C-10,-24 30,-40 60,-14" fill="none" stroke="#fff" stroke-width="7" opacity="0.9"/>
    <path d="M-104,70 H110 M-80,86 H40 M60,86 H96" fill="none" ${L(cor)}/>
    <circle cx="70" cy="-44" r="6" fill="#fff" ${L(cor, 2)}/><circle cx="92" cy="-28" r="4" fill="#fff" ${L(cor, 2)}/>`);
}

// Prancha de surfe deitada na diagonal: longarina, faixa e quilha
export function prancha(cx, cy, s, cor, rot = -28) {
  return g(cx, cy, s, `<path d="M-110,0 C-70,-30 70,-30 112,0 C70,30 -70,30 -110,0 Z" fill="${cor.laranja}" ${L(cor, 3.5)}/>
    <path d="M-100,0 H102" stroke="${cor.linha}" stroke-width="1.6" opacity="0.7"/><path d="M-30,-22 C-26,-6 -26,6 -30,22 M-12,-23 C-8,-6 -8,6 -12,23" fill="none" stroke="${cor.vermelho}" stroke-width="7"/>
    <path d="M76,8 L96,30 L66,14 Z" fill="${cor.vermelho}" ${L(cor, 2.5)}/><path d="M-80,-12 C-40,-22 20,-22 50,-18" fill="none" stroke="#fff" stroke-width="4" opacity="0.75"/>`, rot);
}

// Coqueiro: tronco curvo com anéis, cinco folhas e dois cocos
export function coqueiro(cx, cy, s, cor) {
  const folhas = [[-150, 1], [-110, 0.9], [-60, 1], [-20, 0.95], [20, 0.8]].map(([a, e]) =>
    `<path d="M0,0 C30,-30 80,-30 ${f1(110 * e)},6 C70,-6 30,-4 0,0 Z" transform="rotate(${a})" fill="${cor.verde}" ${L(cor)}/>
     <path d="M6,-3 C40,-16 70,-14 ${f1(100 * e)},2" transform="rotate(${a})" fill="none" stroke="${cor.linha}" stroke-width="1.4" opacity="0.6"/>`).join("");
  const aneis = [0.15, 0.3, 0.45, 0.6, 0.75].map((t) => `<path d="M${f1(-12 + t * 30)},${f1(110 - t * 110)} h24" stroke="${cor.linha}" stroke-width="1.8" opacity="0.7"/>`).join("");
  return g(cx, cy, s, `<path d="M-14,110 C-6,60 10,30 6,-2 L22,0 C28,34 12,70 10,110 Z" fill="${cor.marrom}" ${L(cor)}/>${aneis}
    <g transform="translate(14 -4)">${folhas}<circle cx="-6" cy="10" r="10" fill="${cor.marrom}" ${L(cor, 2.5)}/><circle cx="12" cy="12" r="9" fill="${cor.marrom}" ${L(cor, 2.5)}/></g>`);
}

// Guitarra: corpo de dois lóbulos, escudo, captadores, braço com trastes e cordas
export function guitarra(cx, cy, s, cor, rot = -35) {
  const trastes = Array.from({ length: 7 }, (_, i) => `M${f1(28 + i * 12)},-7 v14`).join(" ");
  return g(cx, cy, s, `<path d="M28,-8 H118 L132,-14 H150 V14 H132 L118,8 H28 Z" fill="${cor.marrom}" ${L(cor)}/>
    <path d="${trastes}" stroke="${cor.linha}" stroke-width="1.4" opacity="0.7"/>
    <path d="M-30,-48 C-4,-50 8,-30 30,-26 C40,-24 40,24 30,26 C8,30 -4,52 -30,48 C-70,58 -104,40 -104,0 C-104,-40 -70,-58 -30,-48 Z" fill="${cor.vermelho}" ${L(cor, 3.5)}/>
    <path d="M-60,-30 C-30,-34 0,-20 6,0 C0,22 -30,32 -60,28 C-78,18 -80,-18 -60,-30 Z" fill="#fff" opacity="0.92" ${L(cor, 2)}/>
    <rect x="-44" y="-16" width="10" height="32" rx="3" fill="${cor.linha}"/><rect x="-22" y="-16" width="10" height="32" rx="3" fill="${cor.linha}"/>
    <path d="M-72,-4 H140 M-72,4 H140" stroke="${cor.linha}" stroke-width="0.9" opacity="0.8"/>
    <path d="M-84,-24 C-74,-40 -54,-46 -40,-44" fill="none" stroke="#fff" stroke-width="5" opacity="0.6"/>`, rot);
}

// Ônibus de turnê: carroceria arredondada, faixa, janelas com reflexo, rodas e o letreiro TURNÊ
export function onibus(cx, cy, s, cor) {
  const jan = [0, 1, 2, 3].map((i) => `<rect x="${-88 + i * 40}" y="-40" width="32" height="28" rx="4" fill="${cor.piscina}" ${L(cor, 2.5)}/>
    <path d="M${-82 + i * 40},-20 l14,-14" stroke="#fff" stroke-width="3" opacity="0.8"/>`).join("");
  const roda = (x) => `<circle cx="${x}" cy="44" r="20" fill="${cor.linha}"/><circle cx="${x}" cy="44" r="8" fill="#ddd"/>`;
  return g(cx, cy, s, `<rect x="-104" y="-56" width="212" height="100" rx="22" fill="${cor.amarelo}" ${L(cor, 3.5)}/>
    <rect x="-104" y="4" width="212" height="18" fill="${cor.vermelho}" ${L(cor, 2.5)}/>${jan}
    <rect x="72" y="-40" width="28" height="50" rx="5" fill="${cor.piscina}" ${L(cor, 2.5)}/><circle cx="100" cy="28" r="6" fill="#fff" ${L(cor, 2)}/>
    ${txt(-16, 18, "TURNÊ", 15, "#fff", { ls: 2 })}${roda(-60)}${roda(64)}`);
}

// Ingresso: canhoto com picote, entalhes e uma estrela
export function ingresso(cx, cy, s, cor, rot = 8) {
  return g(cx, cy, s, `<path d="M-110,-56 H110 V-16 A16,16 0 0 0 110,16 V56 H-110 V16 A16,16 0 0 0 -110,-16 Z" fill="${cor.amarelo}" ${L(cor, 3.5)}/>
    <path d="M50,-50 V50" stroke="${cor.linha}" stroke-width="3" stroke-dasharray="2 9"/>
    <rect x="-94" y="-40" width="132" height="80" fill="none" stroke="${cor.vermelho}" stroke-width="2.5"/>
    ${txt(-28, 8, "ENTRADA", 22, cor.linha, { ls: 1 })}${txt(-28, 30, "SHOW", 14, cor.vermelho, { fonte: "sans", ls: 4 })}
    <path d="M80,-16 l7,14 l15,2 l-11,10 l3,15 l-14,-8 l-14,8 l3,-15 l-11,-10 l15,-2 Z" fill="${cor.vermelho}" ${L(cor, 2)}/>`, rot);
}

// Tecla de apagar de máquina de escrever: aro cromado, tampo branco, seta pra esquerda; aperta (0..1) afunda a tecla
export function tecla(cx, cy, s, cor, aperta = 0) {
  const d = f1(aperta * 9);
  return g(cx, cy, s, `<rect x="-6" y="40" width="12" height="70" fill="#8d8d8d" ${L(cor, 2.5)}/>
    <ellipse cx="0" cy="${f1(14 + aperta * 2)}" rx="72" ry="30" fill="${cor.sombra}" opacity="0.35"/>
    <g transform="translate(0 ${d})"><circle r="66" fill="#b9bcc2" ${L(cor, 3.5)}/><circle r="56" fill="#f8f6ef" ${L(cor, 2)}/>
    <path d="M-50,-22 A56,56 0 0 1 10,-55" fill="none" stroke="#fff" stroke-width="5" opacity="0.9"/>
    <path d="M30,0 H-24 M-8,-16 L-26,0 L-8,16" fill="none" stroke="${cor.linha}" stroke-width="8"/>
    ${txt(0, 40, "APAGA", 14, cor.linha, { fonte: "sans", ls: 3 })}</g>`);
}
