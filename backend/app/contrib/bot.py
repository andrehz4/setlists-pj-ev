"""Rotas do robô de curadoria (GitHub Actions), guardadas por CONTRIB_BOT_KEY no header X-Bot-Key.

Fluxo: o cron pega a fila (/bot/fila), a IA avalia cada envio e devolve o veredito
(/bot/veredito/{id}). Também avisa o Andre de pedidos de acesso novos (/bot/pedidos).
Sem CONTRIB_BOT_KEY configurada, tudo aqui responde 403.
"""
import json
import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from app.contrib import repo_bot
from app.contrib.config import contrib_settings as cfg
from app.contrib.r2 import r2_url
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot")


def exigir_bot(request: Request) -> None:
    chave = request.headers.get("x-bot-key", "")
    if not cfg.BOT_KEY or not secrets.compare_digest(chave, cfg.BOT_KEY):
        raise HTTPException(403, "bot key inválida")


class LinhaIn(BaseModel):
    start: float = Field(ge=0)
    end: float = Field(ge=0)
    text: str = Field(max_length=300)


class VereditoIn(BaseModel):
    decisao: str = Field(pattern="^(aprovado|ajustado|recusado)$")
    titulo: str = Field(min_length=3, max_length=120)
    texto: str = Field(min_length=20, max_length=5000)
    legendas: list[LinhaIn] | None = Field(default=None, max_length=300)
    motivo: str | None = Field(default=None, max_length=1000)
    analise: dict = Field(default_factory=dict)


def _url(key: str) -> str | None:
    return r2_url(cfg, "GET", key, expires=3600) if cfg.r2_ready else None


@router.get("/contagem", dependencies=[Depends(exigir_bot)])
async def contagem():
    """Checagem barata do cron: tem envio ou pedido esperando? Não altera nada."""
    async with get_conn() as conn:
        return dict(await repo_bot.contagem(conn))


@router.get("/fila", dependencies=[Depends(exigir_bot)])
async def fila():
    """Envios esperando curadoria, do horário mais próximo pro mais distante."""
    async with get_conn() as conn:
        rows = await repo_bot.fila(conn)
    return [{
        "id": r["id"], "title": r["title"], "body": r["body"],
        "media": [{"key": m["key"], "url": _url(m["key"])} for m in repo_bot.jsonb(r["media"], [])],
        "video": repo_bot.jsonb(r["video_opts"], None),
        "scheduled_at": r["scheduled_at"].isoformat(),
        "autor": {"nome": r["nome"], "email": r["email"], "instagram": r["instagram"]},
    } for r in rows]


@router.post("/veredito/{submission_id}", dependencies=[Depends(exigir_bot)])
async def veredito(submission_id: str, payload: VereditoIn):
    async with get_conn() as conn, conn.transaction():
        atual = await repo_bot.travar(conn, submission_id)
        if atual is None:
            raise HTTPException(404, "Envio não encontrado.")
        if atual["status"] != "enviado":
            raise HTTPException(409, f"Envio já está '{atual['status']}'.")
        video = repo_bot.jsonb(atual["video_opts"], None)
        original = {"title": atual["title"], "body": atual["body"],
                    "legendas": (video or {}).get("legendas")}
        if video is not None and payload.legendas is not None:
            video["legendas"] = [linha.model_dump() for linha in payload.legendas]
        analise = {**payload.analise, "original": original}
        await repo_bot.gravar_veredito(
            conn, submission_id, status=payload.decisao, title=payload.titulo, body=payload.texto,
            video=json.dumps(video) if video is not None else None,
            reason=payload.motivo, analise=json.dumps(analise),
        )
    logger.info("Contrib veredito id=%s decisao=%s", submission_id, payload.decisao)
    return {"id": submission_id, "status": payload.decisao}


@router.get("/pedidos", dependencies=[Depends(exigir_bot)])
async def pedidos():
    """Pedidos de acesso ainda não avisados ao Andre (e já marca como avisados)."""
    async with get_conn() as conn, conn.transaction():
        rows = await repo_bot.pedidos_novos(conn)
    return [{"email": r["email"], "nome": r["nome"], "pedido_em": r["pedido_em"].isoformat()} for r in rows]
