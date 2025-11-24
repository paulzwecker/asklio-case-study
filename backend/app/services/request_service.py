# app/services/request_service.py

from typing import Optional, List
from uuid import UUID

from fastapi import Depends

from app.models.request import ProcurementRequest, ProcurementRequestCreate
from app.models.status import RequestStatus
from app.repositories.base import RequestRepository
from app.repositories.memory_requests import InMemoryRequestRepository
from app.services.commodity_service import CommodityService, get_commodity_service


class RequestService:
    """Encapsulates business logic around procurement requests."""

    def __init__(
        self,
        repository: RequestRepository,
        commodity_service: CommodityService,
    ) -> None:
        self._repo = repository
        self._commodity_service = commodity_service

    def list_requests(
        self,
        status_filter: Optional[RequestStatus] = None,
        department: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProcurementRequest]:
        return self._repo.list(
            status_filter=status_filter,
            department=department,
            search=search,
        )

    def get_request(self, request_id: UUID) -> Optional[ProcurementRequest]:
        return self._repo.get(request_id)

    def create_request(self, payload: ProcurementRequestCreate) -> ProcurementRequest:
        # Falls Commodity Group fehlt: vom Service vorschlagen lassen
        if not payload.commodity_group:
            suggested = self._commodity_service.suggest_for_request(payload)
            payload.commodity_group = suggested

        # Optional: Validate total_cost vs. sum of order_lines
        calculated_total = sum([float(line.total_price) for line in payload.order_lines])
        if float(payload.total_cost) != calculated_total:
            # für MVP: einfach überschreiben
            payload.total_cost = calculated_total

        return self._repo.create(payload)

    def update_status(
        self,
        request_id: UUID,
        new_status: RequestStatus,
    ) -> Optional[ProcurementRequest]:
        req = self._repo.get(request_id)
        if req is None:
            return None
        if req.status == new_status:
            return req

        req.status = new_status
        return self._repo.update(req)


# Dependency wiring (für FastAPI Depends)

def get_request_repository() -> RequestRepository:
    # später einfach durch Postgres-Repo ersetzen
    return InMemoryRequestRepository()


def get_request_service(
    repo: RequestRepository = Depends(get_request_repository),
    commodity_service: CommodityService = Depends(get_commodity_service),
) -> RequestService:
    return RequestService(repository=repo, commodity_service=commodity_service)
