import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.models.offer import OfferExtractionResult
from app.services.offer_extraction_service import (
    OfferExtractionService,
    get_offer_extraction_service,
)

router = APIRouter(prefix="/offers", tags=["offers"])
logger = logging.getLogger("app")


@router.post(
    "/parse",
    response_model=OfferExtractionResult,
    summary="Parse an offer PDF and extract structured data",
)
async def parse_offer(
    file: UploadFile = File(...),
    service: OfferExtractionService = Depends(get_offer_extraction_service),
) -> OfferExtractionResult:
    if file.content_type != "application/pdf":
        logger.warning("Rejected upload with invalid content type: %s", file.content_type)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )
    try:
        result = await service.extract(file)
        logger.info("Successfully parsed uploaded offer '%s'", file.filename)
        return result
    except Exception:  # noqa: BLE001
        logger.exception("Failed to parse uploaded offer '%s'", file.filename)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse offer document.",
        )
