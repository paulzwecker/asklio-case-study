# app/clients/openai_client.py

from typing import Any, Dict
import json

from openai import OpenAI

from app.core.config import settings


class OpenAIClient:
    """
    Thin wrapper around the OpenAI API for offer extraction.

    This client:
    - Receives plain text extracted from a vendor offer PDF.
    - Sends it to an LLM with a carefully engineered prompt.
    - Expects back a JSON object with the fields required by OfferExtractionResult.
    """

    def __init__(self, api_key: str | None = None) -> None:
        self._client = OpenAI(api_key=api_key or settings.openai_api_key)

    def extract_offer(self, offer_text: str) -> Dict[str, Any]:
        """
        Parse the given offer text into a structured JSON object.

        Returns a dict with at least:
        - vendor_name: str
        - vendor_vat_id: str | None
        - department: str | None
        - title: str | None
        - order_lines: list[dict]
        - total_cost: float | None
        - commodity_group_suggestion: str | None
        """
        system_prompt = (
            "You are an expert procurement extraction engine. "
            "Given the full plain-text content of a vendor offer (a quote) in German or English, "
            "you extract the commercial information needed to create a procurement request. "
            "You MUST strictly follow the JSON format requested by the user. "
            "If you are unsure about a field, use null. "
            "Never invent values that are not supported by the text."
        )

        user_prompt = f"""
            You receive the full plain-text content of a vendor offer (quote).

            Your goal is to extract all commercial information needed for a procurement request.

            Return ONLY valid JSON (no explanation, no markdown, no comments) with exactly these fields:

            {{
            "vendor_name": string,                 // legal/vendor name as written in the offer
            "vendor_vat_id": string or null,      // VAT ID / Umsatzsteuer-ID, e.g. "DE123456789"
            "department": string or null,         // internal department the offer is addressed to
            "title": string or null,              // short description of what is being procured
            "order_lines": [
                {{
                "position_description": string,   // free-text product/service description
                "unit_price": number,            // numeric unit price, no currency symbol
                "amount": number,                // quantity (e.g. 1, 5, 10)
                "unit": string,                  // unit label, e.g. "Stk", "pieces", "licenses"
                "total_price": number            // unit_price * amount
                }}
            ],
            "total_cost": number or null,        // overall offer total; use explicit total if present, else sum of line totals
            "commodity_group_suggestion": string or null // short suggestion like "IT - Software", "IT - Hardware", "Marketing & Advertising", etc.
            }}

            Important rules:
            - The JSON must be syntactically valid.
            - Do NOT include any currency symbols, thousands separators or text in numeric fields.
            - Example: write 2100, not "€2.100,00" or "2100 EUR".
            - Extract ALL relevant line items (products, services, shipping) that have a quantity and price.
            - If the document shows multiple alternative products/variants, include each as a separate order line.
            - If a field is missing in the text, set it to null.
            - For title: use a concise summary of the main thing being purchased (e.g. main product name).
            - For commodity_group_suggestion: pick a short, high-level category based on the items and vendor.

            Now parse the following vendor offer:

            \"\"\"{offer_text}\"\"\"
            """

        response = self._client.chat.completions.create(
            model="gpt-5.1",  # adjust if needed
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            # Force JSON output
            response_format={"type": "json_object"},
            # temperature=0.1,
        )

        content = response.choices[0].message.content
        if content is None:
            raise RuntimeError("OpenAI returned empty content for offer extraction.")

        try:
            data = json.loads(content)
        except json.JSONDecodeError as exc:
            # Include a short snippet of the model output to help debugging
            snippet = content[:500]
            raise RuntimeError(
                f"OpenAI returned invalid JSON for offer extraction: {exc}. "
                f"Snippet: {snippet}"
            ) from exc

        return data
