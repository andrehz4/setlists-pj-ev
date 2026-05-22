"""Dependencias compartilhadas entre routers: resolucao de site e autenticacao."""
from fastapi import Header, HTTPException, Request, status

from app.core.config import settings
from app.services.auth_service import verify_jwt

ALLOWED_SITES = {"pj", "terra-gentil"}


def resolve_site(request: Request) -> str:
    """Determina o site pelo Origin da request. Rejeita origens desconhecidas."""
    origin = request.headers.get("origin", "")
    site = settings.site_origin_map.get(origin)
    if not site:
        if settings.ENVIRONMENT == "development":
            return "pj"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Origem não autorizada: {origin!r}",
        )
    return site


def require_auth(authorization: str | None = Header(default=None)) -> str:
    if not authorization or authorization[:7].lower() != "bearer ":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token ausente")
    token = authorization[7:].strip()
    return verify_jwt(token)["user_id"]


def optional_auth(authorization: str | None = Header(default=None)) -> str | None:
    if not authorization or authorization[:7].lower() != "bearer ":
        return None
    try:
        token = authorization[7:].strip()
        return verify_jwt(token)["user_id"]
    except HTTPException:
        return None
