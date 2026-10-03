"""Rate limit próprio do painel, independente do app.core.limiter do host.

O módulo roda também dentro do backend do Terra Gentil, cujo limiter usa o IP do
socket (o do load balancer do Railway) e somaria todos os colaboradores num limite só.
Aqui a chave é o último IP do X-Forwarded-For (o que o proxy anexou).
"""
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _ip_cliente(request: Request) -> str:
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # ÚLTIMO IP: o que o proxy do Railway anexou. O primeiro vem do cliente e é forjável.
        return xff.split(",")[-1].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_ip_cliente)
