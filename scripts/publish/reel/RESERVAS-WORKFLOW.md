# Reservas do reel semanal: mudança pendente no `publish-reel.yml`

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
