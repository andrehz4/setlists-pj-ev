import { createRequire } from "node:module";
const sharp = createRequire("/Users/andrehz/Documents/Githubhz/setlists-pj-ev/package.json")("sharp");
const P = process.argv[2];
const T = (x, y, s, w, txt, extra = "") => `<text x="${x}" y="${y}" font-family="Inter" font-weight="${w}" font-size="${s}" fill="#fff" ${extra}>${txt}</text>`;
const icone = (y, d, n) => `<g transform="translate(985 ${y})">${d}</g>${T(1010, y + 78, 26, 600, n, 'text-anchor="middle"')}`;
const svg = `<svg width="1080" height="1920" xmlns="http://www.w3.org/2000/svg">
<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient></defs>
<rect y="1450" width="1080" height="470" fill="url(#g)"/>
${T(40, 110, 46, 800, "Reels")}
${icone(1270, '<path d="M25 52 C-8 28 2 0 25 14 C48 0 58 28 25 52Z" fill="none" stroke="#fff" stroke-width="5"/>', "2.481")}
${icone(1400, '<circle cx="25" cy="27" r="24" fill="none" stroke="#fff" stroke-width="5"/>', "137")}
${icone(1530, '<path d="M2 4 L50 26 L2 48 L10 26Z" fill="none" stroke="#fff" stroke-width="5" stroke-linejoin="round"/>', "412")}
<g transform="translate(990 1680)"><circle cx="20" cy="0" r="5" fill="#fff"/><circle cx="20" cy="-18" r="5" fill="#fff"/><circle cx="20" cy="18" r="5" fill="#fff"/></g>
${T(130, 1660, 34, 700, "smufdpj")}
<rect x="285" y="1626" width="122" height="48" rx="10" fill="none" stroke="#fff" stroke-width="2.5"/>${T(346, 1660, 28, 700, "Seguir", 'text-anchor="middle"')}
${T(40, 1730, 31, 500, "Even Flow, do Pearl Jam, faz parte do Ten, o disco de")}
${T(40, 1772, 31, 500, "estreia da banda, lançado em 1991. O riff na... <tspan fill='#ccc'>mais</tspan>")}
<rect x="40" y="1800" width="440" height="54" rx="27" fill="#fff" fill-opacity=".18"/>${T(66, 1838, 28, 600, "♫  Pearl Jam · Even Flow")}
</svg>`;
const logo = await sharp("/Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/marca/perfil-quadrado-1000.jpg").resize(72, 72)
  .composite([{ input: Buffer.from('<svg width="72" height="72"><circle cx="36" cy="36" r="36"/></svg>'), blend: "dest-in" }]).png().toBuffer();
await sharp(Buffer.from(svg)).composite([{ input: logo, left: 40, top: 1612 }]).png().toFile(P + "/mock-ig.png");
