from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.models.request import ProcurementRequest, ProcurementRequestCreate
from app.models.status import RequestStatus


class RequestRepository(ABC):
    """Abstract repository for procurement requests."""

    @abstractmethod
    def list(
        self,
        status_filter: Optional[RequestStatus] = None,
        department: Optional[str] = None,
        search: Optional[str] = None,
    ) -> List[ProcurementRequest]:
        """Return all requests matching the provided optional filters."""
        raise NotImplementedError

    @abstractmethod
    def get(self, request_id: UUID) -> Optional[ProcurementRequest]:
        """Return a single request by id or None if not found."""
        raise NotImplementedError

    @abstractmethod
    def create(self, payload: ProcurementRequestCreate) -> ProcurementRequest:
        """Persist a newly created procurement request."""
        raise NotImplementedError

    @abstractmethod
    def update(self, request: ProcurementRequest) -> ProcurementRequest:
        """Persist updates to an existing procurement request."""
        raise NotImplementedError
