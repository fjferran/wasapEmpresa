from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.employee import Employee

def test_employee_creation_and_gdpr_anonymization(client: TestClient, db: Session):
    # 1. Setup Company and Admin
    reg_response = client.post("/api/v1/companies/register", json={
        "company": {"name": "Test Company", "cif": "A12345678"},
        "admin": {
            "first_name": "Admin", "last_name": "One",
            "phone_number": "+34600000001", "email": "admin@test.com",
            "password": "adminpassword", "role": "admin"
        }
    })
    token = client.post("/api/v1/auth/login", data={
        "username": "admin@test.com", "password": "adminpassword"
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Employee
    emp_payload = {
        "first_name": "Jane",
        "last_name": "Smith",
        "phone_number": "+34600111222",
        "email": "jane@test.com",
        "password": "janepassword",
        "role": "employee"
    }
    create_response = client.post("/api/v1/employees/", json=emp_payload, headers=headers)
    assert create_response.status_code == 201
    created_emp = create_response.json()
    assert created_emp["first_name"] == "Jane"
    assert created_emp["email"] == "jane@test.com"
    assert created_emp["role"] == "employee"
    assert created_emp["is_active"] is True
    emp_id = created_emp["id"]

    # 3. Verify phone format validation
    invalid_phone_payload = emp_payload.copy()
    invalid_phone_payload["email"] = "other@test.com"
    invalid_phone_payload["phone_number"] = "600222333" # missing '+' prefix
    response = client.post("/api/v1/employees/", json=invalid_phone_payload, headers=headers)
    assert response.status_code == 422 # Pydantic validation error

    # 4. Trigger GDPR Anonymize
    anon_response = client.post(f"/api/v1/employees/{emp_id}/anonymize", headers=headers)
    assert anon_response.status_code == 200
    assert "anonymized successfully" in anon_response.json()["message"]

    # 5. Check database states
    db_emp = db.query(Employee).filter(Employee.id == emp_id).first()
    assert db_emp.is_active is False
    assert db_emp.first_name == "ANONIMIZADO"
    assert "EMPLEADO_" in db_emp.last_name
    assert "@system-deleted.com" in db_emp.email
    assert db_emp.phone_number.startswith("+00000000_")
    assert db_emp.hashed_password == "DELETED_BY_GDPR_REQUEST"
