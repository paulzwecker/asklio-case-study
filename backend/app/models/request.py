# app/models/request.py

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, condecimal

from app.models.order_line import OrderLine
from app.models.status import RequestStatus


class ProcurementRequestBase(BaseModel):
    requestor_name: str
    title: str
    vendor_name: str
    vendor_vat_id: str
    department: str
    commodity_group: Optional[str] = None
    order_lines: List[OrderLine]
    total_cost: condecimal(max_digits=14, decimal_places=2)


class ProcurementRequestCreate(ProcurementRequestBase):
    """Schema for incoming create requests."""
    pass


class ProcurementRequest(ProcurementRequestBase):
    """Schema representing a stored procurement request."""
    id: UUID = Field(default_factory=uuid4)
    status: RequestStatus = RequestStatus.OPEN
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
