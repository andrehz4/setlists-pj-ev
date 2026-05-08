# Analytics

GA4 instalado no `index.html` no `<head>`. Substituir o placeholder `G-XXXXXXXXXX` (duas ocorrências: src do gtag.js e config) pelo Measurement ID real depois de criar a property em [analytics.google.com](https://analytics.google.com).

## Custom events

Wrapper `window.track(name, params)` chama `gtag('event', ...)`. Tudo opcional — funções continuam mesmo se gtag não carregar.

| Evento | Dispara quando | Parâmetros |
|---|---|---|
| `tab_change` | usuário troca de view (Timeline / Ranking / Cobertura / Destaques / Buscar / Raridades / Galeria) | `view` |
| `drawer_open` | abre detalhes de um show | `show_id`, `artist`, `year` |
| `audio_play` | clica numa faixa que tem áudio R2 | `show_id`, `song` |
| `search` | busca de música, debounced 800ms, mínimo 2 chars | `query` |
| `album_doc_open` | abre análise de um álbum | `album` (ten/vs/vitalogy/nocode/yield) |
| `page_view` (auto) | navegação inicial | (default) |

## Como ver os dados

- **Realtime**: GA4 → Reports → Realtime. Aparece em ~30s.
- **Eventos custom**: GA4 → Reports → Engagement → Events. Os custom events aparecem após o primeiro fire.
- **Marcar como conversion**: Admin → Events → toggle "Mark as conversion" no evento que importar.

## Privacidade

Sem coleta de PII. Só URL, dispositivo, e os params acima. Sem User-ID, sem Google Signals. Para LGPD/CCPA, deixar como está é geralmente OK (analytics anonimizado, propósito de melhoria do produto).

## Para desativar localmente

Abrir DevTools → console → `window.track = () => {}`. Ou bloqueie `googletagmanager.com` em uma extensão (uBlock Origin etc).
