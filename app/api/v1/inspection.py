import secrets
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Response
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_active_manager
from app.models.employee import Employee
from app.models.company import Company
from app.models.clock_record import ClockRecord
from app.models.audit_log import AuditLog
from app.models.inspection_token import InspectionToken
from app.schemas.inspection_token import InspectionTokenCreate, InspectionTokenResponse
from app.schemas.clock_record import ClockRecordResponse
from app.schemas.audit_log import AuditLogResponse
from app.services.pdf_service import generate_spanish_timesheet_pdf

router = APIRouter()

def get_valid_inspection_company(db: Session, token_str: str) -> Company:
    """
    Helper to check if a token string is valid, unexpired, and unrevoked.
    Returns the associated Company if valid, otherwise raises 401.
    """
    token_record = db.query(InspectionToken).filter(InspectionToken.token == token_str).first()
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de inspección inválido o no encontrado."
        )
    
    # Check revocation
    if token_record.is_revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de inspección ha sido revocado."
        )
    
    # Check expiration
    now_utc = datetime.now(timezone.utc)
    # Ensure expires_at has timezone info for comparison
    expires_at = token_record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
        
    if now_utc > expires_at:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="El token de inspección ha expirado."
        )
        
    return token_record.company

@router.post("/tokens", response_model=InspectionTokenResponse, status_code=status.HTTP_201_CREATED)
def create_inspection_token(
    payload: InspectionTokenCreate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Generates a secure, temporary inspection token for the manager's company.
    """
    token_code = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=payload.duration_hours)
    
    new_token = InspectionToken(
        company_id=current_user.company_id,
        token=token_code,
        expires_at=expires_at,
        is_revoked=False
    )
    db.add(new_token)
    db.commit()
    db.refresh(new_token)
    
    return new_token

@router.get("/tokens", response_model=List[InspectionTokenResponse])
def list_inspection_tokens(
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Lists all generated inspection tokens for the manager's company.
    """
    return db.query(InspectionToken).filter(
        InspectionToken.company_id == current_user.company_id
    ).order_by(InspectionToken.created_at.desc()).all()

@router.post("/tokens/{token_id}/revoke", response_model=InspectionTokenResponse)
def revoke_inspection_token(
    token_id: str,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Revokes an inspection token immediately.
    """
    token_record = db.query(InspectionToken).filter(
        InspectionToken.id == token_id,
        InspectionToken.company_id == current_user.company_id
    ).first()
    
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Token no encontrado."
        )
        
    token_record.is_revoked = True
    db.commit()
    db.refresh(token_record)
    
    return token_record

@router.get("/verify")
def verify_token(
    token: str = Query(..., description="El token de acceso de inspección temporal"),
    db: Session = Depends(get_db)
):
    """
    Publicly verifies if a token is valid, returning the company identity.
    """
    company = get_valid_inspection_company(db, token)
    return {
        "valid": True,
        "company_id": company.id,
        "company_name": company.name,
        "cif": company.cif,
        "ccc": company.ccc
    }

@router.get("/records", response_model=List[ClockRecordResponse])
def get_inspection_records(
    token: str = Query(..., description="El token de acceso de inspección temporal"),
    employee_id: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for inspectors to list clock records of the company.
    """
    company = get_valid_inspection_company(db, token)
    
    query = db.query(ClockRecord).filter(ClockRecord.company_id == company.id)
    if employee_id:
        query = query.filter(ClockRecord.employee_id == employee_id)
        
    return query.order_by(ClockRecord.clock_in.desc()).all()

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_inspection_audit_logs(
    token: str = Query(..., description="El token de acceso de inspección temporal"),
    db: Session = Depends(get_db)
):
    """
    Public endpoint for inspectors to inspect the modification audit logs.
    """
    company = get_valid_inspection_company(db, token)
    return db.query(AuditLog).filter(
        AuditLog.company_id == company.id
    ).order_by(AuditLog.created_at.desc()).all()

@router.get("/export-pdf")
def export_inspection_pdf(
    token: str = Query(..., description="El token de acceso de inspección temporal"),
    employee_id: str = Query(..., description="ID del empleado a exportar"),
    year: int = Query(..., description="Año del informe"),
    month: int = Query(..., description="Mes del informe (1-12)"),
    db: Session = Depends(get_db)
):
    """
    Generates and returns the official monthly PDF timesheet report for the inspector.
    """
    company = get_valid_inspection_company(db, token)
    
    employee = db.query(Employee).filter(
        Employee.id == employee_id,
        Employee.company_id == company.id
    ).first()
    
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Empleado no encontrado en esta empresa."
        )
        
    # Get all employee clock records for the selected month/year
    # Let's filter records in the DB to make sure we only pull relevant entries
    start_date = datetime(year, month, 1)
    if month == 12:
        end_date = datetime(year + 1, 1, 1)
    else:
        end_date = datetime(year, month + 1, 1)
        
    records = db.query(ClockRecord).filter(
        ClockRecord.employee_id == employee_id,
        ClockRecord.clock_in >= start_date,
        ClockRecord.clock_in < end_date
    ).order_by(ClockRecord.clock_in.asc()).all()
    
    pdf_buffer = generate_spanish_timesheet_pdf(
        company=company,
        employee=employee,
        year=year,
        month=month,
        clock_records=records
    )
    
    filename = f"registro_horario_{employee.last_name}_{month}_{year}.pdf"
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"'
    }
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers=headers
    )
