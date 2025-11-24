# app/models/offer.py

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, condecimal

from app.models.order_line import OrderLine


class OfferDocument(BaseModel):
    id: str
    filename: str
    content_type: str
    storage_path: str
    uploaded_at: datetime
    parsed_at: Optional[datetime] = None


class OfferExtractionResult(BaseModel):
    vendor_name: Optional[str] = None
    vendor_vat_id: Optional[str] = None
    department: Optional[str] = None
    title: Optional[str] = None
    order_lines: List[OrderLine] = Field(default_factory=list)
    total_cost: Optional[condecimal(max_digits=14, decimal_places=2)] = None
    commodity_group_suggestion: Optional[str] = None
