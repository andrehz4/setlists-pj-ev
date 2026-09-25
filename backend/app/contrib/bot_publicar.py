"""Rotas do robô de PUBLICAÇÃO (fase 4). Mesma chave do robô de curadoria.

Idempotência contra post duplicado no Instagram:
1. /bot/publicando/{id} grava a tentativa (horário + legenda) ANTES de chamar o IG.
2. Se a run morrer depois do IG e antes de /bot/publicado, a próxima run vê a tentativa
   e procura o post pela legenda no IG (recoverPublishedPost) em vez de postar de novo.
"""
import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.contrib import repo_bot
from app.contrib.bot import _url, exigir_bot
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot", dependencies=[Depends(exigir_bot)])


class TentativaIn(BaseModel):
    caption: str = Field(min_length=1, max_length=2200)


class PublicadoIn(BaseModel):
    site_id: str = Field(pattern=r"^colab-[0-9a-f]{8}$")
    ig_post_id: str | None = Field(default=None, max_length=60)
    fb_post_id: str | None = Field(default=None, max_length=80)


@router.get("/prontos")
async def prontos():
    """Aprovados cujo horário chegou. Vídeo fica de fora até o render (fase 5)."""
    async with get_conn() as conn:
        rows = await repo_bot.prontos(conn)
    saida = []
    for r in rows:
        media = repo_bot.jsonb(r["media"], [])
        if any(m["key"].endswith((".mp4", ".mov")) for m in media):
            continue
        verdict = repo_bot.jsonb(r["ai_verdict"], {}) or {}
        saida.append({
            "id": r["id"], "status": r["status"], "title": r["title"], "body": r["body"],
            "media": [{"key": m["key"], "url": _url(m["key"])} for m in media],
            "scheduled_at": r["scheduled_at"].isoformat(),
            "autor": {"nome": r["nome"]},
            "publicacao": verdict.get("publicacao"),
        })
    return saida


@router.post("/publicando/{submission_id}")
async def publicando(submission_id: str, payload: TentativaIn):
    async with get_conn() as conn:
        ok = await repo_bot.marcar_tentativa(conn, submission_id, payload.caption)
    if not ok:
        raise HTTPException(409, "Envio não está aprovado (ou já foi publicado).")
    return {"id": submission_id, "tentativa": True}


@router.post("/publicado/{submission_id}")
async def publicado(submission_id: str, payload: PublicadoIn):
    async with get_conn() as conn:
        ok = await repo_bot.marcar_publicado(conn, submission_id, payload.model_dump())
    if not ok:
        raise HTTPException(409, "Envio não está aprovado (ou já foi publicado).")
    logger.info("Contrib publicado id=%s site=%s ig=%s", submission_id, payload.site_id, payload.ig_post_id)
    return {"id": submission_id, "status": "publicado"}
