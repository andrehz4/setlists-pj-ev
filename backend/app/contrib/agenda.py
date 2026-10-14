"""Agenda dos posts de colaborador. Funções puras, sem banco.

Regra do Andre: o post nunca sai na hora. Vai pro próximo horário fixo que esteja a pelo menos
30 minutos (FOLGA) do envio. Os horários são os do News fetch + 30 min, pra publicação do
colaborador não brigar no git com a coleta de notícias (as duas gravam media/news/):
23h30, 01h30, 05h30, 08h30, 11h30, 13h30, 17h30 e 19h30 de Brasília.
No máximo 1 post de colaborador por horário; ocupado, pula pro seguinte.
O TriggerAll (gatilho "Contrib Curadoria") dispara o contrib-curadoria.yml às :11 e :31 dessas horas
UTC: a das :11 adianta a curadoria (a FOLGA garante que o envio já existe), a das :31 cura o que
faltou e publica. Mudou HORAS_UTC? Mude o gatilho e colab/api.js.
"""
from datetime import UTC, datetime, timedelta, timezone

# Brasil sem horário de verão desde 2019: UTC-3 fixo, sem depender de tzdata.
BRT = timezone(timedelta(hours=-3))
HORAS_UTC = (2, 4, 8, 11, 14, 16, 20, 22)  # mesmas do News fetch no TriggerAll
MINUTO = 30
FOLGA = timedelta(minutes=30)
MAX_SALTOS = 48  # horários tentados (6 dias) antes de dizer que a agenda está cheia


def _horarios_desde(inicio: datetime):
    """Horários fixos em ordem, a partir do dia de `inicio` (UTC)."""
    dia = inicio.astimezone(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    while True:
        for hora in HORAS_UTC:
            yield dia.replace(hour=hora, minute=MINUTO)
        dia += timedelta(days=1)


def proximo_slot(now: datetime) -> datetime:
    """Primeiro horário fixo a pelo menos FOLGA de `now`, em UTC."""
    return next(s for s in _horarios_desde(now) if s >= now + FOLGA)


def escolher_slot(now: datetime, ocupados: set[datetime]) -> datetime:
    """Primeiro horário livre a partir do próximo. Falha se MAX_SALTOS horários estiverem cheios."""
    ocupados_utc = {o.astimezone(UTC) for o in ocupados}
    inicio = proximo_slot(now)
    for i, slot in enumerate(s for s in _horarios_desde(inicio) if s >= inicio):
        if i >= MAX_SALTOS:
            break
        if slot not in ocupados_utc:
            return slot
    raise ValueError("agenda cheia nos próximos horários")


def inicio_do_dia_brt(now: datetime) -> datetime:
    """Meia-noite de hoje no horário de Brasília, em UTC (base do limite diário)."""
    local = now.astimezone(BRT).replace(hour=0, minute=0, second=0, microsecond=0)
    return local.astimezone(UTC)


def hora_brt(dt: datetime) -> str:
    """Rótulo curto pro usuário, ex: '15h30'."""
    local = dt.astimezone(BRT)
    return f"{local.hour}h{local.minute:02d}"
