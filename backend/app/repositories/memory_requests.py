# app/repositories/memory_requests.py

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from app.models.request import ProcurementRequest, ProcurementRequestCreate
from app.models.status import RequestStatus
from app.repositories.base import RequestRepository


class InMemoryRequestRepository(RequestRepository):
    """Naive in-memory repository for MVP (no persistence across restarts)."""

    def __init__(self) -> None:
        self._store: Dict[UUID, ProcurementRequest] = {}

    def list(
        self,
        status_filter: Optional[RequestStatus] = None,
        department: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProcurementRequest]:
        items = list(self._store.values())

        if status_filter is not None:
            items = [r for r in items if r.status == status_filter]

        if department:
            items = [r for r in items if r.department.lower() == department.lower()]

        if search:
            s = search.lower()
            items = [
                r
                for r in items
                if s in r.title.lower() or s in r.vendor_name.lower()
            ]

        # TODO: pagination if needed
        return items

    def get(self, request_id: UUID) -> Optional[ProcurementRequest]:
        return self._store.get(request_id)

    def create(self, payload: ProcurementRequestCreate) -> ProcurementRequest:
        req = ProcurementRequest(**payload.dict())
        self._store[req.id] = req
        return req

    def update(self, request: ProcurementRequest) -> ProcurementRequest:
        request.updated_at = datetime.utcnow()
        self._store[request.id] = request
        return request
