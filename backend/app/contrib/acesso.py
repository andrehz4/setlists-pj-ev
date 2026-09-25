"""Rotas de acesso: pedir acesso confirmando o Gmail, e painel do admin."""
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.contrib import google_id, membros
from app.core.config import settings
from app.core.limiter import limiter
from app.dependencies import require_auth
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()


class AcessoIn(BaseModel):
    credential: str = Field(min_length=20, max_length=5000)


class MembroIn(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", max_length=200)
    status: str = Field(pattern="^(aprovado|bloqueado|pendente)$")


def _so_admin(user_id: str) -> None:
    if not settings.is_admin(user_id):
        raise HTTPException(403, "Apenas admin.")


@router.get("/acesso")
async def meu_acesso(user_id: str = Depends(require_auth)):
    async with get_conn() as conn:
        status = await membros.status_do_usuario(conn, user_id)
    return {"status": status or "nenhum"}


@router.post("/acesso")
@limiter.limit("10/hour")
async def pedir_acesso(request: Request, payload: AcessoIn, user_id: str = Depends(require_auth)):
    try:
        email, claims = await google_id.email_verificado(payload.credential, settings.GOOGLE_CLIENT_ID)
    except ValueError as exc:
        raise HTTPException(401, "Não deu pra confirmar o Gmail. Tente de novo.") from exc
    async with get_conn() as conn:
        status = await membros.vincular(conn, email=email, user_id=user_id, nome=claims.get("name"))
    logger.info("Contrib acesso user=%s status=%s", user_id, status)
    return {"status": status}


@router.get("/admin/membros")
async def listar_membros(user_id: str = Depends(require_auth)):
    _so_admin(user_id)
    async with get_conn() as conn:
        rows = await membros.listar(conn)
    return [{**dict(r), "pedido_em": r["pedido_em"].isoformat(),
             "decidido_em": r["decidido_em"].isoformat() if r["decidido_em"] else None} for r in rows]


@router.post("/admin/membros")
async def definir_membro(payload: MembroIn, user_id: str = Depends(require_auth)):
    _so_admin(user_id)
    email = payload.email.strip().lower()
    async with get_conn() as conn:
        await membros.definir(conn, email=email, status=payload.status)
    logger.info("Contrib membro %s -> %s por admin=%s", email, payload.status, user_id)
    return {"email": email, "status": payload.status}
