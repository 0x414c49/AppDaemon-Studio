"""Pydantic configuration settings."""

import os
from pathlib import Path
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # AppDaemon configuration path (Home Assistant add-on path)
    appdaemon_config_path: Path = Field(
        default_factory=lambda: Path("/addon_configs/a0d7b954_appdaemon"),
        description="Path to AppDaemon configuration directory",
    )

    # Apps directory
    @property
    def apps_path(self) -> Path:
        """Get the apps directory path."""
        return self.appdaemon_config_path / "apps"

    # Logs directory
    @property
    def logs_path(self) -> Path:
        """Get the logs directory path."""
        return self.appdaemon_config_path / "logs"

    # AppDaemon log file
    @property
    def appdaemon_log_path(self) -> Path:
        """Get the AppDaemon log file path."""
        return self.logs_path / "appdaemon.log"

    # API settings
    api_prefix: str = Field(default="/api", description="API route prefix")

    # CORS settings
    cors_origins: list[str] = Field(
        default_factory=lambda: ["*"], description="Allowed CORS origins"
    )

    # Development settings
    debug: bool = Field(default=False, description="Debug mode")

    model_config = {
        "env_prefix": "APPDAEMON_STUDIO_",
        "case_sensitive": False,
    }


def get_settings() -> Settings:
    """Get application settings singleton."""
    return Settings()
