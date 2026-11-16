# Reel tutorial do gerador do Ibirapuera (HyperFrames)

Rascunho aprovado pelo Andre em 16/11/2026 (v2, 46 s). Não publicado.

- `index.html`: composição. Abertura de 3 s com 8 cortes do acervo (R2 `acervo/`, mudos), perfil @smufdpj desenhado,
  site gravado de verdade (`assets/site.mp4`), story desenhado com o MP4 real do gerador, fecho com o selo.
- Dedinho (`assets/dedo.svg`, Twemoji) e efeitos em `assets/sfx/` (biblioteca de áudio do youtube_terragentil, os
  mesmos da fabrica-quiz). Trilha: `scripts/publish/assets/story-tracks/09-pixabay-abydos-90s-garage-rock.mp3`.
- Regravar o site: `node ferramentas/grava.mjs <pasta>` (Chrome headless 390x844, toques reais, nome SMUFDPJ, noite 22/11),
  depois montar `site.mp4` dos frames e `node ferramentas/edita.mjs <pasta>` (corta e acelera, devolve os tempos dos
  toques em `edit.json`). Atualizar TOQUES e legendas no index.html se os tempos mudarem.
- Render: `npx --yes hyperframes@0.9.56 render -o renders/tutorial-gerador-v3.mp4 --video-frame-format png --fps 30`.
- Mídia não vai pro git (.gitignore); o render v2 está em `renders/` só no Mac.
