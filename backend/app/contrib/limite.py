"""Rate limit próprio do painel, independente do app.core.limiter do host.

O módulo roda também dentro do backend do Terra Gentil, cujo limiter usa o IP do
socket (o do load balancer do Railway) e somaria todos os colaboradores num limite só.
Aqui a chave vem do X-Forwarded-For (primeiro IP por padrão; RATE_LIMIT_IP=ultimo usa o do proxy).
"""
import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _ip_cliente(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # O primeiro IP vem do cliente (forjável); o último é o que o proxy anexou. Padrão = primeiro (o que
        # produção usa hoje); RATE_LIMIT_IP=ultimo liga o mais seguro depois de conferir no Railway que o
        # proxy anexa o IP real no fim do cabeçalho.
        ips = [x.strip() for x in xff.split(",") if x.strip()]
        if ips:
            return ips[-1] if os.environ.get("RATE_LIMIT_IP") == "ultimo" else ips[0]
    return get_remote_address(request)


limiter = Limiter(key_func=_ip_cliente)
