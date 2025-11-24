# app/api/routes/offers.py

from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status

from app.models.offer import OfferExtractionResult
from app.services.offer_extraction_service import (
    OfferExtractionService,
    get_offer_extraction_service,
)

router = APIRouter(prefix="/offers", tags=["offers"])


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
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported.",
        )
    try:
        return await service.extract(file)
    except Exception as exc:  # noqa: BLE001
        # Für MVP: generische Fehlermeldung
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to parse offer document.",
        ) from exc