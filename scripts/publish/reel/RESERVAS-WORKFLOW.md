# Reservas do reel semanal

**Caminho preferido (08/11): TriggerAll.** O reel nunca esteve nele e o cron do GitHub atrasa 3h40 a 5h47 todo domingo.
Um trigger só dispara o `publish-reel.yml` às 09:07, 12:07, 15:07 e 18:07 BRT (o script é idempotente e retoma o vídeo
preso). Não precisa editar workflow. Rodar no terminal do Mac; a senha é digitada só lá (`/api/auth/login` do backend,
cookie `auth_token`). O script copia o trigger do `publish-story.yml` (mesmo repo e mesma variável de token) e troca o
workflow. NÃO testado contra o servidor real (a nuvem não alcança o Railway); o trecho que monta o JSON foi testado.

```bash
B=https://triggerall-production.up.railway.app
read -s -p "Senha do TriggerAll: " S; echo
curl -sf -c /tmp/ta.jar -H 'Content-Type: application/json' -d "{\"password\":\"$S\"}" $B/api/auth/login >/dev/null \
  && echo "login ok" || { echo "senha incorreta"; exit 1; }
curl -sf -b /tmp/ta.jar $B/api/triggers | python3 -c '
import sys, json
ts = json.load(sys.stdin)
base = next((t for t in ts if (t.get("config") or {}).get("workflow_id") == "publish-story.yml"), None)
if not base: sys.exit("nao achei o trigger do publish-story.yml pra copiar o token e o repo")
cfg = dict(base["config"], workflow_id="publish-reel.yml"); cfg.pop("inputs", None)
print(json.dumps({"name": "Publish Reel (domingo)",
  "description": "Reel semanal. 09:07 BRT + reservas 12:07, 15:07 e 18:07. Idempotente: ja postou = sai; preso no IG = retoma.",
  "type": "github_workflow", "config": cfg, "schedule": "7 12,15,18,21 * * 0"}, ensure_ascii=False, indent=2))' > /tmp/ta-reel.json \
  && cat /tmp/ta-reel.json \
  && read -p "Criar esse trigger? (s/n) " R && [ "$R" = s ] \
  && curl -s -b /tmp/ta.jar -H 'Content-Type: application/json' -X POST $B/api/triggers -d @/tmp/ta-reel.json
rm -f /tmp/ta.jar; unset S
```

Ou à mão no painel (Novo trigger): tipo `github_workflow`, owner `andrehz4`, repo `setlists-pj-ev`, workflow
`publish-reel.yml`, ref `main`, token = a mesma variável do `publish-story.yml`, schedule (UTC) `7 12,15,18,21 * * 0`.

## Alternativa: crons no próprio workflow (pendente, não é mais o caminho)

O fallback do reel (`fallback.mjs`, `retomar.mjs`) já funciona sozinho: retoma o vídeo já enviado quando o workflow é
disparado de novo. Falta só agendar essas novas tentativas no MESMO domingo. O acesso do Claude ao GitHub não tem o
escopo `workflow`, então esta edição é à mão (GitHub > Code > `.github/workflows/publish-reel.yml` > lápis).

## 1. Crons de reserva (12h07, 15h07 e 18h07 BRT)

```yaml
on:
  schedule:
    # domingo 12:00 UTC = 09:00 BRT (resumao da semana)
    - cron: '7 12 * * 0'
    # Reservas do MESMO domingo. O script é idempotente (já postou = sai) e RETOMA o reel preso no IG.
    - cron: '7 15 * * 0'
    - cron: '7 18 * * 0'
    - cron: '7 21 * * 0'
```

## 2. Tempo do job (render ~9 min + espera do IG 10 + 8 min + retomada 6 min)

```yaml
    timeout-minutes: 45
```

## 3. Duas variáveis no passo "Run publish-reel" (junto de `PUBLISH_FB: '1'`)

```yaml
          # só o cron respeita a janela de domingo (BRT): rodada atrasada na segunda publicaria a semana seguinte
          REEL_SO_DOMINGO: ${{ github.event_name == 'schedule' && '1' || '0' }}
          # avisa no Telegram que há reservas agendadas (só muda o texto do alerta)
          REEL_RESERVAS: '1'
```

Depois de aplicar, apague este arquivo e tire o aviso de PENDENTE do `PROGRESSO.md`.
