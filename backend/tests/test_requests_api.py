from decimal import Decimal

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.repositories.memory_requests import InMemoryRequestRepository
from app.services.request_service import get_request_repository


@pytest.fixture()
def client() -> TestClient:
    repo = InMemoryRequestRepository()
    app.dependency_overrides[get_request_repository] = lambda: repo
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()


def test_create_and_fetch_request(client: TestClient) -> None:
    payload = {
        "requestor_name": "John Doe",
        "title": "Adobe Creative Cloud Licenses",
        "vendor_name": "Adobe",
        "vendor_vat_id": "DE123456789",
        "department": "IT",
        "commodity_group": None,
        "order_lines": [
            {
                "position_description": "Adobe CC license",
                "unit_price": "50.00",
                "amount": 2,
                "unit": "licenses",
                "total_price": "100.00",
            }
        ],
        "total_cost": "999.99",
    }

    create_resp = client.post("/api/requests", json=payload)
    assert create_resp.status_code == 201, create_resp.text
    data = create_resp.json()
    assert data["status"] == "Open"
    assert Decimal(data["total_cost"]) == Decimal("100.00")
    request_id = data["id"]

    list_resp = client.get("/api/requests")
    assert list_resp.status_code == 200
    items = list_resp.json()
    assert len(items) == 1
    assert items[0]["id"] == request_id

    get_resp = client.get(f"/api/requests/{request_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == request_id

    patch_resp = client.patch(
        f"/api/requests/{request_id}/status",
        json={"status": "In Progress"},
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "In Progress"
