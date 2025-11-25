# app/models/order_line.py

from typing import Optional
from pydantic import BaseModel, condecimal

Price = condecimal(max_digits=12, decimal_places=2, ge=0)
Quantity = condecimal(max_digits=12, decimal_places=3, gt=0)

class OrderLine(BaseModel):
    id: Optional[int] = None
    position_description: str
    unit_price: Price
    amount: Quantity
    unit: str
    total_price: Price
