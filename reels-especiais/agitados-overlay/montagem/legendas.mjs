import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
const sharp = createRequire("/Users/andrehz/Documents/Githubhz/setlists-pj-ev/package.json")("sharp");
const D = "/private/tmp/claude-501/-Users-andrehz-Documents-Githubhz-setlists-pj-ev/bb2da7bc-4cf6-49eb-905a-6d726e5961b1/scratchpad/montagem/";
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
// letra traduzida (tempo do reel = tempo do disco - 48.62)
const letra = [
  [11.3, 21.0, ["Even flow, pensamentos chegam", "como borboletas"]],
  [21.1, 27.2, ["Ele não sabe,", "então os espanta"]],
  [27.3, 31.1, ["Algum dia ainda, ele vai", "recomeçar a vida"]],
  [31.2, 36.3, ["Recomeçar, recomeçar..."]],
];
const drops = [
  [0.6, 4.6, "VOCÊ SABIA?", ["A música mais ouvida do Pearl Jam", "no Spotify: quase 1 bilhão de plays"]],
  [4.9, 9.7, "JEFF AMENT, BAIXO", ["“Era a melhor música do disco e ficou", "com a nossa pior gravação. Foram uns", "100 takes e a gente nunca acertou.”"]],
  [11.8, 16.5, "PINKPOP, HOLANDA, 1992", ["Eddie sobe no guindaste da câmera", "e se joga na galera"]],
  [16.9, 20.9, "LOLLAPALOOZA, 1992", ["Quatro da tarde. A banda lembra de", "20 mil jovens correndo pro palco"]],
  [21.3, 27.0, "EDDIE VEDDER", ["“Se alguém caía na roda, a gente parava", "Even Flow na hora e só voltava quando", "todo mundo estava de pé.”"]],
  [27.4, 33.4, "EDDIE VEDDER, 1992", ["O clipe oficial foi filmado num show:", "tocaram a música uma vez só. Por isso", "a camisa dele aparece e some."]],
  [33.7, 36.6, "MIKE McCREADY", ["“Todo show eu experimento.", "Nunca é o mesmo solo.”"]],
];
const W = 1080, H = 1920;
function svgLetra(l) {
  const y0 = 1430 - (l.length - 1) * 38;
  const t = l.map((s, i) => `<text x="540" y="${y0 + i * 76}" text-anchor="middle" font-family="Inter" font-weight="800" font-size="58" fill="#fff" stroke="#000" stroke-opacity=".55" stroke-width="7" paint-order="stroke">${esc(s)}</text>`).join("");
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${t}</svg>`;
}
function svgDrop(tag, l) {
  const top = 250, h = 70 + l.length * 50;
  const t = l.map((s, i) => `<text x="110" y="${top + 112 + i * 50}" font-family="Inter" font-weight="600" font-size="38" fill="#fff">${esc(s)}</text>`).join("");
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><rect x="80" y="${top}" width="920" height="${h + 20}" rx="18" fill="#000" fill-opacity=".62"/><text x="110" y="${top + 50}" font-family="Inter" font-weight="800" font-size="30" letter-spacing="3" fill="#ffd400">${esc(tag)}</text>${t}</svg>`;
}
const itens = [...letra.map((x) => [...x, svgLetra]), ...drops.map(([a, b, tag, l]) => [a, b, l, (x) => svgDrop(tag, x)])];
const ins = ["-i", D + "reel-even-flow-mudo.mp4"], fil = [];
let prev = "0:v";
for (const [i, [a, b, l, f]] of itens.entries()) {
  const png = `${D}leg/${i}.png`;
  await sharp(Buffer.from(f(l))).png().toFile(png);
  ins.push("-loop", "1", "-t", "38", "-i", png);
  const fi = `fade=t=in:st=${a}:d=0.25:alpha=1,fade=t=out:st=${b - 0.25}:d=0.25:alpha=1`;
  fil.push(`[${i + 1}:v]format=rgba,${fi}[o${i}]`, `[${prev}][o${i}]overlay=0:0:enable='between(t,${a},${b})'[v${i}]`);
  prev = `v${i}`;
}
const out = D + "reel-even-flow-v2-mudo.mp4";
const r = spawnSync("ffmpeg", ["-v", "error", "-y", ...ins, "-filter_complex", fil.join(";"), "-map", `[${prev}]`, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-shortest", out], { encoding: "utf8" });
console.log(r.status, r.stderr.slice(-500));
