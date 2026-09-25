"""Confere o ID token do botão "Entrar com o Google" (Google Identity Services).

Serve só pra provar qual Gmail a pessoa tem, sem mexer no login do fórum
(regra 0). Chaves públicas do Google em cache por 1 hora.
"""
import time

import httpx
from jose import JWTError, jwt

CERTS_URL = "https://www.googleapis.com/oauth2/v3/certs"
ISSUERS = {"accounts.google.com", "https://accounts.google.com"}
_cache: dict = {"keys": None, "ate": 0.0}


async def _chaves() -> dict:
    if _cache["keys"] is None or time.time() > _cache["ate"]:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(CERTS_URL)
            resp.raise_for_status()
        _cache.update(keys=resp.json(), ate=time.time() + 3600)
    return _cache["keys"]


async def email_verificado(credential: str, client_id: str) -> tuple[str, dict]:
    """Devolve (email em minúsculas, claims). ValueError se o token não vale."""
    if not client_id:
        raise ValueError("GOOGLE_CLIENT_ID ausente")
    try:
        claims = jwt.decode(
            credential, await _chaves(), algorithms=["RS256"], audience=client_id,
            options={"verify_at_hash": False},
        )
    except JWTError as exc:
        raise ValueError("token do Google inválido") from exc
    if claims.get("iss") not in ISSUERS or not claims.get("email_verified"):
        raise ValueError("e-mail não verificado pelo Google")
    return str(claims["email"]).strip().lower(), claims
