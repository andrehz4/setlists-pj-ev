"""Rate limit próprio do painel, independente do app.core.limiter do host.

O módulo roda também dentro do backend do Terra Gentil, cujo limiter usa o IP do
socket (o do load balancer do Railway) e somaria todos os colaboradores num limite só.
Aqui a chave é o primeiro IP do X-Forwarded-For.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _ip_cliente(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_ip_cliente)
