import xml.etree.ElementTree as ET
from datetime import date, time
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models.clock_record import ClockRecord
from app.models.shift import Shift
from app.models.employee import Employee

def parse_twiml_message(xml_string: str) -> str:
    """Helper to extract text from TwiML XML response."""
    root = ET.fromstring(xml_string)
    message_node = root.find("Message")
    return message_node.text if message_node is not None else ""

def test_whatsapp_webhook_unregistered(client: TestClient):
    # Send webhook from an unknown number
    payload = {
        "From": "whatsapp:+34699999999",
        "Body": "ENTRADA",
        "MessageSid": "SM123"
    }
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/xml")
    
    msg_text = parse_twiml_message(response.text)
    assert "no está registrado en el sistema" in msg_text

def test_whatsapp_webhook_commands_flow(client: TestClient, db: Session):
    # 1. Setup Company and Employee
    client.post("/api/v1/companies/register", json={
        "company": {"name": "SaaS Test", "cif": "B87654321"},
        "admin": {
            "first_name": "David", "last_name": "Miller",
            "phone_number": "+34655555555", "email": "david@saas.com",
            "password": "davidpassword", "role": "admin"
        }
    })
    
    # Get employee object to inspect records directly
    employee = db.query(Employee).filter(Employee.phone_number == "+34655555555").first()
    
    # 2. Test AYUDA command (blocked by GDPR)
    payload = {
        "From": "whatsapp:+34655555555",
        "Body": "AYUDA",
        "MessageSid": "SM001"
    }
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Aviso Legal y RGPD" in msg_text

    # Accept GDPR via whatsapp command
    payload["Body"] = "ACEPTO RGPD"
    payload["MessageSid"] = "SM_RGPD_ACCEPT"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Consentimiento RGPD Registrado" in msg_text

    # Test AYUDA command again (now allowed)
    payload["Body"] = "AYUDA"
    payload["MessageSid"] = "SM001_HELP"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Comandos Disponibles" in msg_text

    # 3. Test ENTRADA command
    payload["Body"] = "ENTRADA"
    payload["MessageSid"] = "SM002"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "*ENTRADA* registrada" in msg_text
    
    # Verify record in DB
    records = db.query(ClockRecord).filter(ClockRecord.employee_id == employee.id).all()
    assert len(records) == 1
    assert records[0].clock_out is None
    assert records[0].clock_in_method == "WHATSAPP"

    # 4. Test duplicate ENTRADA command (should yield active clock-in error)
    payload["MessageSid"] = "SM003"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    msg_text = parse_twiml_message(response.text)
    assert "Ya tienes un fichaje de entrada activo" in msg_text

    # 5. Test SALIDA command
    payload["Body"] = "SALIDA"
    payload["MessageSid"] = "SM004"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    msg_text = parse_twiml_message(response.text)
    assert "*SALIDA* registrada" in msg_text
    
    # Verify update in DB
    db.refresh(records[0])
    assert records[0].clock_out is not None
    assert records[0].clock_out_method == "WHATSAPP"

    # 6. Test duplicate SALIDA command (should yield error)
    payload["MessageSid"] = "SM005"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    msg_text = parse_twiml_message(response.text)
    assert "No tienes ningún fichaje de entrada activo" in msg_text

    # 7. Test TURNO HOY command (no shift scheduled first)
    payload["Body"] = "TURNO HOY"
    payload["MessageSid"] = "SM006"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    msg_text = parse_twiml_message(response.text)
    assert "No tienes ningún turno planificado para hoy" in msg_text

    # Create a shift for today
    today_shift = Shift(
        company_id=employee.company_id,
        employee_id=employee.id,
        date=date.today(),
        start_time=time(9, 0),
        end_time=time(18, 0)
    )
    db.add(today_shift)
    db.commit()

    # Test TURNO HOY command again (now scheduled)
    payload["MessageSid"] = "SM007"
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    msg_text = parse_twiml_message(response.text)
    assert "Turno de Hoy" in msg_text
    assert "09:00" in msg_text
    assert "18:00" in msg_text

