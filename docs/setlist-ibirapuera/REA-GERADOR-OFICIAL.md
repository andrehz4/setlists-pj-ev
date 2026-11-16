# REA: gerador oficial de setlist do Pearl Jam (generator.pearljam.com)

Engenharia reversa feita em 16/11/2026, navegando todas as telas no Chrome e lendo o bundle público (Next.js/Turbopack).
Base do nosso gerador do Ibirapuera (`setlist-ibirapuera/`). Nada aqui é segredo: tudo vem do que o site entrega ao navegador.

## Telas e fluxo

1. **Abertura**: logo PEARL JAM, "Discover Pearl Jam with your personalized setlist", botão LET'S GO. Vídeo de fundo.
2. **Dados**: campo "Your name" (máx. 25 caracteres, opcional) e select "City" (22 cidades; sem escolha usa Toronto).
   Botões: GENERATE RANDOM SETLIST (24 músicas sorteadas, vai direto pra tela final) e CUSTOMIZE YOUR OWN.
3. **Montar**: busca de músicas, VIEW ALL SONGS (modal com 173 músicas em 5 colunas, checkbox), contador "Selected n/24",
   dica "Drag each song to reorder", aviso "You have reached the song limit!" no 24º. Itens com X pra tirar e arrasto
   (framer-motion `Reorder.Group`). CREATE e GO BACK.
4. **Final**: folha à esquerda; à direita SHARE (Twitter e Facebook), SAVE PLAYLIST TO YOUR ACCOUNT (Spotify, Apple Music,
   YouTube com aviso "click Manage your YouTube account"), DOWNLOAD IMAGE, CREATE ANOTHER SETLIST.

## Tela final, vista com setlist aleatória (16/11)

- Layout em 2 colunas: folha à esquerda como `<img>` (dataURL do canvas) girada uns 2 graus com CSS, sombra, parecendo
  papel jogado na mesa; ações empilhadas à direita, botões largos de cor cheia (Spotify verde, Apple rosa, YouTube branco).
- Aleatório: 24 músicas, cidade escolhida no cabeçalho, papel `papers-5` sorteado (alguns já têm traço de bis pintado).
- DOWNLOAD IMAGE: baixa na hora, sem tela no meio, `Pearl Jam Setlist.jpg` 1100x1400 (~150 KB, JPEG 0.6).
- YouTube: o botão vira estado "carregando" e abre a janela de login do Google (gapi). Depois do consentimento cria a
  playlist e troca o botão pra "Saved"; o aviso de "Manage your YouTube account" fica sempre visível embaixo.
- CREATE ANOTHER SETLIST volta pro formulário zerado.

## Desenho da folha (canvas)

- Canvas 1100x1400. Papel sorteado entre `papers-5/1.jpg` a `5.jpg` (há também `papers/...-without-lines.jpg`).
- Cidade: PNG `cities/<cidade>.png` centralizado em y 50.
- Músicas: PNG pronto por música (`song-images-4|5|final-26/<slug>.png`, altura 110). Coluna 1 em x 100 (músicas 1 a 12),
  coluna 2 em x 660 (13 a 24), y = 255 + 90 * i. Não há traço de bis nem enfeites: só o que está pintado no papel.
- Exporta JPEG qualidade 0.6. Gera também uma capa quadrada 400x400 pra playlist do Spotify (folha girada e recortada).

## Dados das músicas

Embutidos no bundle (`0lankhq0sysu7.js`), sem chamada de API: 173 objetos
`{ name, imageUrl, spotifyID, appleID, youtubeID }`, separados em listas por disco. Extraído em
`reels-especiais/letra-eddie/musicas-oficiais.json` (fora do git). Todas as 173 têm os três IDs.

## Playlists

- **YouTube**: 100% no navegador, com `gapi` (Google API JS). `gapi.auth2.init({ client_id })` e
  `signIn({ scope: 'https://www.googleapis.com/auth/youtube' })`. Depois `youtube.playlists.insert` (snippet + status,
  pública ou privada pela config) e um `playlistItems.insert` por vídeo, em série com `setTimeout`, na posição certa.
  A playlist nasce na conta de quem clicou. O aviso de "Manage your YouTube account" existe porque contas Google com mais
  de um canal precisam escolher o canal no login.
- **Spotify**: pelo backend deles (`/api/spotify/login` e `/api/spotify/callback`, OAuth no servidor), com uma biblioteca
  própria de "connect" multicampanha (`pearlJamSetlistGenerator`). Cria a playlist com nome, descrição e capa (a imagem 400x400).
- **Apple Music**: MusicKit JS, cria em `/v1/me/library/playlists` com os `appleID`.

## Compartilhar e gravar

- Twitter: `twitter.com/intent/tweet?text=...&url=...`. Facebook: sharer.
- Ao compartilhar, sobe a folha e a capa no Firebase Storage (projeto `glitch-a8df6`) e grava em Firestore
  `campaigns/PearlJamSetListGenerator/submissions` `{ city, name, appleIDs, spotifyURLs, month, day, setListURL, ... }`.
  O link compartilhado é `generator.pearljam.com/<docID>`.
- Analytics: GA4 + Universal Analytics, eventos `Click Generate Random Setlist`, `Click Create Custom` etc.

## O que copiamos e o que muda no nosso (Ibirapuera)

| Oficial | Nosso |
|---|---|
| 22 cidades | só São Paulo I (sex 20/11) e II (dom 22/11), cabeçalho na nossa letra + IBIRAPUERA |
| 173 músicas do Pearl Jam | 401: tudo que o Eddie tocou solo (setlist.fm) + as 173 oficiais, por disco/solo/covers |
| PNG oficial por música | PNG oficial (carregado direto do CDN deles, CORS liberado) e a nossa fonte no resto |
| sem bis | traço de bis depois de qualquer música |
| baixar JPEG | baixar folha, versão story 1080x1920 e compartilhar pelo celular |
| playlist Spotify/Apple/YouTube com login | fase 1: YouTube sem login (`watch_videos?video_ids=`, até 50); fase 2: login Google como o oficial |

## Limites pra decidir a fase 2

- YouTube com login exige app OAuth do Google com escopo `youtube` (sensível): sem verificação do Google, só 100 usuários
  e tela de "app não verificado".
- Spotify em modo de desenvolvimento aceita até 25 usuários cadastrados à mão; o oficial tem cota estendida.
- Fase 1 (link `watch_videos`) não pede login, toca na ordem da setlist e cobre a ideia de "escutar o que gerou".
