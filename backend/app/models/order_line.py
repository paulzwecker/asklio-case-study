# app/models/order_line.py

from typing import Optional

from pydantic import BaseModel, condecimal, PositiveInt


class OrderLine(BaseModel):
    id: Optional[int] = None
    position_description: str
    unit_price: condecimal(max_digits=12, decimal_places=2)
    amount: PositiveInt
    unit: str
    total_price: condecimal(max_digits=12, decimal_places=2)
