"""Site do envio pelo Origin, sem depender do app.dependencies do host.

Mesma regra do fórum PJ: origem fora de SITE_ORIGINS é recusada (em dev vira "pj").
Não aceita o header X-Site do app mobile do Terra Gentil: o painel é só web.
"""
from fastapi import HTTPException, Request, status

from app.core.config import settings


def resolve_site(request: Request) -> str:
    origin = request.headers.get("origin", "")
    site = settings.site_origin_map.get(origin)
    if site:
        return site
    if settings.ENVIRONMENT == "development":
        return "pj"
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"Origem não autorizada: {origin!r}")
