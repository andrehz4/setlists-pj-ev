# HANDOFF — Setlists PJ + EV

Atualizado em **2026-05-07**.

Snapshot completo do projeto: o que é, onde mora, o que está feito, o
que ainda falta e como retomar do zero. Tudo aqui é versionado junto
com o código.

---

## 1. Status atual: ONLINE 🟢

| Recurso | URL / Local | Status |
|---|---|---|
| **Site no ar** | https://setlists-pj-ev.pages.dev/ | ⚠️ pendente reapontar Cloudflare pro novo repo (ver §13) |
| **Repo Git** | https://github.com/andrehz4/setlists-pj-ev | ✅ público |
| **Pasta local** | `C:\Gitlab_hz\pearljam\setlists-pj-ev` | ✅ |
| **Deploy automático** | Cloudflare Pages → push em `main` reimplanta em ~1 min | ⚠️ desconectado após migração de conta GitHub |
| **HTTPS** | Cloudflare auto-provisionado | ✅ |
| **Identidade do git** | `André <eng.andrehz@gmail.com>` (config global) | ✅ |

Cada `git push` no `main` atualiza o site sozinho. Não precisa fazer
mais nada manual pra publicar mudanças.

## 2. O que é

Site estático single-file que cataloga shows do Pearl Jam + Eddie
Vedder assistidos pelo dono. Mostra setlists, capas de álbuns, posters
oficiais, fotos pessoais e vídeos por show. Filtros por artista e ano,
lightbox de imagens, drawer com setlist completo, tema claro/escuro
(default claro).

**Visual atual:** **Ticket Archive** (versão B do redesign do Claude
Designs — papel kraft, perfurações, stubs de ingresso, fontes Big
Shoulders + Oswald + Caveat, animações em cascata, selo "ARCHIVED"
carimbando ao abrir o drawer, `prefers-reduced-motion` respeitado).

## 3. Estrutura de arquivos

```
setlists-pj-ev/
├── index.html              # 342 KB, 4878 linhas — app completo (HTML+CSS+JS+DADOS+lyrics)
├── media-manifest.json     # 4 KB — referência humana do manifest (cópia)
├── README.txt              # instruções de uso original
├── HANDOFF.md              # este arquivo
├── MEDIA_AUDIT_2026-04-29.md  # auditoria de gaps de mídia (gerada por subagente)
├── .gitignore              # ignora .claude/, *.zip, Thumbs.db, etc
└── media/                  # 222 MB total
    ├── albums/             # 16 capas (12 antigas + 4 novas: earthling, gigaton, intowild, ukulele)
    ├── lyrics.json         # arquivo de letras (novo, do redesign)
    ├── pj-YYYY-MM-DD/      # 17 shows Pearl Jam
    │   ├── poster.jpg + (poster-1.jpg, poster-2.jpg, ...)
    │   ├── photo-N.jpg + photo-N-thumb.jpg
    │   ├── mine/photo-N.jpg + thumb (vazio na maioria — ver §6)
    │   └── videos/video-N.mp4 (só 2024-08-29 e 2024-08-31)
    └── ev-YYYY-MM-DD/      # 8 shows Eddie Vedder
```

## 4. Dependências externas

| Tipo | Item | Status |
|---|---|---|
| Runtime | Browser moderno | qualquer Chromium/FF |
| CDN externo | Google Fonts | opcional, com fallbacks |
| Backend | Nenhum | — |
| Build/bundler | Nenhum | — |
| Banco de dados | Nenhum | — |
| Persistência local | localStorage (apenas tema UI) | não guarda conteúdo |

Caminhos todos relativos (`media/<show-id>/...`). Mover a pasta para
qualquer lugar funciona sem ajuste.

## 5. Como rodar localmente

**Modo simples:** duplo clique em `index.html`.

**Se o browser bloquear por CORS:**
```bash
cd setlists-pj-ev
python -m http.server 8000
# abrir http://localhost:8000
```

