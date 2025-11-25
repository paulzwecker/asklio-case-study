import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.models.request import ProcurementRequest, ProcurementRequestCreate
from app.models.status import RequestStatus
from app.services.request_service import RequestService, get_request_service

router = APIRouter(prefix="/requests", tags=["requests"])
logger = logging.getLogger("app")


class StatusUpdatePayload(BaseModel):
    status: RequestStatus


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
    results = service.list_requests(
        status_filter=status_filter,
        department=department,
        search=search,
    )
    logger.debug(
        "Listed requests with filters status=%s department=%s search=%s -> %s items",
        status_filter,
        department,
        search,
        len(results),
    )
    return results


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
    created = service.create_request(payload)
    logger.info(
        "Created request %s for vendor %s with total %s",
        created.id,
        created.vendor_name,
        created.total_cost,
    )
    return created


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
    payload: StatusUpdatePayload,
    service: RequestService = Depends(get_request_service),
) -> ProcurementRequest:
    updated = service.update_status(request_id, payload.status)
    if updated is None:
        raise HTTPException(status_code=404, detail="Request not found")
    logger.info(
        "Updated request %s status to %s",
        request_id,
        payload.status,
    )
    return updated
