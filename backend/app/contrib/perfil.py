"""Perfil do colaborador: o @ do Instagram (opcional) que vai no crédito dos posts.

Com @, a legenda sai "Enviado por @fulano" e o Instagram marca a pessoa.
Sem @, sai "Enviado por Marina S." (nome + inicial do sobrenome).
"""
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.contrib.auth import require_membro
from app.services.db import get_conn

router = APIRouter()

# Regras do próprio Instagram: letras, números, ponto e sublinhado; até 30; sem ponto nas pontas nem "..".
_HANDLE = re.compile(r"^(?!\.)(?!.*\.\.)(?!.*\.$)[a-z0-9._]{1,30}$")


def normalizar_instagram(valor: str | None) -> str | None:
    """'@Fulano.PJ ' -> 'fulano.pj'; vazio -> None; inválido -> ValueError."""
    handle = (valor or "").strip().lstrip("@").strip().lower()
    handle = re.sub(r"^https?://(www\.)?instagram\.com/", "", handle).strip("/")
    if not handle:
        return None
    if not _HANDLE.match(handle):
        raise ValueError(handle)
    return handle


class PerfilIn(BaseModel):
    instagram: str | None = Field(default=None, max_length=80)


@router.post("/perfil")
async def salvar_perfil(payload: PerfilIn, membro: str = Depends(require_membro)):
    try:
        handle = normalizar_instagram(payload.instagram)
    except ValueError as exc:
        raise HTTPException(422, "Esse @ não parece válido. Use só letras, números, ponto e sublinhado.") from exc
    async with get_conn() as conn:
        await conn.execute("UPDATE contrib_membros SET instagram = $2 WHERE id = $1::uuid", membro, handle)
    return {"instagram": handle}
