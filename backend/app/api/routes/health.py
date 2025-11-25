import logging

from fastapi import APIRouter

router = APIRouter(tags=["health"])
logger = logging.getLogger("app")


@router.get("/health", summary="Health check")
async def health_check():
    logger.debug("Health check requested.")
    return {"status": "ok"}
