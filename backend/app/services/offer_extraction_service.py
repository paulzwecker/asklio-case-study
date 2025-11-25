# app/services/offer_extraction_service.py

import logging
from typing import List

import anyio
from fastapi import UploadFile

from app.clients.openai_client import OpenAIClient
from app.models.offer import OfferExtractionResult
from app.models.order_line import OrderLine


class OfferExtractionService:
    """Extract structured offer data from uploaded PDF documents."""

    def __init__(self, openai_client: OpenAIClient) -> None:
        self._openai = openai_client
        self._logger = logging.getLogger("app.offers")

    async def extract(self, file: UploadFile) -> OfferExtractionResult:
        """Read PDF content, call OpenAI on the whole file, and map the response."""
        raw_bytes = await file.read()
        self._logger.debug(
            "Read %s bytes from uploaded file %s", len(raw_bytes), file.filename
        )

        if not raw_bytes:
            self._logger.warning("Uploaded file %s is empty", file.filename)
            return OfferExtractionResult(order_lines=[])

        # Run the blocking OpenAI call in a worker thread
        raw_dict = await anyio.to_thread.run_sync(
            self._openai.extract_offer_from_pdf,
            raw_bytes,
            file.filename or "offer.pdf",
        )
        self._logger.debug("Raw offer extraction result: %s", raw_dict)

        order_lines_raw = raw_dict.get("order_lines") or []
        order_lines: List[OrderLine] = []

        for i, line in enumerate(order_lines_raw):
            if not isinstance(line, dict):
                self._logger.warning(
                    "Skipping non-dict order line at index %s: %r", i, line
                )
                continue

            normalized = dict(line)

            # Coerce numeric fields if present
            for key in ("unit_price", "amount", "total_price"):
                value = normalized.get(key)
                if value is not None:
                    try:
                        normalized[key] = float(value)
                    except (TypeError, ValueError):
                        self._logger.warning(
                            "Invalid numeric value for %s in line %s: %r",
                            key,
                            i,
                            value,
                        )
                        normalized[key] = None

            # Compute total_price if missing or zero but we have unit_price & amount
            if (
                not normalized.get("total_price")
                and normalized.get("unit_price") is not None
                and normalized.get("amount") is not None
            ):
                normalized["total_price"] = (
                    float(normalized["unit_price"]) * float(normalized["amount"])
                )

            # Default unit if missing
            if not normalized.get("unit"):
                normalized["unit"] = "Stk"

            try:
                order_lines.append(OrderLine(**normalized))
            except Exception as exc:  # noqa: BLE001
                self._logger.warning(
                    "Skipping invalid order line at index %s after normalization: %s",
                    i,
                    exc,
                )

        result = OfferExtractionResult(
            requestor_name=raw_dict.get("requestor_name"),
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
