# app/services/offer_extraction_service.py

from io import BytesIO

import anyio
from fastapi import UploadFile

from pypdf import PdfReader

from app.clients.openai_client import OpenAIClient
from app.models.offer import OfferExtractionResult
from app.models.order_line import OrderLine


class OfferExtractionService:
    """
    Service responsible for:
    - Reading the uploaded PDF.
    - Extracting text from all pages.
    - Sending text to OpenAIClient for structured parsing.
    - Mapping the raw dict into OfferExtractionResult (Pydantic model).
    """

    def __init__(self, openai_client: OpenAIClient) -> None:
        self._openai = openai_client

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        """
        Extract plain text from the PDF using pypdf.

        This is intentionally simple; it assumes digital PDFs
        (no OCR), which matches the case study.
        """
        reader = PdfReader(BytesIO(file_bytes))
        pages: list[str] = []

        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)

        return "\n\n".join(pages).strip()

    async def extract(self, file: UploadFile) -> OfferExtractionResult:
        # 1. PDF lesen
        raw_bytes = await file.read()
        pdf_text = self._extract_pdf_text(raw_bytes)
        if not pdf_text:
            # Falls Text-Extraktion komplett scheitert
            return OfferExtractionResult(order_lines=[])

        # 2. OpenAI aufrufen (blocking → in Thread ausführen)
        raw_dict = await anyio.to_thread.run_sync(
            self._openai.extract_offer, pdf_text
        )

        # 3. Dict in OfferExtractionResult gießen
        #    Pydantic übernimmt Typkonvertierung (Floats → Decimal etc.)
        order_lines_raw = raw_dict.get("order_lines") or []
        order_lines: list[OrderLine] = []
        for i, line in enumerate(order_lines_raw):
            try:
                order_lines.append(OrderLine(**line))
            except Exception as exc:  # noqa: BLE001
                # Defensive: Fehlerhafte Einzelzeilen überspringen, Rest behalten
                # In einem realen System könntest du hier loggen.
                continue

        result = OfferExtractionResult(
            vendor_name=raw_dict.get("vendor_name"),
            vendor_vat_id=raw_dict.get("vendor_vat_id"),
            department=raw_dict.get("department"),
            title=raw_dict.get("title"),
            order_lines=order_lines,
            total_cost=raw_dict.get("total_cost"),
            commodity_group_suggestion=raw_dict.get("commodity_group_suggestion"),
        )

        return result


def get_offer_extraction_service() -> OfferExtractionService:
    client = OpenAIClient()
    return OfferExtractionService(openai_client=client)