def test_whatsapp_webhook_location_flow(client: TestClient, db: Session):
    # 1. Setup Company and Employee
    client.post("/api/v1/companies/register", json={
        "company": {"name": "SaaS Location Test", "cif": "B87654322"},
        "admin": {
            "first_name": "Anna", "last_name": "Smith",
            "phone_number": "+34655555556", "email": "anna@saas.com",
            "password": "annapassword", "role": "admin"
        }
    })
    
    # Get employee object to inspect records directly
    employee = db.query(Employee).filter(Employee.phone_number == "+34655555556").first()
    
    # Accept GDPR via whatsapp command
    payload = {
        "From": "whatsapp:+34655555556",
        "Body": "ACEPTO RGPD",
        "MessageSid": "SM_RGPD_ACCEPT_LOC"
    }
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
      # Send webhook with location only (no body/text) -> Should return warning since we are not clocked-in yet
    payload = {
        "From": "whatsapp:+34655555556",
        "Latitude": "40.4167",
        "Longitude": "-3.7037",
        "MessageSid": "SM_LOC_IN"
    }
    response = client.post("/api/v1/whatsapp/webhook", data=payload)
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Ubicación No Registrada" in msg_text
    
    # Verify no voluntary location stored
    db.refresh(employee)
    assert employee.last_latitude is None

    # Clock in first
    payload_in = {
        "From": "whatsapp:+34655555556",
        "Body": "ENTRADA",
        "MessageSid": "SM_IN"
    }
    response = client.post("/api/v1/whatsapp/webhook", data=payload_in)
    assert response.status_code == 200

    # Send webhook with location only -> Should store voluntary location
    payload_loc = {
        "From": "whatsapp:+34655555556",
        "Latitude": "40.4200",
        "Longitude": "-3.7100",
        "MessageSid": "SM_LOC_VOLUNTARY"
    }
    response = client.post("/api/v1/whatsapp/webhook", data=payload_loc)
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Ubicación Voluntaria Registrada" in msg_text

    # Verify update in DB
    db.refresh(employee)
    assert employee.last_latitude == 40.4200
    assert employee.last_longitude == -3.7100
    assert employee.last_location_updated_at is not None

