"""FastAPI main application with lifespan management."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import apps, files, logs, versions
from app.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan manager."""
    # Startup
    settings = get_settings()

    # Ensure required directories exist
    settings.apps_path.mkdir(parents=True, exist_ok=True)
    settings.logs_path.mkdir(parents=True, exist_ok=True)

    yield

    # Shutdown
    # Clean up any resources if needed


def create_app() -> FastAPI:
    """Create FastAPI application."""
    settings = get_settings()

    app = FastAPI(
        title="AppDaemon Studio",
        description="IDE for AppDaemon apps with version control and real-time logs",
        version="0.1.0",
        lifespan=lifespan,
    )

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routers
    app.include_router(apps.router, prefix=settings.api_prefix)
    app.include_router(files.router, prefix=settings.api_prefix)
    app.include_router(versions.router, prefix=settings.api_prefix)
    app.include_router(logs.router, prefix=settings.api_prefix)

    @app.get("/")
    async def root() -> dict:
        """Root endpoint."""
        return {"name": "AppDaemon Studio API", "version": "0.1.0", "docs": "/docs"}

    @app.get("/health")
    async def health() -> dict:
        """Health check endpoint."""
        return {"status": "healthy"}

    return app


# Create the application instance
app = create_app()
