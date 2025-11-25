import base64
import json
import logging
from typing import Any, Dict

from openai import OpenAI

from app.core.config import settings

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

OFFER_EXTRACTION_MODEL = "gpt-5.1"


class OpenAIClient:
    """
    Thin wrapper around the OpenAI API for offer extraction.

    This client:
    - Receives the raw PDF bytes of a vendor offer.
    - Sends the PDF to an LLM with a carefully engineered prompt.
    - Expects back a JSON object with the fields required by OfferExtractionResult.
    """

    def __init__(self, api_key: str | None = None) -> None:
        self._client = OpenAI(api_key=api_key or settings.openai_api_key)
        self._logger = logging.getLogger("app")

    def extract_offer_from_pdf(self, pdf_bytes: bytes, filename: str = "offer.pdf") -> Dict[str, Any]:
        """
        Parse the given offer PDF bytes into a structured JSON object.

        Returns a dict with at least:
        - requestor_name: str | None
        - vendor_name: str
        - vendor_vat_id: str | None
        - department: str | None
        - title: str | None
        - order_lines: list[dict]
        - total_cost: float | None
        - commodity_group_suggestion: str | None
        """
        self._logger.debug(
            "Calling OpenAI for offer extraction from PDF (bytes=%s, filename=%s)",
            len(pdf_bytes),
            filename,
        )

        base64_string = base64.b64encode(pdf_bytes).decode("utf-8")
        allowed_groups_str = ", ".join(f'"{g}"' for g in COMMODITY_GROUPS_PROMPT)

        instructions = (
            "You are an expert procurement extraction engine. "
            "Given a vendor offer (a quote) as a PDF in German or English, "
            "you extract the commercial information needed to create a procurement request. "
            "You MUST strictly follow the JSON format requested by the user. "
            "If you are unsure about a field, use null. "
            "Never invent values that are not supported by the document."
        )

        user_prompt = f"""
            You receive a vendor offer (quote) as a PDF file.

            Your goal is to extract all commercial information needed for a procurement request.

            Return ONLY valid JSON (no explanation, no markdown, no comments) with exactly these fields:

            {{
                "requestor_name": string or null,     // name of the customer contact or addressee (e.g. 'Vladimir Keil')
                "vendor_name": string,                // legal/vendor name as written in the offer
                "vendor_vat_id": string or null,      // VAT ID / Umsatzsteuer-ID, e.g. "DE123456789"
                "department": string or null,         // internal department the offer is addressed to
                "title": string or null,              // short description of what is being procured
                "order_lines": [
                    {{
                    "position_description": string,   // free-text product/service description
                    "unit_price": number,             // numeric unit price, no currency symbol
                    "amount": number,                 // quantity (can be fractional, e.g. 1.28)
                    "unit": string,                   // unit label, e.g. "Stk", "pieces", "licenses"
                    "total_price": number             // unit_price * amount
                    }}
                ],
                "total_cost": number or null,         // overall offer total; use explicit total if present, else sum of line totals
                "commodity_group_suggestion": string or null // one of the allowed commodity groups, or null
            }}

            Important rules:
            - The JSON must be syntactically valid.
            - Do NOT include any currency symbols, thousands separators or text in numeric fields.
            Example: write 2100, not "€2.100,00" or "2100 EUR".
            - Extract ALL relevant line items (products, services, shipping) that have a quantity and price.
            - If the document shows multiple alternative products/variants, include each as a separate order line.
            - If the unit is not explicitly mentioned, set "unit" to "Stk".
            - If the line total is not explicitly mentioned, compute "total_price" as unit_price * amount.
            - If a field is truly missing in the document, set it to null.
            - For "requestor_name": if the document clearly shows a customer addressee or contact person
            (e.g. in the header address block or in an "Offered to:" section), use that person's full name.
            Do NOT use the vendor's name here. If no person is clear, use null.
            - For "commodity_group_suggestion", choose exactly ONE of the following strings that fits
            the items and vendor the closest; Do only ever use *Other* when nothing else makes sense at all.

            [{allowed_groups_str}]
            """

        response = self._client.responses.create(
            model=OFFER_EXTRACTION_MODEL,
            instructions=instructions,
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_file",
                            "filename": filename,
                            "file_data": f"data:application/pdf;base64,{base64_string}",
                        },
                        {
                            "type": "input_text",
                            "text": user_prompt,
                        },
                    ],
                }
            ],
            # response_format={"type": "json_object"},
            temperature=0.2,  # less creative, more consistent
        )

        # Prefer the SDK helper, but fall back to manual extraction if needed
        raw_text = getattr(response, "output_text", None)
        if raw_text is None:
            try:
                output_items = getattr(response, "output", [])
                if output_items:
                    first = output_items[0]
                    content_list = getattr(first, "content", [])
                    if content_list:
                        raw_text = getattr(content_list[0], "text", None)
            except Exception as exc:  # noqa: BLE001
                self._logger.error("Failed to extract text from OpenAI response: %s", exc)
                raise RuntimeError("OpenAI returned a response without text content.") from exc

        if raw_text is None:
            raise RuntimeError("OpenAI returned empty content for offer extraction.")

        try:
            data = json.loads(raw_text)
        except json.JSONDecodeError as exc:
            snippet = raw_text[:500]
            self._logger.error(
                "OpenAI returned invalid JSON for offer extraction: %s (snippet=%s)",
                exc,
                snippet,
            )
            raise RuntimeError(
                f"OpenAI returned invalid JSON for offer extraction: {exc}. "
                f"Snippet: {snippet}"
            ) from exc

        return data