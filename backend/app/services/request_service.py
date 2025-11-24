import logging
from decimal import Decimal
from typing import List, Optional
from uuid import UUID

from fastapi import Depends

from app.models.request import ProcurementRequest, ProcurementRequestCreate
from app.models.status import RequestStatus
from app.repositories.base import RequestRepository
from app.repositories.memory_requests import InMemoryRequestRepository
from app.services.commodity_service import CommodityService, get_commodity_service

_REQUEST_REPOSITORY: Optional[InMemoryRequestRepository] = None


class RequestService:
    """Encapsulates business logic around procurement requests."""

    def __init__(
        self,
        repository: RequestRepository,
        commodity_service: CommodityService,
    ) -> None:
        self._repo = repository
        self._commodity_service = commodity_service
        self._logger = logging.getLogger("app.requests")

    def list_requests(
        self,
        status_filter: Optional[RequestStatus] = None,
        department: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProcurementRequest]:
        """Return requests filtered by optional status, department, and search query."""
        results = self._repo.list(
            status_filter=status_filter,
            department=department,
            search=search,
        )
        self._logger.debug("List returned %s requests", len(results))
        return results

    def get_request(self, request_id: UUID) -> Optional[ProcurementRequest]:
        """Retrieve a request by id or return None."""
        return self._repo.get(request_id)

    def create_request(self, payload: ProcurementRequestCreate) -> ProcurementRequest:
        """Create a new procurement request with derived data."""
        if not payload.commodity_group:
            payload.commodity_group = self._commodity_service.suggest_for_request(
                payload
            )

        calculated_total = sum(
            (Decimal(str(line.total_price)) for line in payload.order_lines),
            Decimal("0"),
        )
        current_total = Decimal(str(payload.total_cost))
        if current_total != calculated_total:
            payload.total_cost = calculated_total

        created = self._repo.create(payload)
        self._logger.info(
            "Created procurement request %s for vendor %s (total=%s)",
            created.id,
            created.vendor_name,
            created.total_cost,
        )
        return created

    def update_status(
        self,
        request_id: UUID,
        new_status: RequestStatus,
    ) -> Optional[ProcurementRequest]:
        """Update the status of an existing request."""
        req = self._repo.get(request_id)
        if req is None:
            return None
        if req.status == new_status:
            return req

        old_status = req.status
        req.status = new_status
        updated = self._repo.update(req)
        self._logger.info(
            "Status change for request %s: %s -> %s",
            request_id,
            old_status,
            new_status,
        )
        return updated


def get_request_repository() -> RequestRepository:
    """Provide a singleton-like repository instance."""
    global _REQUEST_REPOSITORY
    if _REQUEST_REPOSITORY is None:
        _REQUEST_REPOSITORY = InMemoryRequestRepository()
    return _REQUEST_REPOSITORY


def get_request_service(
    repo: RequestRepository = Depends(get_request_repository),
    commodity_service: CommodityService = Depends(get_commodity_service),
) -> RequestService:
    """FastAPI dependency wiring for RequestService."""
    return RequestService(repository=repo, commodity_service=commodity_service)
