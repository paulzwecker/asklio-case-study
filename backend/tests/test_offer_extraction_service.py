from io import BytesIO

import pytest
from fastapi import UploadFile

from app.services.offer_extraction_service import OfferExtractionService


class FakeOpenAIClient:
    def extract_offer(self, offer_text: str):
        return {
            "vendor_name": "Acme Corp",
            "vendor_vat_id": "DE123",
            "department": "IT",
            "title": "Adobe License",
            "order_lines": [
                {
                    "position_description": "Adobe Creative Cloud",
                    "unit_price": 49.99,
                    "amount": 2,
                    "unit": "licenses",
                    "total_price": 99.98,
                }
            ],
            "total_cost": 99.98,
            "commodity_group_suggestion": "IT - Software",
        }


@pytest.mark.asyncio
async def test_offer_extraction_service_maps_response(monkeypatch) -> None:
    service = OfferExtractionService(openai_client=FakeOpenAIClient())
    monkeypatch.setattr(
        service, "_extract_pdf_text", lambda _: "Dummy PDF text for extraction"
    )

    dummy_pdf = BytesIO(b"%PDF-1.4\n% test pdf bytes")
    upload = UploadFile(
        filename="dummy.pdf",
        file=dummy_pdf,
        headers={"content-type": "application/pdf"},
    )

    result = await service.extract(upload)

    assert result.vendor_name == "Acme Corp"
    assert result.vendor_vat_id == "DE123"
    assert result.department == "IT"
    assert result.title == "Adobe License"
    assert result.commodity_group_suggestion == "IT - Software"
    assert len(result.order_lines) == 1
    assert result.order_lines[0].position_description == "Adobe Creative Cloud"
