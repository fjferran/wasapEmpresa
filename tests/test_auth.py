from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

def test_company_registration_and_login_flow(client: TestClient, db: Session):
    # 1. Register a new company and admin employee
    registration_data = {
        "company": {
            "name": "Acme Corp",
            "cif": "B12345678"
        },
        "admin": {
            "first_name": "John",
            "last_name": "Doe",
            "phone_number": "+34600112233",
            "email": "admin@acme.com",
            "password": "securepassword",
            "role": "admin"
        }
    }
    
    response = client.post("/api/v1/companies/register", json=registration_data)
    assert response.status_code == 201
    resp_json = response.json()
    assert resp_json["message"] == "Company and administrator registered successfully"
    assert resp_json["company"]["name"] == "Acme Corp"
    assert resp_json["company"]["cif"] == "B12345678"
    assert "admin_id" in resp_json

    # 2. Try registering the same company CIF again (should fail)
    duplicate_cif_response = client.post("/api/v1/companies/register", json=registration_data)
    assert duplicate_cif_response.status_code == 400
    assert "CIF is already registered" in duplicate_cif_response.json()["detail"]

    # 3. Log in with the registered credentials
    login_data = {
        "username": "admin@acme.com", # OAuth2 username parameter corresponds to email
        "password": "securepassword"
    }
    login_response = client.post("/api/v1/auth/login", data=login_data)
    assert login_response.status_code == 200
    login_json = login_response.json()
    assert "access_token" in login_json
    assert login_json["token_type"] == "bearer"
    token = login_json["access_token"]

    # 4. Request employees list with authorization (should succeed)
    headers = {"Authorization": f"Bearer {token}"}
    employees_response = client.get("/api/v1/employees/", headers=headers)
    assert employees_response.status_code == 200
    employees_list = employees_response.json()
    assert len(employees_list) == 1
    assert employees_list[0]["email"] == "admin@acme.com"

    # 5. Request employees list without authorization (should fail)
    unauthorized_response = client.get("/api/v1/employees/")
    assert unauthorized_response.status_code == 401