def test_whatsapp_webhook_delivery_orders(client: TestClient, db: Session):
    # Setup company
    client.post("/api/v1/companies/register", json={
        "company": {"name": "Driver Corp", "cif": "B87654325"},
        "admin": {
            "first_name": "Driver", "last_name": "Manager",
            "phone_number": "+34655555557", "email": "driver@corp.com",
            "password": "driverpassword", "role": "admin"
        }
    })
    
    employee = db.query(Employee).filter(Employee.phone_number == "+34655555557").first()
    
    # Accept GDPR via whatsapp command
    client.post("/api/v1/whatsapp/webhook", data={
        "From": "whatsapp:+34655555557",
        "Body": "ACEPTO RGPD",
        "MessageSid": "SM_RGPD_DRIVER"
    })
    
    # Authenticate manager
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "driver@corp.com",
        "password": "driverpassword"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create two work orders for this driver
    o1_resp = client.post("/api/v1/work-orders/", headers=headers, json={
        "employee_id": employee.id,
        "client_name": "Cliente Sol",
        "address": "Puerta del Sol, Madrid",
        "destination_latitude": 40.4167,
        "destination_longitude": -3.7037
    })
    assert o1_resp.status_code == 201
    o1_id = o1_resp.json()["id"]
    short_o1_id = o1_id[:4]
    
    o2_resp = client.post("/api/v1/work-orders/", headers=headers, json={
        "employee_id": employee.id,
        "client_name": "Cliente Mayor",
        "address": "Plaza Mayor, Madrid",
        "destination_latitude": 40.4153,
        "destination_longitude": -3.7073
    })
    assert o2_resp.status_code == 201
    o2_id = o2_resp.json()["id"]
    short_o2_id = o2_id[:4]

    # Test 'ENTREGAS' command
    response = client.post("/api/v1/whatsapp/webhook", data={
        "From": "whatsapp:+34655555557",
        "Body": "ENTREGAS",
        "MessageSid": "SM_ENTREGAS_LIST"
    })
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "TUS ENTREGAS DE HOY" in msg_text
    assert "Cliente Sol" in msg_text
    assert "Cliente Mayor" in msg_text
    assert short_o1_id in msg_text
    assert short_o2_id in msg_text

    # Test 'ENTREGA [ID] EN_RUTA'
    response = client.post("/api/v1/whatsapp/webhook", data={
        "From": "whatsapp:+34655555557",
        "Body": f"ENTREGA {short_o1_id} EN_RUTA",
        "MessageSid": "SM_ENTREGA_EN_RUTA"
    })
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "marcado como *EN RUTA*" in msg_text

    # Test 'ENTREGA [ID] OK' with GPS matching (within 150m)
    response = client.post("/api/v1/whatsapp/webhook", data={
        "From": "whatsapp:+34655555557",
        "Body": f"ENTREGA {short_o1_id} OK",
        "Latitude": 40.4168,
        "Longitude": -3.7038,
        "MessageSid": "SM_ENTREGA_OK_GPS"
    })
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Verificada por GPS" in msg_text

    # Test 'ENTREGA [ID] OK' far away
    response = client.post("/api/v1/whatsapp/webhook", data={
        "From": "whatsapp:+34655555557",
        "Body": f"ENTREGA {short_o2_id} OK",
        "Latitude": 40.4167,
        "Longitude": -3.7037,
        "MessageSid": "SM_ENTREGA_OK_FAR"
    })
    assert response.status_code == 200
    msg_text = parse_twiml_message(response.text)
    assert "Alerta: Te encuentras a" in msg_text

def test_work_order_optimization_api(client: TestClient, db: Session):
    # Setup company
    client.post("/api/v1/companies/register", json={
        "company": {"name": "Optimizer Corp", "cif": "B87654326"},
        "admin": {
            "first_name": "Route", "last_name": "Planner",
            "phone_number": "+34655555558", "email": "route@corp.com",
            "password": "routepassword", "role": "admin"
        }
    })
    
    employee = db.query(Employee).filter(Employee.phone_number == "+34655555558").first()
    
    # Authenticate manager
    login_resp = client.post("/api/v1/auth/login", data={
        "username": "route@corp.com",
        "password": "routepassword"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create two work orders
    client.post("/api/v1/work-orders/", headers=headers, json={
        "employee_id": employee.id,
        "client_name": "Plaza España",
        "address": "Plaza de España, Madrid",
        "destination_latitude": 40.4233,
        "destination_longitude": -3.7122
    })
    client.post("/api/v1/work-orders/", headers=headers, json={
        "employee_id": employee.id,
        "client_name": "Plaza Mayor",
        "address": "Plaza Mayor, Madrid",
        "destination_latitude": 40.4153,
        "destination_longitude": -3.7073
    })
    
    # Call optimize
    opt_resp = client.post("/api/v1/work-orders/optimize", headers=headers, json={
        "employee_id": employee.id,
        "origin_latitude": 40.4167,
        "origin_longitude": -3.7037
    })
    
    assert opt_resp.status_code == 200
    opt_data = opt_resp.json()
    assert len(opt_data) == 2
    
    # Closest to Sol (40.4167, -3.7037) should be Plaza Mayor (40.4153, -3.7073)
    assert opt_data[0]["client_name"] == "Plaza Mayor"
    assert opt_data[0]["route_order"] == 1
    assert opt_data[1]["client_name"] == "Plaza España"
    assert opt_data[1]["route_order"] == 2


