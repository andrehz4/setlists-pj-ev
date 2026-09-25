"""Contador de falhas do robô: evita alerta repetido e tentativa infinita.

Cada falha de curadoria ou publicação chama /bot/falha/{id}. O backend conta por etapa.
Ao bater o limite, desiste: o envio vira "recusado" com um motivo técnico pra pessoa
(o horário fica livre) e o robô avisa o Andre UMA vez. O robô só avisa na 1ª falha e na
desistência; as do meio ficam só no log.
"""
import json
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.contrib.bot import exigir_bot
from app.contrib.repo_bot import jsonb
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/bot", dependencies=[Depends(exigir_bot)])

LIMITES = {"curadoria": 3, "publicacao": 5}
MOTIVO = ("Tivemos um problema técnico com o seu envio e ele não foi ao ar. "
          "Tente enviar de novo; se repetir, fale com a gente no Instagram @smufdpj.")
ATIVOS = ("enviado", "aprovado", "ajustado")


class FalhaIn(BaseModel):
    etapa: str = Field(pattern="^(curadoria|publicacao)$")
    erro: str = Field(max_length=500)


@router.post("/falha/{submission_id}")
async def registrar_falha(submission_id: uuid.UUID, payload: FalhaIn):
    async with get_conn() as conn, conn.transaction():
        row = await conn.fetchrow(
            "SELECT status, ai_verdict FROM contrib_submissions WHERE id = $1::uuid FOR UPDATE", str(submission_id)
        )
        if row is None:
            raise HTTPException(404, "Envio não encontrado.")
        if row["status"] not in ATIVOS:
            return {"tentativas": 0, "desistiu": False, "status": row["status"]}

        verdict = jsonb(row["ai_verdict"], {}) or {}
        falhas = verdict.get("falhas") or {}
        n = int(falhas.get(payload.etapa, 0)) + 1
        falhas[payload.etapa] = n
        verdict["falhas"] = falhas
        verdict["ultimo_erro"] = payload.erro
        desistiu = n >= LIMITES[payload.etapa]
        await conn.execute(
            """
            UPDATE contrib_submissions
            SET ai_verdict = $2::jsonb, updated_at = now(),
                status = CASE WHEN $3 THEN 'recusado' ELSE status END,
                reason = CASE WHEN $3 THEN $4 ELSE reason END
            WHERE id = $1::uuid
            """,
            str(submission_id), json.dumps(verdict), desistiu, MOTIVO,
        )
    logger.info("Contrib falha id=%s etapa=%s n=%s desistiu=%s", submission_id, payload.etapa, n, desistiu)
    return {"tentativas": n, "desistiu": desistiu, "limite": LIMITES[payload.etapa]}
