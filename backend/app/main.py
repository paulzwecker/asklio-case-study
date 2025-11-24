# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.routes.health import router as health_router
from app.api.routes.requests import router as requests_router
from app.api.routes.offers import router as offers_router


def create_app() -> FastAPI:
    app = FastAPI(
        title="askLio Procurement API",
        version="0.1.0",
        description="Backend for the askLio procurement case study (FastAPI).",
    )

    # CORS (für Frontend auf http://localhost:3000)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allow_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Router registrieren
    app.include_router(health_router, prefix="/api")
    app.include_router(requests_router, prefix="/api")
    app.include_router(offers_router, prefix="/api")

    return app


app = create_app()
