// Grava a fala do gancho (Jessica, ElevenLabs) em voz-gancho.mp3. Uso: node voz-gancho.mjs "<texto>"
import { copyFileSync } from 'node:fs';
import { gravarFalas } from '../../scripts/publish/agenda-reel/voz.mjs';
const texto = process.argv[2];
const r = await gravarFalas([{ chave: 'gancho', texto }], { tmpDir: new URL('./saida/', import.meta.url).pathname });
console.log(r.aviso);
if (!r.falas) process.exit(1);
copyFileSync(r.falas[0].arquivo, new URL('./saida/voz-gancho.mp3', import.meta.url).pathname);
console.log('dur', r.falas[0].dur);
