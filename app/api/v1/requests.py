from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_employee, get_current_active_manager, get_db
from app.models.employee import Employee
from app.models.request import Request
from app.schemas.request import RequestCreate, RequestUpdate, RequestResponse
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.post("/", response_model=RequestResponse, status_code=status.HTTP_201_CREATED)
def create_request(
    payload: RequestCreate,
    current_user: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Creates a new request (vacation, sick leave, clock correction) for the logged in employee.
    """
    new_req = Request(
        company_id=current_user.company_id,
        employee_id=current_user.id,
        type=payload.type,
        details=payload.details
    )
    db.add(new_req)
    db.commit()
    db.refresh(new_req)

    # Auditing the request creation
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="CREATE",
        table_name="requests",
        record_id=new_req.id,
        old_values=None,
        new_values={
            "type": new_req.type,
            "details": new_req.details,
            "status": new_req.status
        },
        user_id=current_user.id
    )

    return new_req

@router.get("/", response_model=List[RequestResponse])
def list_requests(
    current_user: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Lists requests. Managers and Admins see all requests in the tenant company;
    regular employees only see their own requests.
    """
    query = db.query(Request).filter(Request.company_id == current_user.company_id)
    if current_user.role not in ["admin", "manager"]:
        query = query.filter(Request.employee_id == current_user.id)
    
    return query.order_by(Request.created_at.desc()).all()

@router.patch("/{request_id}", response_model=RequestResponse)
def resolve_request(
    request_id: str,
    payload: RequestUpdate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Approves or rejects an employee request. Restricted to managers and administrators.
    """
    req = db.query(Request).filter(
        Request.id == request_id,
        Request.company_id == current_user.company_id
    ).first()
    
    if not req:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Request not found"
        )
        
    old_vals = {
        "status": req.status,
        "resolved_by": req.resolved_by
    }
    
    req.status = payload.status
    req.resolved_by = current_user.id
    db.commit()
    db.refresh(req)

    # Auditing the request resolution
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="UPDATE",
        table_name="requests",
        record_id=req.id,
        old_values=old_vals,
        new_values={
            "status": req.status,
            "resolved_by": req.resolved_by
        },
        user_id=current_user.id
    )

    return req
