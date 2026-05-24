import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_manager, get_db
from app.core.security import get_password_hash
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(
    payload: EmployeeCreate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Creates a new employee for the tenant (company_id is inherited from the manager's tenant).
    Verifies that the email and phone number are globally unique.
    """
    # Verify phone is unique
    existing_phone = db.query(Employee).filter(Employee.phone_number == payload.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Phone number is already registered to another employee"
        )
    
    # Verify email is unique
    existing_email = db.query(Employee).filter(Employee.email == payload.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email address is already registered to another employee"
        )

    # Insert employee
    new_employee = Employee(
        company_id=current_user.company_id, # Enforce tenancy separation
        first_name=payload.first_name,
        last_name=payload.last_name,
        phone_number=payload.phone_number,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        role=payload.role,
        nif_nie=payload.nif_nie,
        nss=payload.nss,
        default_start_time=payload.default_start_time,
        default_end_time=payload.default_end_time,
        default_working_days=payload.default_working_days
    )
    db.add(new_employee)
    db.commit()
    db.refresh(new_employee)

    # Record event in audit log
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="CREATE",
        table_name="employees",
        record_id=new_employee.id,
        old_values=None,
        new_values={
            "first_name": new_employee.first_name,
            "last_name": new_employee.last_name,
            "email": new_employee.email,
            "phone_number": new_employee.phone_number,
            "role": new_employee.role,
            "nif_nie": new_employee.nif_nie,
            "nss": new_employee.nss,
            "default_start_time": new_employee.default_start_time.isoformat() if new_employee.default_start_time else None,
            "default_end_time": new_employee.default_end_time.isoformat() if new_employee.default_end_time else None,
            "default_working_days": new_employee.default_working_days
        },
        user_id=current_user.id
    )

    return new_employee

@router.get("/", response_model=List[EmployeeResponse])
def list_employees(
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Lists all employees belonging to the manager's company (tenant separation).
    """
    return db.query(Employee).filter(Employee.company_id == current_user.company_id).all()

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(
    employee_id: str,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Retrieves details of a specific employee, strictly checking company ownership.
    """
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Employee not found or unauthorized access"
        )
    return emp

@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Updates details of an employee, logging changes to the audit system.
    Strictly isolated to the manager's tenant.
    """
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Employee not found or unauthorized access"
        )
    
    # Store old values for audit logging
    old_values = {
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "email": emp.email,
        "phone_number": emp.phone_number,
        "role": emp.role,
        "is_active": emp.is_active,
        "nif_nie": emp.nif_nie,
        "nss": emp.nss,
        "default_start_time": emp.default_start_time.isoformat() if emp.default_start_time else None,
        "default_end_time": emp.default_end_time.isoformat() if emp.default_end_time else None,
        "default_working_days": emp.default_working_days
    }

    update_data = payload.model_dump(exclude_unset=True)
    
    # Check phone number uniqueness if it is being modified
    if "phone_number" in update_data and update_data["phone_number"] != emp.phone_number:
        existing = db.query(Employee).filter(Employee.phone_number == update_data["phone_number"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Phone number is already in use by another account"
            )

    # Check email uniqueness if it is being modified
    if "email" in update_data and update_data["email"] != emp.email:
        existing = db.query(Employee).filter(Employee.email == update_data["email"]).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Email address is already in use by another account"
            )

    # Apply changes
    for key, val in update_data.items():
        setattr(emp, key, val)

    db.commit()
    db.refresh(emp)

    # Record event in audit log
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="UPDATE",
        table_name="employees",
        record_id=emp.id,
        old_values=old_values,
        new_values=update_data,
        user_id=current_user.id
    )

    return emp

@router.post("/{employee_id}/anonymize")
def anonymize_employee(
    employee_id: str,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    GDPR 'Right to be Forgotten' Compliance.
    Instead of hard deleting, we overwrite personal data (names, email, phone number) with anonymous mocks, 
    disable the account, and clear credentials. This satisfies the user's deletion right while preserving 
    the integrity of historic clock records required for 4-year labor inspections in Spain.
    """
    emp = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Employee not found or unauthorized access"
        )

    # Restrict company from rendering itself admin-less
    if emp.role == "admin" and db.query(Employee).filter(
        Employee.company_id == current_user.company_id, 
        Employee.role == "admin", 
        Employee.is_active == True
    ).count() <= 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Cannot delete or anonymize the sole active admin of this company."
        )

    old_values = {
        "first_name": emp.first_name,
        "last_name": emp.last_name,
        "email": emp.email,
        "phone_number": emp.phone_number,
        "is_active": emp.is_active
    }

    # Generate a unique hash segment for the anonymization mapping
    hash_segment = str(uuid.uuid4())[:8]
    emp.first_name = "ANONIMIZADO"
    emp.last_name = f"EMPLEADO_{hash_segment}"
    emp.email = f"anonimo_{hash_segment}@system-deleted.com"
    # Overwrite phone number with a mock tag so the employee's original phone number is released for reuse
    emp.phone_number = f"+00000000_{hash_segment}"
    emp.hashed_password = "DELETED_BY_GDPR_REQUEST"
    emp.is_active = False

    db.commit()

    # Record event in audit log
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="ANONYMIZE",
        table_name="employees",
        record_id=emp.id,
        old_values=old_values,
        new_values={
            "first_name": emp.first_name,
            "last_name": emp.last_name,
            "email": emp.email,
            "phone_number": emp.phone_number,
            "is_active": emp.is_active
        },
        user_id=current_user.id
    )

    return {"message": "Employee personal data anonymized successfully under GDPR guidelines."}
