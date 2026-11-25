# Brief: reel agitado de uma música do Ten (molde do Even Flow)

Objetivo: um reel vertical 1080x1920 de ~37 s pro Instagram @smufdpj (página de fã "Só mais um fã de Pearl Jam"),
igual ao do Even Flow já aprovado: cortes rápidos no tempo da música com clipes de 1991-92 do Eddie escalando,
pulando, surfando na galera; letra traduzida no meio da tela; cartões de curiosidade ("drops"); final com logo,
"SEGUE A GENTE", seta até o botão Seguir e voz "Bora seguir a gente!".

## Referência pronta (ler antes, não alterar)
- Montagem do vídeo mudo: /Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/montagem/gera-refrao.py
- Overlay (drops, letra, final, pisca-pisca no Seguir só nos intervalos sem cartão, seta final):
  /Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/fim-C-refrao.html
  (objeto REEL: duracao, drops[{t,dur,rotulo,texto}], letra[{t,dur,texto}], final{t}; estilo do cartão em `dropStyle()`:
  trocar o fallback 'ingresso' pelo estilo pedido, e o default em data-props)
- Captura do overlay: `node /Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/capturar.mjs <html absoluto> <pasta> 0 <duracao> 30`
  (PNG transparentes; o HTML usa caminhos relativos `uploads/...` e fontes: copie o HTML para DENTRO de
  reels-especiais/agitados-overlay/ com nome `fim-<musica>.html`, para os caminhos funcionarem)
- Voz final: /Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/voz/bora-seguir-a-gente-jessica.mp3 (entra ~0,7 s depois de final.t)
- Legenda do post de exemplo: /Users/andrehz/Documents/Githubhz/setlists-pj-ev/reels-especiais/agitados-overlay/legenda-even-flow.txt
- Acervo de clipes (mudos, 9:16): /Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/reels-clips/agitados/clips.json + *.mp4
- Letras traduzidas: /Users/andrehz/Documents/Githubhz/setlists-pj-ev/media/letras/pt.json (chave em minúsculas)
- Tempos por palavra: `whisper-cli -m /Users/andrehz/.cache/hyperframes/whisper/models/ggml-small.bin -l en -ml 1 -oj -of <saida> -f <wav 16k mono>`
- Batidas: calcule o BPM (ex. autocorrelação de spectral flux com numpy em /Users/andrehz/.cache/whisper-venv/bin/python -I) e corte nas batidas.

## Passos
1. Áudio de estúdio (só pra sincronizar e pra prévia): `yt-dlp -f ba -x --audio-format m4a` do áudio oficial da música
   (versão do disco Ten) no YouTube, salvo em reels-especiais/agitados-<musica>/brutos/ (fora do git).
2. Escolha o trecho: começar NO refrão ou no gancho cantado mais forte (nada de introdução sem voz). Letra cantada
   o reel todo. Anote o segundo exato de início no disco (é o ponto que o Andre escolhe na música do app).
3. Vídeo mudo: copie gera-refrao.py para reels-especiais/agitados-<musica>/gera.py e ajuste BPM, INI, lista de clipes
   e o MOMENTO FORTE (indicado abaixo) caindo numa batida forte (volta de refrão, grito, virada). Primeiro corte com
   o Eddie em close/berro (nunca abrir em mão ou tela escura). Use clipes variados; evite repetir a sequência do Even Flow.
   Olhe os quadros (extraia JPGs) para conferir que cada corte mostra algo forte.
4. Overlay: letra traduzida em frases curtas sincronizadas com o canto (tradução de pt.json; pode encurtar, sem mudar o
   sentido). 5 ou 6 drops com curiosidades REAIS da música. TODA curiosidade precisa de fonte verificável (entrevista,
   livro, site oficial, Wikipedia com referência); anote URL e trecho em reels-especiais/agitados-<musica>/fontes.txt.
   Sem fonte = não entra. Nada de recorde/número de plays sem fonte. Citação só se a fonte trouxer a frase.
   Drop do momento forte entra ~2 s antes dele e fala do show mostrado (só afirme o que a fonte do acervo diz; show
   "não identificado" não ganha nome).
5. Final: final.t ~3 s antes do fim; "SEGUE A GENTE" na tela; voz "Bora seguir a gente!".
6. Render: (a) prévia COM a música do disco + voz: saida/<musica>-previa-com-musica.mp4;
   (b) arquivo pra postar SEM a música do disco, só a voz no fim: saida/<musica>-POSTAR-sem-musica.mp4
   (crf 23, preset slow, maxrate 12M, ~30 MB). Conferir duração e extrair 4 quadros num JPG de conferência.
7. Legenda do post em reels-especiais/agitados-<musica>/legenda.txt, no tom da do Even Flow (história da música e da
   letra, 4 parágrafos curtos, fecho "Segue a gente: o maior acervo de Pearl Jam do Brasil 🎸", hashtags). Toda
   afirmação com fonte em fontes.txt. Use a skill humanizer-ptbr se disponível.
8. Em reels-especiais/agitados-<musica>/POSTAR.txt: "No app, música <nome> (Ten), começar em m:ss" + estilo do drop.

## Regras
- PT-BR com acento, NUNCA travessão (—) em texto nenhum. Nunca o nome do dono da página em texto público.
- Não commitar, não dar push, não postar, não subir pro Drive/R2. Não alterar arquivos fora de
  reels-especiais/agitados-<musica>/ (exceção: criar reels-especiais/agitados-overlay/fim-<musica>.html).
- Não mexer no repositório baixa-clipehz. Não matar processos que você não abriu.
- Relatório final curto: caminhos dos arquivos, segundo de início no app, lista dos drops com a fonte de cada um,
  e qualquer dúvida/risco (ex.: fonte fraca, clipe repetido).
