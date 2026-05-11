# PROGRESSO, setlists-pj-ev

## Data
2026-05-11

## O que foi feito (esta sessao)

### Sprint i18n PT, encerrada em 100%
- Batches 14 a 21 commitados (mais 80 musicas dict traduzidas, formato bilingue text + text_pt + byShow + byShow_pt)
- Batch 22: as 7 entradas que estavam como string crua foram convertidas pro formato dict canonico. Para 3 com show documentado em SHOWS, tambem foram adicionados byShow + byShow_pt:
  - `its ok` (tag de Black no pj-2015-11-14)
  - `fuckin up` (slot 33 do pj-2015-11-11)
  - `i want you so hard (bad boy news)` (pj-2015-11-20 e pj-2015-11-22)
- Para as 4 do Earthling 2022 sem show documentado (`long way`, `brother the cloud`, `invincible`, `the haves`), so text + text_pt
- Cobertura final: 220/220 (100%), 0 entradas string, 216 com byShow

### Drive import (commit 39bd966)
- 13 fotos pessoais importadas em 8 shows: pj-2018-03-21 (4 de 5), pj-2018-03-24 (1 nova), ev-2018-03-28 (1), ev-2018-03-29 (1, screenshot), ev-2018-03-30 (1), ev-2014-05-12 (3 fotos WhatsApp), pj-2024-08-29 (1), pj-2024-08-31 (1)
- Originais redimensionadas pra 1024 wide (full) + 400 wide (thumb), JPG progressive
- Manifest my_photos atualizado: pj-2018-03-21 5->4, pj-2018-03-24 0->1, ev-2018-03-29 0->1, ev-2014-05-12 2->3

### Performance (commits 7e8731f + 0a88bd5)
- 25 posters reotimizados: 4.56 MB -> 2.98 MB (-35%, max 600 wide, JPG q80 progressive)
- Lazy loading dos posters da Timeline via IntersectionObserver com rootMargin 300px (`.card-bg[data-bg]` -> setBackgroundImage on intersection). Cards fora da viewport nao baixam o JPG ate o usuario rolar
- Lighthouse contra Cloudflare Pages, before vs after:
  - Performance score: 52 -> 63 (+11)
  - LCP: 9.3s -> 7.5s (-1.8s)
  - CLS: 0.242 -> 0 (perfeito)
  - TTI: 9.5s -> 7.5s (-2s)
  - total-byte-weight: 5293 KB -> 942 KB (-82%)
  - Posters carregados no first view: 25 -> 0

## Estado atual
- HEAD: `0a88bd5`, working tree limpo, branch `main` sincronizado com origin
- Sprint i18n PT 100% concluida
- Drive import fechou os 8 shows com material disponivel; 22 shows ainda declaram my_photos sem nada em disco/Drive (decisao futura: importar de outra fonte ou limpar manifest)
- Performance subiu de 52 para 63; CLS perfeito agora

## Proximo passo (opcoes)
1. Validar visualmente i18n PT no navegador (alternar PT, percorrer shows, especialmente as 7 reestruturadas no batch 22)
2. Performance round 2: cortar 92 KB de unused-javascript identificado pelo Lighthouse, otimizar favicon (134 KB hoje), considerar split do interpretations.json (1.4 MB raw / 318 KB transferido)
3. MEDIA gap residual: decidir o que fazer com os 22 shows sem my_photos disponivel (importar de outra fonte ou limpar manifest)
4. GA4: trocar placeholder G-XXXXXXXXXX pelo Measurement ID real (30s)

## Arquivos chave
- `media/interpretations.json` (1.4 MB, 220 entradas, 220 com PT, 216 com byShow)
- `index.html` linha 4574 (data-bg lazy) e 4607 (IntersectionObserver setup)
- `media-manifest.json` (atualizado)
- `media/*/mine/*.jpg` (13 novos arquivos do Drive, em 8 shows)

## Blockers
Nenhum

## Comando exato pra continuar
cd C:\Gitlab_hz\pearljam\setlists-pj-ev && claude
