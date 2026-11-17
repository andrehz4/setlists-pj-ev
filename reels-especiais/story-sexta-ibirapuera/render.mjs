// Renderiza story.html (6 telas 1080x1920 empilhadas) em saida/01.jpg ... 06.jpg.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const dir = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_BIN || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TELAS = 6;
const saida = path.join(dir, "saida");
fs.mkdirSync(saida, { recursive: true });
const png = path.join(saida, "._tudo.png");
execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=1080,${1920 * TELAS}`,
  "--virtual-time-budget=8000", `--screenshot=${png}`, `file://${path.join(dir, "story.html")}`], { stdio: "ignore" });
for (let i = 0; i < TELAS; i++) {
  const jpg = path.join(saida, `${String(i + 1).padStart(2, "0")}.jpg`);
  await sharp(png).extract({ left: 0, top: i * 1920, width: 1080, height: 1920 }).jpeg({ quality: 92 }).toFile(jpg);
  console.log(jpg);
}
fs.rmSync(png, { force: true });
