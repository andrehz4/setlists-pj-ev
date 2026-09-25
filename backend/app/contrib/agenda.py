"""Agenda dos posts de colaborador. Funções puras, sem banco.

Regra do Andre: o post nunca sai na hora. Vai sempre pro :30 da PRÓXIMA hora
(14h10 e 14h50 saem às 15h30), o que dá de 30 a 90 minutos pra curadoria.
No máximo 1 post de colaborador por slot; ocupado, pula pro :30 seguinte.
O cron do publish roda em :12/:32/:52 UTC, então o :30 cai no ciclo das :32.
"""
from datetime import UTC, datetime, timedelta, timezone

# Brasil sem horário de verão desde 2019: UTC-3 fixo, sem depender de tzdata.
BRT = timezone(timedelta(hours=-3))
MAX_SALTOS = 48


def proximo_slot(now: datetime) -> datetime:
    """:30 da próxima hora cheia, em UTC."""
    hora = now.astimezone(UTC).replace(minute=0, second=0, microsecond=0)
    return hora + timedelta(hours=1, minutes=30)


def escolher_slot(now: datetime, ocupados: set[datetime]) -> datetime:
    """Primeiro :30 livre a partir do próximo. Falha se 48 horas estiverem cheias."""
    slot = proximo_slot(now)
    ocupados_utc = {o.astimezone(UTC) for o in ocupados}
    for _ in range(MAX_SALTOS):
        if slot not in ocupados_utc:
            return slot
        slot += timedelta(hours=1)
    raise ValueError("agenda cheia nas próximas 48 horas")


def inicio_do_dia_brt(now: datetime) -> datetime:
    """Meia-noite de hoje no horário de Brasília, em UTC (base do limite diário)."""
    local = now.astimezone(BRT).replace(hour=0, minute=0, second=0, microsecond=0)
    return local.astimezone(UTC)


def hora_brt(dt: datetime) -> str:
    """Rótulo curto pro usuário, ex: '15h30'."""
    local = dt.astimezone(BRT)
    return f"{local.hour}h{local.minute:02d}"
