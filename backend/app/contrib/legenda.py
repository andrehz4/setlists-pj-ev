"""Legenda automática: Whisper no Cloudflare Workers AI.

O navegador extrai o áudio do vídeo (WAV 16 kHz mono, ~2 MB por minuto) e manda
aqui. Repassamos pro Whisper e devolvemos trechos com tempo por palavra, que a
pessoa corrige antes de enviar. O vídeo em si nunca passa pelo Railway.
"""
import base64
import logging

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from app.contrib.auth import require_membro
from app.contrib.config import contrib_settings as cfg
from app.contrib.limite import limiter

logger = logging.getLogger(__name__)
router = APIRouter()

MODELO = "@cf/openai/whisper-large-v3-turbo"
MAX_WAV = 6 * 1024 * 1024
# Ajuda o Whisper a acertar nomes próprios.
DICA = "Pearl Jam, Eddie Vedder, Mike McCready, Stone Gossard, Jeff Ament, Matt Cameron, Ten, Vs., Vitalogy."
DUVIDA_LOGPROB = -0.8


def normalizar(resultado: dict) -> list[dict]:
    """Resposta do Whisper -> [{start, end, text, words:[{w,s,e}], duvida}]."""
    trechos = []
    for seg in resultado.get("segments") or []:
        texto = str(seg.get("text", "")).strip()
        if not texto:
            continue
        palavras = [
            {"w": str(w.get("word", "")).strip(), "s": round(float(w["start"]), 2), "e": round(float(w["end"]), 2)}
            for w in seg.get("words") or [] if str(w.get("word", "")).strip()
        ]
        trechos.append({
            "start": round(float(seg.get("start", 0)), 2),
            "end": round(float(seg.get("end", 0)), 2),
            "text": texto,
            "words": palavras,
            "duvida": float(seg.get("avg_logprob", 0) or 0) < DUVIDA_LOGPROB,
        })
    return trechos


async def _whisper(wav: bytes) -> dict:
    url = f"https://api.cloudflare.com/client/v4/accounts/{cfg.R2_ACCOUNT_ID}/ai/run/{MODELO}"
    corpo = {"audio": base64.b64encode(wav).decode(), "initial_prompt": DICA, "vad_filter": True}
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(url, json=corpo, headers={"Authorization": f"Bearer {cfg.CF_AI_TOKEN}"})
    if resp.status_code != 200:
        logger.warning("Whisper falhou status=%s corpo=%s", resp.status_code, resp.text[:300])
        raise HTTPException(502, "A legenda automática falhou. Tente de novo ou escreva a legenda.")
    return resp.json().get("result") or {}


@router.post("/legenda")
@limiter.limit("20/hour")
async def gerar_legenda(request: Request, membro: str = Depends(require_membro)):
    if not (cfg.CF_AI_TOKEN and cfg.R2_ACCOUNT_ID):
        raise HTTPException(503, "Legenda automática ainda não configurada.")
    wav = await request.body()
    if not wav.startswith(b"RIFF") or len(wav) > MAX_WAV:
        raise HTTPException(422, "Áudio inválido ou longo demais.")
    trechos = normalizar(await _whisper(wav))
    logger.info("Legenda gerada membro=%s trechos=%s bytes=%s", membro, len(trechos), len(wav))
    return {"trechos": trechos}
