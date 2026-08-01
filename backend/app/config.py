"""Application configuration loaded from environment variables / .env file."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Default to SQLite so the app runs with zero setup during evaluation.
    # For PostgreSQL set e.g.:
    #   DATABASE_URL=postgresql+psycopg2://screening:screening@localhost:5432/screening
    database_url: str = "sqlite:///./screening.db"

    # JWT settings. Override SECRET_KEY in production via the environment.
    secret_key: str = "change-me-in-production-please-use-a-long-random-string"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24  # 24 hours

    # CORS: comma-separated list of allowed origins for the frontend.
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
