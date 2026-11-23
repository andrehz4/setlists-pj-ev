// Mensagem do direct da banda (mesmo texto da Blaymorphed, trocando nome, link e shows) e partes de até 950
// caracteres cortadas entre parágrafos (a DM do Instagram corta em 1.000). Uso: BANDA=<slug> node ferramentas/mensagem.mjs
import { writeFileSync } from 'node:fs';
import { B, RAIZ } from './banda.mjs';
import { linha } from './tempos.mjs';
const n = B.nome, semShow = !B.tela.modelo || B.tela.postImg === 'Próximo show';
const min = Math.round(linha().total / 60);
const p = [
  `Oi, pessoal do ${n}! Aqui é o Só mais um fã do Pearl Jam (@smufdpj).`,
  `A gente fez uma página de setlist só de vocês:\n${B.URL}`,
  `Ela funciona como a que fizemos pro show do Eddie Vedder no Ibirapuera. O fã escolhe o show de vocês, sorteia ou monta o palpite dele com o repertório do Pearl Jam, e sai uma folha de setlist com letra de mão, o logo do ${n}${semShow ? ' e, quando tiver show na agenda, a casa e a data' : ', a casa e a data'}.`,
  `O vídeo que mandamos junto mostra tudo em ${min} minutos. Resumindo:`,
  [`• Os shows que aparecem na página vêm da nossa agenda. ${B.msg.shows}`,
    '• Em "As músicas" dá pra ouvir gravações ao vivo do Pearl Jam antes do show.',
    `• Tem um botão que gera um story em vídeo pronto, o botão do Instagram, que já copia o @${B.arroba} pra marcação, e um convite pronto pro WhatsApp.`,
    '• O nome que o fã digita passa por um filtro: palavrão e coisa pesada não entram. Dá pra divulgar sem medo.'].join('\n'),
  'Uma coisa que ajuda muito a gente: a agenda é montada a partir dos posts de vocês e das casas. Quando a legenda traz o dia, o horário, o nome da casa (com o @) e a cidade, a página sai certinha. Quando falta alguma coisa, o show fica incompleto lá.',
  B.msg.falta,
  'Se fizer sentido pra vocês, algumas ideias de uso: postar o link da página nos stories na semana do show, repostar os palpites da galera que marcar vocês, imprimir algumas folhas e dar pros fãs depois do show, de lembrança, ou montar o set que vocês tocaram e postar no fim da noite, pra galera ver quanto acertou.',
  'A página é de vocês, usem do jeito que quiserem. Qualquer dúvida ou ideia, é só responder aqui.',
].filter(Boolean);
if (/[—–]/.test(p.join(''))) throw new Error('travessão na mensagem');
const partes = []; let atual = '';
for (const par of p) { const junto = atual ? atual + '\n\n' + par : par; if (junto.length > 950 && atual) { partes.push(atual); atual = par; } else atual = junto; }
partes.push(atual);
writeFileSync(`${RAIZ}mensagem-${B.slug}.txt`, p.join('\n\n') + '\n');
partes.forEach((t, i) => writeFileSync(`${RAIZ}mensagem-${B.slug}-parte${i + 1}.txt`, t));
console.log(B.slug, 'partes', partes.map((t) => t.length).join(' '));