## 6. Conteúdo atual vs o que falta

### Shows catalogados: **25**

| Artista | Shows com setlist completo | Status mídia |
|---|---|---|
| Pearl Jam | 17 (2005, 2011×4, 2013×3, 2015×5, 2018×2, 2024×2) | fotos oficiais OK; **MP3s 2005 importados em 2026-05-07** (commit `73a8407`); fotos pessoais ainda faltando |
| Eddie Vedder | 8 (2014×5, 2018×3) | só posters; fotos oficiais e pessoais faltando |

### Mídia presente no repo (✅)

- 16 capas de álbuns
- Posters de todos os 25 shows
- Fotos oficiais dos 17 shows PJ + ev-2014-05-06 (385 jpgs)
- **19 vídeos MP4** dos shows pj-2024-08-29 (6) e pj-2024-08-31 (13)
- **26 MP3s** do show pj-2005-12-02 (importados em 2026-05-07, ~165 MB)
- `lyrics.json`

### Mídia faltante (⏸️ ver `MEDIA_AUDIT_2026-04-29.md`)

| Categoria | Quantidade | Onde provavelmente está |
|---|---|---|
| Fotos pessoais (`mine/`) shows 2011-2015 | ~80 arquivos | possivelmente outro PC do dono |
| Fotos oficiais 7 shows EV novos | ~33 arquivos | possivelmente outro PC |
| ~~26 MP3s do show pj-2005-12-02~~ | ~~26~~ | ✅ **importados 2026-05-07** (commit `73a8407`) |
| `pj-2024-08-31/poster-1.jpg` | 1 | precisa criar (manifest declara 2 posters) |
| 12 arquivos parcialmente identificados no Drive | 12 | ver §7 |

## 7. Arquivos no Drive prontos pra importar (12 arquivos)

Auditoria completa em `MEDIA_AUDIT_2026-04-29.md`. Resumo dos IDs:

**Pasta raiz no Drive:** `Pearl Jam` id `1SinuUytmkfTGjPe3LeoChT4BRlP7PGyX`

**Subpastas:**
- `rio 18` (`1gKGY89gjwRcuBHtRrxHDReQbpqzQmNiM`) → 4 fotos pessoais para `pj-2018-03-21`
- `sp 18` (`1noYaWzjiQ7QOAOEIhAO6sGtncxpeNByB`) → 4 arquivos misturados (pj-2018-03-24, ev-2018-03-28/-29/-30) — 1 ambiguidade
- `Teste` (`14jIhGD-PiLcEajn_kxHup3vQpdZi6dQs`) → 3 fotos WhatsApp prováveis para `ev-2014-05-12`
- `29/08/2024` (`1ip1Re6QwQ_D4atWPDFOidnVGX20rZEgE`) → 1 foto pessoal (já mapeada): id `1Q9oMvVGlJsJUVN_8WIOqG8npu9TlbegH`
- `31/08/2024` (`1_JuyO_3xIpwqhRsGLygDuBBj0XbbdAr5`) → 1 foto pessoal (já mapeada): id `1C42L5YohQMVrFIHgglt2JWSNRGCN1vH8`

Os 19 vídeos das pastas `29/08/2024` e `31/08/2024` JÁ FORAM IMPORTADOS
(commit `0efa7b3`).

## 8. Como editar conteúdo

**Adicionar/editar shows, setlists, manifest:**
- Edite o objeto `MEDIA_MANIFEST` em `index.html:1595` (não o
  `media-manifest.json` externo — ele é só leitura humana e está
  dessincronizado por design).
- Os shows e setlists estão num objeto JS na linha 1547 do `index.html`
  (~21 KB inline).

