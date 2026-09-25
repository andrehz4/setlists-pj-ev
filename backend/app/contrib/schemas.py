"""Contratos de entrada e saída do módulo de colaboradores."""
from pydantic import BaseModel, Field

# Ciclo de vida. Fase 1 só grava "enviado" e "cancelado";
# a curadoria (fase 3) e a publicação (fase 4) escrevem o resto.
STATUS = ("enviado", "aprovado", "ajustado", "recusado", "publicado", "cancelado")


class UploadRequest(BaseModel):
    mime: str = Field(max_length=60)
    size: int = Field(gt=0)


class UploadOut(BaseModel):
    key: str
    upload_url: str
    headers: dict[str, str]
    expires_in: int


class SubmissionCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    body: str = Field(min_length=20, max_length=5000)
    media_keys: list[str] = Field(default_factory=list, min_length=1, max_length=10)
    agreed_rules: bool


class MediaOut(BaseModel):
    key: str
    url: str | None = None


class SubmissionOut(BaseModel):
    id: str
    status: str
    title: str
    body: str
    media: list[MediaOut]
    scheduled_at: str
    scheduled_label: str
    reason: str | None = None
    created_at: str


class ConfigOut(BaseModel):
    enabled: bool
    video_enabled: bool
    daily_limit: int
    max_fotos: int
    mimes: list[str]
