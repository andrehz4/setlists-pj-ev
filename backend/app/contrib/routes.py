"""Rotas /contrib. Montadas em app/main.py só com CONTRIB_ENABLED=true."""
import logging
import re
import uuid
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.contrib import acesso, agenda, bot, bot_publicar, legenda, repo
from app.contrib.auth import require_admin, require_membro
from app.contrib.config import contrib_settings as cfg
from app.contrib.r2 import r2_url
from app.contrib.schemas import (
    ConfigOut, MediaOut, SubmissionCreate, SubmissionOut, UploadOut, UploadRequest,
)
from app.core.config import settings
from app.core.limiter import limiter
from app.dependencies import resolve_site
from app.services.db import get_conn

logger = logging.getLogger(__name__)
router = APIRouter()
router.include_router(acesso.router)
router.include_router(legenda.router)
router.include_router(bot.router)
router.include_router(bot_publicar.router)

UPLOAD_TTL = 900
KEY_RE = re.compile(r"^contrib/[0-9a-f-]{36}/[0-9a-f]{32}\.(jpg|png|webp|mp4|mov)$")


def _erro(code: int, msg: str) -> HTTPException:
    return HTTPException(status_code=code, detail=msg)


def _out(row) -> SubmissionOut:
    media = [
        MediaOut(key=m["key"], url=r2_url(cfg, "GET", m["key"], expires=3600) if cfg.r2_ready else None)
        for m in repo.media_of(row)
    ]
    return SubmissionOut(
        id=row["id"], status=row["status"], title=row["title"], body=row["body"], media=media,
        scheduled_at=row["scheduled_at"].isoformat(), scheduled_label=agenda.hora_brt(row["scheduled_at"]),
        reason=row["reason"], created_at=row["created_at"].isoformat(), video=repo.video_of(row),
    )


@router.get("/config", response_model=ConfigOut)
async def config():
    return ConfigOut(
        enabled=cfg.ENABLED, video_enabled=cfg.VIDEO_ENABLED, daily_limit=cfg.DAILY_LIMIT,
        max_fotos=cfg.MAX_FOTOS, mimes=sorted(cfg.mimes), max_video_seg=cfg.MAX_VIDEO_SEG,
        google_client_id=settings.GOOGLE_CLIENT_ID, legenda_auto=bool(cfg.CF_AI_TOKEN and cfg.R2_ACCOUNT_ID),
    )


@router.post("/uploads", response_model=UploadOut)
@limiter.limit("30/hour")
async def create_upload(request: Request, payload: UploadRequest, user_id: str = Depends(require_membro)):
    """URL assinada pra subir 1 arquivo direto no R2 (o binário não passa aqui)."""
    ext = cfg.mimes.get(payload.mime)
    if not ext:
        raise _erro(415, "Formato não aceito.")
    if payload.size > cfg.max_bytes(payload.mime):
        raise _erro(413, "Arquivo grande demais.")
    if not cfg.r2_ready:
        raise _erro(503, "Envio de arquivos ainda não configurado.")
    key = f"contrib/{user_id}/{uuid.uuid4().hex}.{ext}"
    headers = {"Content-Type": payload.mime, "Content-Length": str(payload.size)}
    url = r2_url(cfg, "PUT", key, expires=UPLOAD_TTL, headers=headers)
    return UploadOut(key=key, upload_url=url, headers={"Content-Type": payload.mime}, expires_in=UPLOAD_TTL)


@router.post("/submissions", response_model=SubmissionOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/hour")
async def create_submission(request: Request, payload: SubmissionCreate, user_id: str = Depends(require_membro)):
    site = resolve_site(request)
    if not payload.agreed_rules:
        raise _erro(422, "Leia e aceite as regras de ouro antes de enviar.")
    prefix = f"contrib/{user_id}/"
    if len(set(payload.media_keys)) != len(payload.media_keys):
        raise _erro(422, "Arquivo repetido no envio.")
    for key in payload.media_keys:
        if not key.startswith(prefix) or not KEY_RE.match(key):
            raise _erro(422, "Arquivo inválido.")
    videos = [k for k in payload.media_keys if k.endswith((".mp4", ".mov"))]
    if videos and (not cfg.VIDEO_ENABLED or len(payload.media_keys) > 1):
        raise _erro(422, "Vídeo vai sozinho no post.")
    if len(payload.media_keys) > cfg.MAX_FOTOS:
        raise _erro(422, f"No máximo {cfg.MAX_FOTOS} fotos.")
    if payload.video and not videos:
        raise _erro(422, "Opções de vídeo sem vídeo no post.")
    if payload.video and payload.video.trim_end - payload.video.trim_start > cfg.MAX_VIDEO_SEG:
        raise _erro(422, f"O trecho escolhido passa de {cfg.MAX_VIDEO_SEG} segundos.")

    now = datetime.now(UTC)
    async with get_conn() as conn, conn.transaction():
        await conn.execute(repo.LOCK_SQL)
        if await repo.count_since(conn, user_id, agenda.inicio_do_dia_brt(now)) >= cfg.DAILY_LIMIT:
            raise _erro(429, f"Limite de {cfg.DAILY_LIMIT} envios por dia. Volte amanhã.")
        ocupados = await repo.taken_slots(conn, site, now - timedelta(hours=1))
        try:
            slot = agenda.escolher_slot(now, ocupados)
        except ValueError:
            raise _erro(503, "Agenda cheia. Tente mais tarde.") from None
        row = await repo.insert(
            conn, id=str(uuid.uuid4()), site=site, user_id=user_id, title=payload.title.strip(),
            body=payload.body.strip(), media=[{"key": k} for k in payload.media_keys],
            scheduled_at=slot, now=now, video=payload.video.model_dump() if payload.video else None,
        )
    logger.info("Contrib enviado id=%s user=%s slot=%s", row["id"], user_id, slot.isoformat())
    return _out(row)


@router.get("/submissions/mine", response_model=list[SubmissionOut])
async def my_submissions(request: Request, user_id: str = Depends(require_membro)):
    site = resolve_site(request)
    async with get_conn() as conn:
        rows = await repo.list_mine(conn, user_id, site)
    return [_out(r) for r in rows]


@router.delete("/submissions/{submission_id}")
async def cancel_submission(submission_id: uuid.UUID, user_id: str = Depends(require_membro)):
    async with get_conn() as conn:
        result = await repo.cancel(conn, str(submission_id), user_id)
    if result is None:
        raise _erro(404, "Envio não encontrado.")
    if result != "cancelado":
        raise _erro(409, "Esse envio já passou da curadoria e não pode ser cancelado.")
    return {"id": str(submission_id), "status": "cancelado"}


@router.get("/admin/submissions")
async def admin_submissions(request: Request, _: str = Depends(require_admin)):
    site = resolve_site(request)
    async with get_conn() as conn:
        rows = await repo.list_all(conn, site)
    return [{**_out(r).model_dump(), "nome": r["nome"], "email": r["email"]} for r in rows]
