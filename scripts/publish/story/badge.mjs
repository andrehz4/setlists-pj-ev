// Selo animado da abertura (assets/intro-badge.gif, ou .png estático). Usado no story e no reel.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import sharp from "sharp";
import { naRaiz } from "../../config.mjs";

function rodar(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "", stderr = "";
    child.stdout.on("data", (d) => { stdout += d.toString(); });
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("error", reject);
    child.on("close", (code) => (code === 0 ? resolve(stdout) : reject(new Error(`${cmd} saiu com ${code}: ${stderr.slice(-500)}`))));
  });
}

// fps do GIF via ffprobe (padrão 15).
async function fpsDoGif(file) {
  const out = await rodar("ffprobe", ["-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=r_frame_rate", "-of", "default=noprint_wrappers=1", file]);
  const r = (out.split(/\r?\n/).find((l) => l.startsWith("r_frame_rate=")) || "").split("=")[1];
  const [num, den] = String(r || "").split("/").map(Number);
  return den ? num / den : 15;
}

// GIF: extrai todos os frames (PNG base64, até 800x800). PNG: 1 frame (até 1000x1000). Nenhum: null.
export async function loadBadgeAnimated() {
  const gifPath = naRaiz("scripts/publish/assets/intro-badge.gif");
  const pngPath = naRaiz("scripts/publish/assets/intro-badge.png");
  try {
    const stat = await fs.stat(gifPath);
    if (stat.isFile() && stat.size >= 1024) {
      const fps = await fpsDoGif(gifPath);
      const dir = await fs.mkdtemp(path.join(os.tmpdir(), "smufdpj-badge-"));
      await rodar("ffmpeg", ["-y", "-i", gifPath, "-vsync", "0", path.join(dir, "f_%04d.png")]);
      const files = (await fs.readdir(dir)).filter((f) => f.endsWith(".png")).sort();
      const frames = [];
      for (const f of files) {
        const buf = await sharp(path.join(dir, f), { failOn: "none" })
          .resize({ width: 800, height: 800, fit: "inside", withoutEnlargement: true })
          .png({ compressionLevel: 9 }).toBuffer();
        frames.push(buf.toString("base64"));
      }
      await fs.rm(dir, { recursive: true, force: true });
      const totalKB = frames.reduce((s, b) => s + b.length, 0) / 1024;
      console.log(`[story-video] badge GIF: ${frames.length} frames @ ${fps.toFixed(1)}fps (${totalKB.toFixed(0)}KB total)`);
      return { frames, fps, totalFrames: frames.length };
    }
  } catch (e) {
    if (e.code !== "ENOENT") console.warn(`[story-video] badge GIF falhou (${e.message}), tentando o PNG`);
  }
  try {
    const stat = await fs.stat(pngPath);
    if (stat.isFile() && stat.size >= 1024) {
      const buf = await sharp(pngPath, { failOn: "none" })
        .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true }).png().toBuffer();
      console.log(`[story-video] badge PNG estatico (${(buf.length / 1024).toFixed(0)}KB)`);
      return { frames: [buf.toString("base64")], fps: 0, totalFrames: 1 };
    }
  } catch (e) {
    if (e.code !== "ENOENT") console.warn(`[story-video] badge PNG falhou (${e.message})`);
  }
  console.log("[story-video] badge nao encontrado em assets/intro-badge.{gif,png}");
  return null;
}
