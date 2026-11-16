# Estudo da carreira inteira do Eddie Vedder (setlist.fm) para o carrossel de terça

Você roda sozinho, sem ninguém para responder. Tudo em PT-BR, sem travessão em texto. Pasta de trabalho:
/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/eddie-carreira

## Objetivo
Mapear TODOS os setlists do Eddie Vedder solo e do Pearl Jam no setlist.fm, desde o começo, e montar o ranking completo
de músicas que vai virar carrossel no Instagram na terça 17/11 (véspera do show solo dele no Ibirapuera, sex 20 e dom 22/11).
O reel de segunda prometeu "amanhã tem o ranking completo". Base e contexto do estudo anterior (17 shows solo):
/Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/eddie-ibirapuera/ficha.json (leia só as chaves que precisar).

## Regras de custo (obrigatórias)
- Escreva um script Node (`coletar.mjs`) que baixa as páginas da API para `bruto/` em disco. NUNCA leia o JSON bruto no
  seu contexto. Leia só os agregados que outro script seu (`agregar.mjs`) gerar, e só com `head`/recortes.
- API: GET https://api.setlist.fm/rest/1.0/artist/{mbid}/setlists?p=N, header `x-api-key` (chave em
  /Users/andrehz/.setlistfm-key, nunca imprima a chave), `Accept: application/json`, User-Agent de navegador (bot leva
  403). Limite 2 req/s e 1440/dia: espere 600 ms entre pedidos, retome de onde parou se cair (pula página já salva).
  Cliente de referência: /Users/andrehz/Documents/Githubhz/setlists-pj-ev/scripts/news/setlistfm.mjs
- MBIDs: ache com GET /rest/1.0/search/artists?artistName=... (Pearl Jam e Eddie Vedder) e grave em `mbids.json`.
- Não use subagentes nem Workflow.

## O que entregar (na pasta de trabalho)
1. `estudo.json`: por artista (solo, Pearl Jam, e os dois somados): total de shows com setlist, ranking de músicas
   (vezes tocadas, primeira e última vez com data e cidade, % dos shows), ranking por era (solo: 2008-2012, 2013-2019,
   2020-2026; Pearl Jam: por década), Brasil à parte (todos os shows no Brasil, solo e PJ), aberturas e encerramentos
   mais comuns, covers mais tocados. Ignore setlists vazios (conte quantos foram ignorados).
2. `HISTORIAS.md` (até 80 linhas): os 10 achados mais fortes para um carrossel de fã (números que surpreendem, música
   que sumiu, estreia recente, recorde no Brasil, o que só o solo tem). Cada achado com o número exato e de onde saiu.
   Marque o que é palpite. Nada de inventar: se o dado não sustenta, não entra.
3. `CARROSSEL.md`: proposta de 8 a 10 slides (texto de cada slide, curto, PT-BR natural) com o ranking completo e as
   melhores histórias, terminando no gancho do show solo no Ibirapuera. Sem letra de música (direito autoral).
4. `LEIA.md` (até 25 linhas): como rodar de novo, quantos pedidos fez, o que ficou de fora e por quê.

## Limites
- Só escreva dentro da pasta de trabalho. Não faça commit, não publique nada, não mexa em outros arquivos do repo.
- Se a chave não existir ou a API negar, escreva o motivo em `LEIA.md` e pare.
- Termine com um resumo de 10 linhas no stdout.
