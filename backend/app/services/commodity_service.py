# app/services/commodity_service.py

from fastapi import Depends

from app.models.request import ProcurementRequestCreate


COMMODITY_GROUPS_PROMPT = [
    "General Services - Accommodation Rentals",
    "General Services - Membership Fees",
    "General Services - Workplace Safety",
    "General Services - Consulting",
    "General Services - Financial Services",
    "General Services - Fleet Management",
    "General Services - Recruitment Services",
    "General Services - Professional Development",
    "General Services - Miscellaneous Services",
    "General Services - Insurance",
    "Facility Management - Electrical Engineering",
    "Facility Management - Facility Management Services",
    "Facility Management - Security",
    "Facility Management - Renovations",
    "Facility Management - Office Equipment",
    "Facility Management - Energy Management",
    "Facility Management - Maintenance",
    "Facility Management - Cafeteria and Kitchenettes",
    "Facility Management - Cleaning",
    "Publishing Production - Audio and Visual Production",
    "Publishing Production - Books/Videos/CDs",
    "Publishing Production - Printing Costs",
    "Publishing Production - Software Development for Publishing",
    "Publishing Production - Material Costs",
    "Publishing Production - Shipping for Production",
    "Publishing Production - Digital Product Development",
    "Publishing Production - Pre-production",
    "Publishing Production - Post-production Costs",
    "Information Technology - Hardware",
    "Information Technology - IT Services",
    "Information Technology - Software",
    "Logistics - Courier, Express, and Postal Services",
    "Logistics - Warehousing and Material Handling",
    "Logistics - Transportation Logistics",
    "Logistics - Delivery Services",
    "Marketing & Advertising - Advertising",
    "Marketing & Advertising - Outdoor Advertising",
    "Marketing & Advertising - Marketing Agencies",
    "Marketing & Advertising - Direct Mail",
    "Marketing & Advertising - Customer Communication",
    "Marketing & Advertising - Online Marketing",
    "Marketing & Advertising - Events",
    "Marketing & Advertising - Promotional Materials",
    "Production - Warehouse and Operational Equipment",
    "Production - Production Machinery",
    "Production - Spare Parts",
    "Production - Internal Transportation",
    "Production - Production Materials",
    "Production - Consumables",
    "Production - Maintenance and Repairs",
    "Other",
]



class CommodityService:
    """Determines commodity groups based on title, vendor, and order lines."""

    def suggest_for_request(self, payload: ProcurementRequestCreate) -> str:
        text = " ".join(
            [
                payload.title or "",
                payload.vendor_name or "",
                " ".join(line.position_description for line in payload.order_lines),
            ]
        ).lower()

        if any(k in text for k in ["adobe", "license", "software", "saas"]):
            return "Information Technology - Software"
        if any(k in text for k in ["macbook", "laptop", "notebook", "hardware"]):
            return "Information Technology - Hardware"
        if any(k in text for k in ["campaign", "ads", "facebook", "instagram", "marketing"]):
            return "Marketing & Advertising - Online Marketing"

        # Fallback
        return "Other"


def get_commodity_service() -> CommodityService:
    return CommodityService()
