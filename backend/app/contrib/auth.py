"""Login próprio do painel: botão do Google -> token do colaborador.

Independente do login do fórum (regra 0). O token é assinado com uma chave
DERIVADA (JWT_SECRET + ":contrib"), então não vale no fórum e vice-versa.
Admin do painel = Gmail listado em CONTRIB_ADMIN_EMAILS.
"""
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import Depends, Header, HTTPException
from jose import JWTError, jwt

from app.contrib.config import contrib_settings as cfg
from app.core.config import settings
from app.services.db import get_conn

ALGO = "HS256"
DIAS = 30


def _chave() -> str:
    return (settings.JWT_SECRET or "dev") + ":contrib"


def membro_id(google_sub: str) -> str:
    """Id estável do membro a partir do 'sub' do Google."""
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"google:{google_sub}"))


def criar_token(membro: str, email: str) -> str:
    exp = datetime.now(UTC) + timedelta(days=DIAS)
    return jwt.encode({"sub": membro, "email": email, "typ": "contrib", "exp": exp}, _chave(), algorithm=ALGO)


def ler_token(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or authorization[:7].lower() != "bearer ":
        raise HTTPException(401, "Entre com o Google.")
    try:
        claims = jwt.decode(authorization[7:].strip(), _chave(), algorithms=[ALGO])
    except JWTError as exc:
        raise HTTPException(401, "Sessão expirada. Entre de novo.") from exc
    if claims.get("typ") != "contrib":
        raise HTTPException(401, "Token inválido.")
    return claims


def eh_admin(email: str) -> bool:
    return email.lower() in cfg.admin_emails


async def require_membro(claims: dict = Depends(ler_token)) -> str:
    """Só membro aprovado passa (admin sempre passa). Devolve o id do membro."""
    if eh_admin(claims["email"]):
        return claims["sub"]
    async with get_conn() as conn:
        status = await conn.fetchval("SELECT status FROM contrib_membros WHERE id = $1::uuid", claims["sub"])
    if status != "aprovado":
        raise HTTPException(403, "Acesso de colaborador ainda não aprovado.")
    return claims["sub"]


def require_admin(claims: dict = Depends(ler_token)) -> str:
    if not eh_admin(claims["email"]):
        raise HTTPException(403, "Apenas admin.")
    return claims["sub"]
