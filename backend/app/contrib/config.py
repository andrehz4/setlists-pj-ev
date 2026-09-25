"""Configuração própria do módulo, separada de app/core/config.py.

Todas as variáveis têm prefixo CONTRIB_. Sem CONTRIB_ENABLED=true o módulo
nem é montado no app, então o fórum segue idêntico.
"""
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

FOTO_MIMES = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}
VIDEO_MIMES = {"video/mp4": "mp4", "video/quicktime": "mov"}


class ContribSettings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="CONTRIB_", env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    ENABLED: bool = False
    # Vídeo só liga na fase 5, quando o render tirar o áudio (regra de ouro 1).
    VIDEO_ENABLED: bool = False
    DAILY_LIMIT: int = Field(default=2, ge=1, le=20)
    MAX_FOTOS: int = Field(default=10, ge=1, le=10)
    MAX_FOTO_BYTES: int = 15 * 1024 * 1024
    MAX_VIDEO_BYTES: int = 200 * 1024 * 1024
    MAX_VIDEO_SEG: int = 90
    # Gmails com poder de admin no painel (CSV).
    ADMIN_EMAILS: str = "eng.andrehz@gmail.com"
    # Token da API da Cloudflare com permissão "Workers AI" (legenda automática).
    CF_AI_TOKEN: str = ""
    # Chave do robô de curadoria (GitHub Actions manda no header X-Bot-Key).
    BOT_KEY: str = ""

    # Cloudflare R2 (API compatível com S3). Bucket privado.
    R2_ACCOUNT_ID: str = ""
    R2_ACCESS_KEY_ID: str = ""
    R2_SECRET_ACCESS_KEY: str = ""
    R2_BUCKET: str = "smufdpj-contrib"

    @property
    def r2_ready(self) -> bool:
        return bool(self.R2_ACCOUNT_ID and self.R2_ACCESS_KEY_ID and self.R2_SECRET_ACCESS_KEY)

    @property
    def admin_emails(self) -> set[str]:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}

    @property
    def mimes(self) -> dict[str, str]:
        return {**FOTO_MIMES, **(VIDEO_MIMES if self.VIDEO_ENABLED else {})}

    def max_bytes(self, mime: str) -> int:
        return self.MAX_VIDEO_BYTES if mime in VIDEO_MIMES else self.MAX_FOTO_BYTES


contrib_settings = ContribSettings()
