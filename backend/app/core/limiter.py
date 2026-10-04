import os

from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _client_ip(request: Request) -> str:
    """IP real do cliente. Atras de proxy (Railway), usa o ultimo IP do
    X-Forwarded-For (o que o proxy anexou); sem ele todos compartilhariam o IP do load balancer e
    um unico usuario esgotaria o rate limit de todos."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # O primeiro IP vem do cliente (forjável); o último é o que o proxy anexou. Padrão = primeiro (o que
        # produção usa hoje); RATE_LIMIT_IP=ultimo liga o mais seguro depois de conferir no Railway que o
        # proxy anexa o IP real no fim do cabeçalho.
        ips = [x.strip() for x in xff.split(",") if x.strip()]
        if ips:
            return ips[-1] if os.environ.get("RATE_LIMIT_IP") == "ultimo" else ips[0]
    return get_remote_address(request)


limiter = Limiter(key_func=_client_ip)
