import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.health import router as health_router
from app.api.routes.offers import router as offers_router
from app.api.routes.requests import router as requests_router
from app.core.config import settings
from app.core.logging_config import setup_logging


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    setup_logging()
    logger = logging.getLogger("app")

    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        description="Backend for the askLio procurement case study (FastAPI).",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health_router, prefix="/api")
    app.include_router(requests_router, prefix="/api")
    app.include_router(offers_router, prefix="/api")

    logger.info("FastAPI application initialised.")
    return app


app = create_app()
