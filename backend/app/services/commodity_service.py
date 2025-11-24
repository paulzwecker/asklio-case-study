# app/services/commodity_service.py

from fastapi import Depends

from app.models.request import ProcurementRequestCreate


class CommodityService:
    """Determines commodity groups based on title, vendor, and order lines."""

    def suggest_for_request(self, payload: ProcurementRequestCreate) -> str:
        text = " ".join(
            [
                payload.title,
                payload.vendor_name or "",
                " ".join([line.position_description for line in payload.order_lines]),
            ]
        ).lower()

        if "adobe" in text or "software" in text:
            return "IT - Software"
        if (
            "macbook" in text
            or "laptop" in text
            or "notebook" in text
            or "hardware" in text
        ):
            return "IT - Hardware"
        if (
            "campaign" in text
            or "ads" in text
            or "facebook" in text
            or "instagram" in text
            or "marketing" in text
        ):
            return "Marketing & Advertising"

        return "Other"


def get_commodity_service() -> CommodityService:
    return CommodityService()
