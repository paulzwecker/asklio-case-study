# app/api/routes/requests.py

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.models.request import ProcurementRequest, ProcurementRequestCreate
from app.models.status import RequestStatus
from app.services.request_service import RequestService, get_request_service

router = APIRouter(prefix="/requests", tags=["requests"])


@router.get(
    "",
    response_model=List[ProcurementRequest],
    summary="List procurement requests",
)
async def list_requests(
    status_filter: RequestStatus | None = None,
    department: str | None = None,
    search: str | None = None,
    service: RequestService = Depends(get_request_service),
) -> List[ProcurementRequest]:
    return service.list_requests(
        status_filter=status_filter,
        department=department,
        search=search,
    )


@router.post(
    "",
    response_model=ProcurementRequest,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new procurement request",
)
async def create_request(
    payload: ProcurementRequestCreate,
    service: RequestService = Depends(get_request_service),
) -> ProcurementRequest:
    return service.create_request(payload)


@router.get(
    "/{request_id}",
    response_model=ProcurementRequest,
    summary="Get a single request by ID",
)
async def get_request(
    request_id: UUID,
    service: RequestService = Depends(get_request_service),
) -> ProcurementRequest:
    req = service.get_request(request_id)
    if req is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.patch(
    "/{request_id}/status",
    response_model=ProcurementRequest,
    summary="Update the status of a request",
)
async def update_request_status(
    request_id: UUID,
    new_status: RequestStatus,
    service: RequestService = Depends(get_request_service),
) -> ProcurementRequest:
    updated = service.update_status(request_id, new_status)
    if updated is None:
        raise HTTPException(status_code=404, detail="Request not found")
    return updated
