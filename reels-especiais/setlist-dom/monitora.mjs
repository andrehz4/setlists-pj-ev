// Vigia o setlist de hoje no setlist.fm e sai (código 0) quando ele parece COMPLETO:
// tem bis, já passou das 22h e ficou 10 min sem mudar. Reserva: sem bis marcado, 15+ músicas e 20 min parado depois das 22h30.
// Grava setlist.json a cada mudança. Uso: node reels-especiais/setlist-dom/monitora.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buscar } from "./busca.mjs";

const dir = path.dirname(fileURLToPath(import.meta.url));
const hora = () => new Date().toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo", hour12: false });
const minutosBRT = () => { const [h, m] = hora().split(":").map(Number); return (h < 6 ? h + 24 : h) * 60 + m; }; // madrugada conta como depois da meia-noite
let assinatura = "", mudouEm = Date.now();
for (;;) {
  try {
    const s = await buscar();
    const ass = JSON.stringify(s.musicas);
    if (ass !== assinatura) {
      assinatura = ass; mudouEm = Date.now();
      fs.writeFileSync(path.join(dir, "setlist.json"), JSON.stringify(s, null, 2) + "\n");
      console.log(hora(), s.musicas.length, "músicas | última:", s.musicas.at(-1)?.nome || "-", "| bis:", Math.max(0, ...s.musicas.map((m) => m.bis)));
    }
    const parado = (Date.now() - mudouEm) / 60000, agora = minutosBRT(), temBis = s.musicas.some((m) => m.bis > 0);
    if (temBis && agora >= 22 * 60 && parado >= 10) { console.log(hora(), "COMPLETO"); process.exit(0); }
    if (!temBis && s.musicas.length >= 15 && agora >= 22 * 60 + 30 && parado >= 20) { console.log(hora(), "COMPLETO (sem bis marcado)"); process.exit(0); }
    if (agora >= 26 * 60) { console.log(hora(), "DESISTI (2h da manhã)"); process.exit(1); }
  } catch (e) { console.log(hora(), "erro:", e.message); }
  const espera = minutosBRT() >= 19 * 60 + 45 ? 60 : 240; // durante o show, a cada 1 min
  await new Promise((r) => setTimeout(r, espera * 1000));
}
