import logging
from io import BytesIO

import anyio
from fastapi import UploadFile
from pypdf import PdfReader

from app.clients.openai_client import OpenAIClient
from app.models.offer import OfferExtractionResult
from app.models.order_line import OrderLine


class OfferExtractionService:
    """Extract structured offer data from uploaded PDF documents."""

    def __init__(self, openai_client: OpenAIClient) -> None:
        self._openai = openai_client
        self._logger = logging.getLogger("app.offers")

    def _extract_pdf_text(self, file_bytes: bytes) -> str:
        """Extract plain text from the PDF using pypdf."""
        reader = PdfReader(BytesIO(file_bytes))
        pages: list[str] = []

        for page in reader.pages:
            text = page.extract_text()
            if text:
                pages.append(text)

        return "\n\n".join(pages).strip()

    async def extract(self, file: UploadFile) -> OfferExtractionResult:
        """Read PDF content, call OpenAI, and map the response."""
        raw_bytes = await file.read()
        self._logger.debug("Read %s bytes from uploaded file %s", len(raw_bytes), file.filename)

        pdf_text = self._extract_pdf_text(raw_bytes)
        if not pdf_text:
            self._logger.warning("No text extracted from uploaded PDF %s", file.filename)
            return OfferExtractionResult(order_lines=[])

        raw_dict = await anyio.to_thread.run_sync(
            self._openai.extract_offer, pdf_text
        )

        order_lines_raw = raw_dict.get("order_lines") or []
        order_lines: list[OrderLine] = []
        for i, line in enumerate(order_lines_raw):
            try:
                order_lines.append(OrderLine(**line))
            except Exception as exc:  # noqa: BLE001
                self._logger.warning(
                    "Skipping invalid order line at index %s: %s",
                    i,
                    exc,
                )

        result = OfferExtractionResult(
            vendor_name=raw_dict.get("vendor_name"),
            vendor_vat_id=raw_dict.get("vendor_vat_id"),
            department=raw_dict.get("department"),
            title=raw_dict.get("title"),
            order_lines=order_lines,
            total_cost=raw_dict.get("total_cost"),
            commodity_group_suggestion=raw_dict.get("commodity_group_suggestion"),
        )

        self._logger.info(
            "Offer extraction completed with %s order lines for file %s",
            len(order_lines),
            file.filename,
        )
        return result


def get_offer_extraction_service() -> OfferExtractionService:
    """Provide OfferExtractionService with a configured OpenAI client."""
    client = OpenAIClient()
    return OfferExtractionService(openai_client=client)
