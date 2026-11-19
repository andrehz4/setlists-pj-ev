# analise-musica: série de reels "Som x Letra"

Módulo apartado (Regra 0). Mede, segundo a segundo, **como a música soa** e **o que a letra diz**, em desvios-padrão (SD)
contra a média do próprio disco, e gera um reel animado (modelo do Claude Design) no tempo da música.
Inspirado no post do datascrolls sobre Black. Em Black o nosso som bateu com o deles com erro médio de 0,07 SD.

**Tudo que é pesado fica no SSD** (`/Volumes/SSD Terra Gentil/setlists-pj-ev/musica-x-letra`): áudios dos 12 discos de
estúdio + Ten Redux, base DEAM, venv Python 3.12, modelos, letras (direito autoral, nunca no git), saídas e narração.
Python: `"/Volumes/SSD Terra Gentil/setlists-pj-ev/musica-x-letra/.venv/bin/python"`. `HF_HOME` também no SSD.

## Pipeline (ordem)
1. `embed.py <nome> <pasta>`: MERT-v1-95M (m-a-p) em trechos de 5 s (`audio.py` lê qualquer formato via ffmpeg).
2. `treino_seg.py`: 9 cabeças (ridge/SVR/KRR x 3 amostras) nas notas POR SEGUNDO da DEAM -> `modelos/humor-seg.joblib`
   (padrão; `treino.py` é o antigo, por música inteira).
3. `VARIANTE=-seg humor.py <disco> <referencia>`: curva de 30 s em SD contra o disco -> `saida/humor-<disco>-seg.csv`.
4. `medidas.py`: volume (EBU R128) e agudos (centroide) em janelas de 8 s.
5. `letras.py <pasta_disco> <nome>`: letra com tempo (LRCLIB). Notas por verso: leitores de IA (subagentes) gravam
   `saida/letras/<disco>/notas-leitor-N.csv` (faixa,tempo_s,nota -3..+3,emocao). 1 leitor basta (margem não aparece no vídeo).
6. `ranking.py`: melhor janela de 42 s COM letra por música -> `saida/ranking.csv` (tira faixas bônus).
7. Reel: `design/` = export do Claude Design (projeto "Reel animado som x letra"). `aplicar_dados.py` põe os números
   finais no JSON que o Design devolve; `preparar_clipes.mjs` faz os clipes 9:16 com ROSTO CENTRALIZADO (trilha do
   acervo); `render_reel.mjs` renderiza quadro a quadro pelo Chrome (DevTools, sem dependência).
8. Narração ElevenLabs (Liam, acelerada 1,2x com atempo): gancho por música + CTA "Qual o seu sentimento escutando X?"
   (por música) + "Deixa nos comentários!" (FIXO, `narracao/fixas/`). Efeitos: poucos (5 a 7), coração em DESESPERO e
   MAIOR DISTÂNCIA.
9. Postagem: SÓ pelo app do celular (música da biblioteca do IG; no Business Suite a música só vale pro Facebook).
   A música começa em (início do trecho - duração da abertura), ex.: Black 2:40. Áudio original 100, música ~35.

Regras do Andre: dados pequenos na tela sim; NADA de como foi feito (método, margem de erro, modelos).

## Reel automático por música (desde 19/11)
`node analise-musica/fazer_reel.mjs analise-musica/roteiros/<slug>.json` faz tudo: `voz.mjs` (gancho frase a frase +
pergunta do CTA, Liam 1,2x, chave `/Users/andrehz/.elevenlabs-key`) -> `montar_dados.py` (molde do Black + curvas, volume,
agudos, versos, seções e maior distância desta música) -> `preparar_clipes.mjs` -> `render_reel.mjs` -> mixagem (gancho,
pancada no início do gráfico, 2 pancadas leves nos momentos, coração na maior distância, CTA + "Deixa nos comentários").
Saída no SSD em `saida/reels/<slug>/`: `<slug>-para-postar.mp4`, `<slug>-PREVIA-com-musica.mp4`, `legenda.txt`, `LEIA.txt`
(minuto da música no IG). O roteiro é o único trabalho manual: trecho (`ini`, precisa ser >= duração da abertura),
seções, frases do gancho, momentos, legenda e clipes do acervo. Cada etapa pula se o arquivo já existe.
