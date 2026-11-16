// Bug (revisão de segurança, 16/11/2026): o filtro de nome do gerador do Ibirapuera aceitava qualquer letra Unicode,
// então "putа" e "hіtler" com uma letra cirílica no lugar da latina passavam pelo filtro e iam pro título e pro story.
// E nome com hífen virava frase de golpe ("Ganhe-ingresso-pix"). Agora só passa letra latina e corta no primeiro hífen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { soLetras, nomeProibido } from '../../setlist-ibirapuera/filtro.js';

// O que o campo deixa passar pro título (mesma regra do conferir() do filtro.js).
const passa = (nome) => { const limpo = soLetras(nome); return nomeProibido(nome) || nomeProibido(limpo) ? '' : limpo; };

test('letra cirílica no meio do palavrão não chega ao título', () => {
  for (const nome of ['putа', 'hіtler']) { // "а" e "і" cirílicos
    const final = passa(nome);
    assert.doesNotMatch(final, /[^A-Za-zÀ-ÿ\s']/, `sobrou letra não latina em ${nome}`);
    assert.ok(!['puta', 'hitler'].includes(final.toLowerCase()), `${nome} virou ${final}`);
  }
  assert.equal(soLetras('putа'), 'put');
  assert.equal(soLetras('hіtler'), 'htler');
});

test('hífen corta o nome: "Ganhe-ingresso-pix" vira só "Ganhe"', () => {
  assert.equal(soLetras('Ganhe-ingresso-pix'), 'Ganhe');
});

test('nome de gente continua passando', () => {
  for (const nome of ['André', 'Ísis', "D'Ávila", 'João Pedro', 'Çeylan']) assert.equal(passa(nome), nome);
});
