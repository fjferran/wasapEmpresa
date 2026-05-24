from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.employee import Employee
from app.models.shift import Shift

def test_prevent_duplicate_shifts_on_same_date(client: TestClient, db: Session):
    # 1. Setup Company and Admin
    reg_response = client.post("/api/v1/companies/register", json={
        "company": {"name": "Test Company", "cif": "B12345678"},
        "admin": {
            "first_name": "Admin", "last_name": "Shift",
            "phone_number": "+34600000002", "email": "adminshift@test.com",
            "password": "adminpassword", "role": "admin"
        }
    })
    token = client.post("/api/v1/auth/login", data={
        "username": "adminshift@test.com", "password": "adminpassword"
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Employee
    emp_payload = {
        "first_name": "Bob",
        "last_name": "Jones",
        "phone_number": "+34600111223",
        "email": "bob@test.com",
        "password": "bobpassword",
        "role": "employee"
    }
    created_emp = client.post("/api/v1/employees/", json=emp_payload, headers=headers).json()
    emp_id = created_emp["id"]

    # 3. Create Shift
    shift_payload = {
        "employee_id": emp_id,
        "date": "2026-06-01",
        "start_time": "09:00:00",
        "end_time": "17:00:00",
        "is_forever": False
    }
    res1 = client.post("/api/v1/shifts/", json=shift_payload, headers=headers)
    assert res1.status_code == 201

    # 4. Attempt to create a duplicate shift on the same date for the same employee
    res2 = client.post("/api/v1/shifts/", json=shift_payload, headers=headers)
    assert res2.status_code == 400
    assert "ya tiene un turno asignado" in res2.json()["detail"]

def test_create_forever_shift(client: TestClient, db: Session):
    # 1. Setup Company and Admin
    reg_response = client.post("/api/v1/companies/register", json={
        "company": {"name": "Test Company 2", "cif": "B12345679"},
        "admin": {
            "first_name": "Admin", "last_name": "Shift2",
            "phone_number": "+34600000003", "email": "adminshift2@test.com",
            "password": "adminpassword", "role": "admin"
        }
    })
    token = client.post("/api/v1/auth/login", data={
        "username": "adminshift2@test.com", "password": "adminpassword"
    }).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Create Employee
    emp_payload = {
        "first_name": "Alice",
        "last_name": "Smith",
        "phone_number": "+34600111224",
        "email": "alice@test.com",
        "password": "alicepassword",
        "role": "employee"
    }
    created_emp = client.post("/api/v1/employees/", json=emp_payload, headers=headers).json()
    emp_id = created_emp["id"]

    # 3. Create shift "forever" (updates default hours)
    shift_payload = {
        "employee_id": emp_id,
        "date": "2026-06-01",
        "start_time": "08:30:00",
        "end_time": "16:30:00",
        "is_forever": True
    }
    res = client.post("/api/v1/shifts/", json=shift_payload, headers=headers)
    assert res.status_code == 201
    
    # 4. Verify employee default times are updated in database
    db_emp = db.query(Employee).filter(Employee.id == emp_id).first()
    assert str(db_emp.default_start_time) == "08:30:00"
    assert str(db_emp.default_end_time) == "16:30:00"
