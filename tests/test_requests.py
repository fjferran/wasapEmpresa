from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.request import Request

def test_requests_lifecycle(client: TestClient, db: Session):
    # 1. Register company and admin
    client.post("/api/v1/companies/register", json={
        "company": {"name": "Request Corp", "cif": "B99999999"},
        "admin": {
            "first_name": "Boss", "last_name": "Man",
            "phone_number": "+34688888888", "email": "boss@req.com",
            "password": "bosspassword", "role": "admin"
        }
    })
    
    admin_token = client.post("/api/v1/auth/login", data={
        "username": "boss@req.com", "password": "bosspassword"
    }).json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    
    # Register an employee
    emp_resp = client.post("/api/v1/employees/", json={
        "first_name": "Worker", "last_name": "Bee",
        "phone_number": "+34677777777", "email": "worker@req.com",
        "password": "workerpassword", "role": "employee"
    }, headers=admin_headers)
    assert emp_resp.status_code == 201
    
    # Login as employee
    worker_token = client.post("/api/v1/auth/login", data={
        "username": "worker@req.com", "password": "workerpassword"
    }).json()["access_token"]
    worker_headers = {"Authorization": f"Bearer {worker_token}"}
    
    # 2. Worker creates a vacation request
    req_payload = {
        "type": "VACATION",
        "details": "Solicito vacaciones del 1 al 10 de Agosto"
    }
    create_resp = client.post("/api/v1/requests/", json=req_payload, headers=worker_headers)
    assert create_resp.status_code == 201
    req_json = create_resp.json()
    assert req_json["status"] == "PENDING"
    assert req_json["details"] == "Solicito vacaciones del 1 al 10 de Agosto"
    req_id = req_json["id"]
    
    # 3. Worker lists their own requests (should see 1)
    list_worker = client.get("/api/v1/requests/", headers=worker_headers)
    assert list_worker.status_code == 200
    assert len(list_worker.json()) == 1
    
    # 4. Admin lists company requests (should see worker's request and its nested employee details)
    list_admin = client.get("/api/v1/requests/", headers=admin_headers)
    assert list_admin.status_code == 200
    assert len(list_admin.json()) == 1
    assert list_admin.json()[0]["employee"]["email"] == "worker@req.com"
    
    # 5. Admin resolves (approves) the request
    resolve_resp = client.patch(f"/api/v1/requests/{req_id}", json={"status": "APPROVED"}, headers=admin_headers)
    assert resolve_resp.status_code == 200
    assert resolve_resp.json()["status"] == "APPROVED"
    
    # Verify DB state
    db_req = db.query(Request).filter(Request.id == req_id).first()
    assert db_req.status == "APPROVED"
