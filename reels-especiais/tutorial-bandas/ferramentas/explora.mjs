// Explora a página: tira prints e lista elementos visíveis em cada etapa.
import { abrir, dorme } from './cdp.mjs';
import { writeFileSync } from 'node:fs';
const D = process.argv[2]; const b = await abrir(D);
const foto = async (n) => { const r = await b.cmd('Page.captureScreenshot', { format: 'jpeg', quality: 60 }); writeFileSync(`${D}/${n}.jpg`, Buffer.from(r.data, 'base64')); };
await b.ir('https://somaisumfadepearljam.com.br/setlist/blaymorphed/?r=' + Date.now()); await dorme(3000); await foto('1-chegada');
await b.toca('#abrir-sorteio'); await dorme(1500); await foto('2-gaveta');
console.log(await b.ev(`document.querySelector('#sorteio').innerText`));
console.log(await b.ev(`document.querySelector('#shows').innerHTML.slice(0,1500)`));
await b.toca('#nome'); await b.digita('#nome', 'SMUFDPJ'); await dorme(500);
await b.toca('#sortear'); await dorme(15000); await foto('3-folha');
console.log(await b.ev(`document.querySelector('#acoes').innerHTML.slice(0,2500)`));
console.log('ALTURA', await b.ev(`document.body.scrollHeight`));
console.log(await b.ev(`[...document.querySelectorAll('#lidas button, #lidas [data-tocar], #bloco-lidas button')].slice(0,3).map(e=>e.outerHTML.slice(0,300)).join('\\n')`));
console.log(await b.ev(`document.querySelector('#bloco-lidas').innerText.slice(0,500)`));
b.matar(); process.exit(0);
