from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.clock_record import ClockRecord

def test_inspection_portal_flow(client: TestClient, db: Session):
    # 1. Setup Company and Admin
    reg_response = client.post("/api/v1/companies/register", json={
        "company": {"name": "Test Inspector SL", "cif": "B12345678", "ccc": "12345678901"},
        "admin": {
            "first_name": "Carlos", "last_name": "Gomez",
            "phone_number": "+34611111111", "email": "carlos@inspector.com",
            "password": "carlospassword", "role": "admin"
        }
    })
    assert reg_response.status_code == 201
    
    # Login to get admin token
    login_response = client.post("/api/v1/auth/login", data={
        "username": "carlos@inspector.com",
        "password": "carlospassword"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Add an Employee with NIF/NIE and NSS
    emp_response = client.post("/api/v1/employees/", headers=headers, json={
        "first_name": "Juan", "last_name": "Perez",
        "phone_number": "+34622222222", "email": "juan@inspector.com",
        "role": "employee", "password": "juanpassword",
        "nif_nie": "12345678Z", "nss": "461234567890"
    })
    assert emp_response.status_code == 201
    employee_id = emp_response.json()["id"]
    
    # Accept GDPR for this employee
    db_emp = db.query(Employee).filter(Employee.id == employee_id).first()
    db_emp.rgpd_accepted = True
    db_emp.rgpd_accepted_at = datetime.now(timezone.utc)
    db_emp.rgpd_accepted_ip = "127.0.0.1"
    db.commit()
    
    # Create a clock record manually
    clock_response = client.post("/api/v1/clock-records/", headers=headers, json={
        "employee_id": employee_id,
        "clock_in": datetime.now(timezone.utc).isoformat(),
        "clock_in_method": "WEB"
    })
    assert clock_response.status_code == 201
    record_id = clock_response.json()["id"]
    
    # Complete clock-out
    client.put(f"/api/v1/clock-records/{record_id}", headers=headers, json={
        "clock_out": datetime.now(timezone.utc).isoformat(),
        "clock_out_method": "WEB"
    })
    
    # 3. Create inspection token
    token_response = client.post("/api/v1/inspection/tokens", headers=headers, json={
        "duration_hours": 24
    })
    assert token_response.status_code == 201
    inspect_token_data = token_response.json()
    inspect_token = inspect_token_data["token"]
    token_id = inspect_token_data["id"]
    
    # 4. Consume inspection token (Public Inspector flow)
    # 4.1 Verify token
    verify_resp = client.get(f"/api/v1/inspection/verify?token={inspect_token}")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["valid"] is True
    assert verify_resp.json()["company_name"] == "Test Inspector SL"
    assert verify_resp.json()["ccc"] == "12345678901"
    
    # 4.2 Query records
    records_resp = client.get(f"/api/v1/inspection/records?token={inspect_token}")
    assert records_resp.status_code == 200
    records = records_resp.json()
    assert len(records) > 0
    # Verify cryptographic signature exists
    assert records[0]["record_hash"] is not None
    
    # 4.3 Query audit logs
    audit_resp = client.get(f"/api/v1/inspection/audit-logs?token={inspect_token}")
    assert audit_resp.status_code == 200
    assert len(audit_resp.json()) > 0
    
    # 4.4 Export PDF
    today = datetime.now()
    pdf_resp = client.get(
        f"/api/v1/inspection/export-pdf?token={inspect_token}&employee_id={employee_id}&year={today.year}&month={today.month}"
    )
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 0
    
    # 5. Revoke inspection token
    revoke_resp = client.post(f"/api/v1/inspection/tokens/{token_id}/revoke", headers=headers)
    assert revoke_resp.status_code == 200
    assert revoke_resp.json()["is_revoked"] is True
    
    # 6. Verify token is now blocked
    verify_blocked = client.get(f"/api/v1/inspection/verify?token={inspect_token}")
    assert verify_blocked.status_code == 401
    
    records_blocked = client.get(f"/api/v1/inspection/records?token={inspect_token}")
    assert records_blocked.status_code == 401
