from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    APP_NAME: str = "SMUFDPJ Forum API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = Field(default="development")

    DATABASE_URL: str = Field(default="", description="Supabase PostgreSQL connection URL")

    GOOGLE_CLIENT_ID: str = Field(default="", description="Google OAuth client ID")
    GOOGLE_CLIENT_SECRET: str = Field(default="", description="Google OAuth client secret")
    JWT_SECRET: str = Field(default="", description="Secret for signing forum JWTs")
    FORUM_CORS_ORIGIN: str = Field(
        default="https://setlists-pj-ev.pages.dev",
        description="Frontend origin (used in OAuth redirect)",
    )

    # Mapeamento origem → site. Formato: "https://dominio.com=pj,https://outro.com=terra-gentil"
    SITE_ORIGINS: str = Field(
        default="https://setlists-pj-ev.pages.dev=pj",
        description="Mapa de origens para site ID, separado por vírgula",
    )

    # User IDs (Google sub) que recebem privilégios de admin no fórum.
    # CSV, ex: "108281234567890123456,108289876543210987654".
    ADMIN_USER_IDS: str = Field(
        default="",
        description="UUIDs/Google sub dos admins, separados por vírgula",
    )

    @property
    def admin_user_ids(self) -> set[str]:
        return {x.strip() for x in self.ADMIN_USER_IDS.split(",") if x.strip()}

    def is_admin(self, user_id: str | None) -> bool:
        return bool(user_id and user_id in self.admin_user_ids)

    @property
    def site_origin_map(self) -> dict[str, str]:
        cached = self.__dict__.get("_site_origin_map_cache")
        if cached is not None:
            return cached
        result = {}
        for pair in self.SITE_ORIGINS.split(","):
            pair = pair.strip()
            if "=" in pair:
                origin, site = pair.split("=", 1)
                result[origin.strip()] = site.strip()
        self.__dict__["_site_origin_map_cache"] = result
        return result


settings = Settings()
