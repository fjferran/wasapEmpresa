from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.company import Company
from app.models.employee import Employee
from app.schemas.company import CompanyCreate
from app.schemas.employee import EmployeeCreate
from pydantic import BaseModel

router = APIRouter()

class CompanyRegistrationRequest(BaseModel):
    company: CompanyCreate
    admin: EmployeeCreate

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_company(
    payload: CompanyRegistrationRequest,
    db: Session = Depends(get_db)
):
    """
    Registers a new company (tenant) and its primary administrator account atomically.
    Validates that CIF, email, and phone number are unique.
    """
    # Verify CIF is unique
    existing_company = db.query(Company).filter(Company.cif == payload.company.cif).first()
    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="CIF is already registered"
        )

    # Verify email and phone number are globally unique
    existing_email = db.query(Employee).filter(Employee.email == payload.admin.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email address is already registered"
        )
    
    existing_phone = db.query(Employee).filter(Employee.phone_number == payload.admin.phone_number).first()
    if existing_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Phone number is already registered"
        )

    # Create Company record
    db_company = Company(
        name=payload.company.name,
        cif=payload.company.cif,
        ccc=payload.company.ccc
    )
    db.add(db_company)
    db.flush() # Retrieve generated UUID without committing yet

    # Create primary admin employee linked to the company
    db_admin = Employee(
        company_id=db_company.id,
        first_name=payload.admin.first_name,
        last_name=payload.admin.last_name,
        phone_number=payload.admin.phone_number,
        email=payload.admin.email,
        hashed_password=get_password_hash(payload.admin.password),
        role="admin" # Root admin
    )
    db.add(db_admin)
    db.commit()
    db.refresh(db_company)

    return {
        "message": "Company and administrator registered successfully",
        "company": {
            "id": db_company.id,
            "name": db_company.name,
            "cif": db_company.cif,
            "ccc": db_company.ccc,
            "is_active": db_company.is_active,
            "created_at": db_company.created_at
        },
        "admin_id": db_admin.id
    }
