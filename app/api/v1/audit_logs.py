from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_manager, get_db
from app.models.employee import Employee
from app.models.audit_log import AuditLog
from app.schemas.audit_log import AuditLogResponse

router = APIRouter()

@router.get("/", response_model=List[AuditLogResponse])
def list_audit_logs(
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Lists audit logs belonging to the manager's company (tenant isolation).
    """
    return db.query(AuditLog).filter(
        AuditLog.company_id == current_user.company_id
    ).order_by(AuditLog.created_at.desc()).all()
