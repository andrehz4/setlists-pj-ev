from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def _client_ip(request: Request) -> str:
    """IP real do cliente. Atras de proxy (Railway), usa o ultimo IP do
    X-Forwarded-For (o que o proxy anexou); sem ele todos compartilhariam o IP do load balancer e
    um unico usuario esgotaria o rate limit de todos."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        # ÚLTIMO IP: o que o proxy do Railway anexou. O primeiro vem do cliente e é forjável.
        return xff.split(",")[-1].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=_client_ip)
