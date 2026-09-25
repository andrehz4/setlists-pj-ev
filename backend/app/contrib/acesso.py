"""Rotas de acesso: entrar com o Google e painel de membros do admin."""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.contrib import auth, google_id, membros
from app.core.config import settings
from app.core.limiter import limiter
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()


class EntrarIn(BaseModel):
    credential: str = Field(min_length=20, max_length=5000)


class MembroIn(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=200)
    status: str = Field(pattern="^(aprovado|bloqueado|pendente)$")


def _avatar(claims: dict) -> str | None:
    """Só aceita avatar https (bloqueia javascript:, data: e http misto)."""
    pic = str(claims.get("picture") or "")
    return pic if pic.startswith("https://") else None


def _perfil(status: str, claims: dict) -> dict:
    admin = auth.eh_admin(claims["email"])
    return {"status": "aprovado" if admin else status, "admin": admin,
            "nome": claims.get("name"), "avatar": _avatar(claims)}


@router.post("/entrar")
@limiter.limit("20/hour")
async def entrar(request: Request, payload: EntrarIn):
    """Recebe o ID token do botão do Google e devolve o token do painel."""
    try:
        email, claims = await google_id.email_verificado(payload.credential, settings.GOOGLE_CLIENT_ID)
    except ValueError as exc:
        raise HTTPException(401, "Não deu pra confirmar o Gmail. Tente de novo.") from exc
    mid = auth.membro_id(claims["sub"])
    try:
        async with get_conn() as conn:
            status = await membros.entrar(conn, id=mid, email=email, sub=claims["sub"],
                                          nome=claims.get("name"), avatar=_avatar(claims))
    except ValueError as exc:
        raise HTTPException(409, "Esse Gmail já está ligado a outra conta Google.") from exc
    logger.info("Contrib entrar membro=%s status=%s", mid, status)
    return {"token": auth.criar_token(mid, email), **_perfil(status, {**claims, "email": email})}


@router.get("/eu")
async def eu(claims: dict = Depends(auth.ler_token)):
    async with get_conn() as conn:
        status = await membros.status_de(conn, claims["sub"])
    return _perfil(status or "pendente", claims)


@router.get("/admin/membros")
async def listar_membros(_: str = Depends(auth.require_admin)):
    async with get_conn() as conn:
        rows = await membros.listar(conn)
    return [{**dict(r), "pedido_em": r["pedido_em"].isoformat(),
             "decidido_em": r["decidido_em"].isoformat() if r["decidido_em"] else None} for r in rows]


@router.post("/admin/membros")
async def definir_membro(payload: MembroIn, admin: str = Depends(auth.require_admin)):
    email = payload.email.strip().lower()
    async with get_conn() as conn:
        await membros.definir(conn, email=email, status=payload.status, novo_id=str(uuid.uuid4()))
    logger.info("Contrib membro %s -> %s por admin=%s", email, payload.status, admin)
    return {"email": email, "status": payload.status}