**Adicionar mídia:**
- Coloque o arquivo no caminho esperado pelo manifest:
  - Foto oficial: `media/<show>/photo-N.jpg` + `photo-N-thumb.jpg`
  - Foto pessoal: `media/<show>/mine/photo-N.jpg` + thumb
  - Vídeo: `media/<show>/videos/video-N.mp4`
  - Áudio: `media/<show>/audio/<filename>.mp3`
- Aumente o contador correspondente no `MEDIA_MANIFEST` no `index.html`.

**Publicar:**
```bash
git add .
git commit -m "<mensagem>"
git push origin main
# Cloudflare Pages re-implanta em ~1 minuto
```

## 9. Próximos passos pendentes (em ordem de prioridade)

1. **Reapontar Cloudflare Pages** pro novo repo `andrehz4/setlists-pj-ev` (ver §13) — sem isso o site para de receber updates automáticos
2. **Quando chegar em casa:** verificar outro PC. Procurar:
   - Fotos pessoais antigas (2011-2015)
   - Fotos dos shows EV novos
3. Importar os 12 arquivos do Drive (§7) — ~10 min de trabalho automatizado
4. **ZIP backup local** + hash SHA-256 antes de formatar (camada extra de segurança)
5. **Domínio custom** no Cloudflare Pages (usa subdomínio do Hostinger ou novo)
6. Procurar `pj-2024-08-31/poster-1.jpg` (apenas 1 arquivo)

## 10. Camadas de backup hoje

| Camada | Onde | Status |
|---|---|---|
| 1. Cópia local | `C:\Gitlab_hz\pearljam\setlists-pj-ev` | ✅ |
| 2. **Git remoto** | github.com/andrehz4/setlists-pj-ev | ✅ |
| 3. **Site live** | setlists-pj-ev.pages.dev | ⚠️ pendente reapontar pro novo repo |
| 4. ZIP local em HD/pendrive | — | ⏸️ recomendado antes de formatar |
| 5. Cópia em outra nuvem | — | opcional |

**Pode formatar com tranquilidade depois de adicionar a camada 4.** A
restauração após format é trivial:
```bash
git clone https://github.com/andrehz4/setlists-pj-ev.git
```

## 11. Histórico de commits (referência)

```
73a8407  audio: 26 mp3s do show pj-2005-12-02 Pacaembu [165 MB]
e469a89  handoff atualizado + auditoria de gaps de midia
0efa7b3  videos shows 2024-08-29 (6) e 2024-08-31 (13) [197 MB]
d054113  redesign Ticket Archive + 7 shows EV novos + 4 capas + lyrics.json
7f1062e  snapshot inicial pre-format
```

## 12. Convenções importantes

- **Visibilidade do repo:** público (decisão consciente — capas/posters
  oficiais ficam indexáveis, fotos pessoais idem)
- **Identidade git:** `eng.andrehz@gmail.com` na config global
- **`.claude/`:** ignorado pelo git — é config local do Claude Code, não
  pertence ao repo
- **Animações:** todas respeitam `prefers-reduced-motion`
- **Tema padrão:** claro (light), com toggle pra escuro

## 13. Migração de conta GitHub (2026-05-07)

O repo foi migrado de `azimermann4/setlists-pj-ev` para
`andrehz4/setlists-pj-ev`. O repo antigo foi/será deletado.

**Pendência crítica:** o Cloudflare Pages ainda aponta pro repo antigo
e portanto **não recebe mais updates** dos pushes em `main`. Pra
restaurar o deploy automático:

1. Cloudflare dashboard → Pages → projeto `setlists-pj-ev`
2. Settings → Builds & deployments → Source
3. Reconectar GitHub na conta `andrehz4` e selecionar
   `andrehz4/setlists-pj-ev`, branch `main`
4. Opcional: trigger um deploy manual pra forçar o primeiro build

Sem essa reconfiguração os commits novos (incluindo os 26 MP3s
importados em `73a8407`) não aparecem no site live.

---

*Atualizado por sessão Claude Code em 2026-05-07.*
