from datetime import date, timedelta, datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_manager, get_db
from app.models.employee import Employee
from app.models.shift import Shift
from app.schemas.shift import ShiftCreate, ShiftResponse
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.post("/", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(
    payload: ShiftCreate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Creates a new planned shift. Enforces that the target employee belongs to the same tenant.
    """
    # Enforce target employee belongs to the same tenant
    emp = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Employee does not exist or does not belong to your company."
        )

    if payload.is_forever:
        old_start = str(emp.default_start_time) if emp.default_start_time else None
        old_end = str(emp.default_end_time) if emp.default_end_time else None
        
        emp.default_start_time = payload.start_time
        emp.default_end_time = payload.end_time
        db.commit()
        
        # Log to audit trail
        log_audit_event(
            db=db,
            company_id=current_user.company_id,
            action="UPDATE",
            table_name="employees",
            record_id=emp.id,
            old_values={"default_start_time": old_start, "default_end_time": old_end},
            new_values={"default_start_time": payload.start_time.isoformat(), "default_end_time": payload.end_time.isoformat()},
            user_id=current_user.id
        )

        mock_shift = Shift(
            id=f"default-{emp.id}-{payload.date.isoformat()}",
            company_id=current_user.company_id,
            employee_id=payload.employee_id,
            date=payload.date,
            start_time=payload.start_time,
            end_time=payload.end_time,
            created_at=datetime.now(timezone.utc)
        )
        return mock_shift
    else:
        # Check if a shift already exists for this employee on the specified date
        existing_shift = db.query(Shift).filter(
            Shift.employee_id == payload.employee_id,
            Shift.date == payload.date
        ).first()
        if existing_shift:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El empleado ya tiene un turno asignado para esta fecha."
            )

        new_shift = Shift(
            company_id=current_user.company_id,
            employee_id=payload.employee_id,
            date=payload.date,
            start_time=payload.start_time,
            end_time=payload.end_time
        )
        db.add(new_shift)
        db.commit()
        db.refresh(new_shift)

        # Log to audit trail
        log_audit_event(
            db=db,
            company_id=current_user.company_id,
            action="CREATE",
            table_name="shifts",
            record_id=new_shift.id,
            old_values=None,
            new_values={
                "employee_id": new_shift.employee_id,
                "date": new_shift.date.isoformat(),
                "start_time": new_shift.start_time.isoformat(),
                "end_time": new_shift.end_time.isoformat()
            },
            user_id=current_user.id
        )

        return new_shift

@router.get("/", response_model=List[ShiftResponse])
def list_shifts(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    resolved: bool = True,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Lists shifts within the company, merging explicit overrides and the default weekly schedule if resolved=True.
    """
    # 1. Fetch target employees (all in company or the specific employee filtered)
    emp_query = db.query(Employee).filter(Employee.company_id == current_user.company_id)
    if employee_id:
        emp_query = emp_query.filter(Employee.id == employee_id)
    employees = emp_query.all()
    
    # 2. Fetch all explicit overrides from database
    override_query = db.query(Shift).filter(Shift.company_id == current_user.company_id)
    if employee_id:
        override_query = override_query.filter(Shift.employee_id == employee_id)
    if start_date:
        override_query = override_query.filter(Shift.date >= start_date)
    if end_date:
        override_query = override_query.filter(Shift.date <= end_date)
    overrides = override_query.all()
    
    # If not resolved or no dates provided, just return raw database overrides
    if not resolved or not start_date or not end_date:
        return overrides

    # Create override lookup dictionary: (employee_id, date) -> Shift
    override_dict = {(o.employee_id, o.date): o for o in overrides}
    
    resolved_shifts = []
    delta = end_date - start_date
    
    # 3. Resolve for each date and employee
    for emp in employees:
        for i in range(delta.days + 1):
            curr_date = start_date + timedelta(days=i)
            # Check override first
            if (emp.id, curr_date) in override_dict:
                resolved_shifts.append(override_dict[(emp.id, curr_date)])
            else:
                # Fallback to default weekly schedule
                if emp.default_start_time and emp.default_end_time:
                    weekday = curr_date.isoweekday() # 1 = Monday, 7 = Sunday
                    working_days = emp.default_working_days or "1,2,3,4,5"
                    days_list = [d.strip() for d in working_days.split(",") if d.strip()]
                    if str(weekday) in days_list:
                        # Construct a mock/virtual Shift object
                        resolved_shifts.append(
                            Shift(
                                id=f"default-{emp.id}-{curr_date.isoformat()}",
                                company_id=emp.company_id,
                                employee_id=emp.id,
                                date=curr_date,
                                start_time=emp.default_start_time,
                                end_time=emp.default_end_time,
                                created_at=emp.created_at
                            )
                        )
                        
    return resolved_shifts

@router.put("/{shift_id}", response_model=ShiftResponse)
def update_shift(
    shift_id: str,
    payload: ShiftCreate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Modifies a planned shift. Validates tenant separation, logging changes in audit_logs.
    """
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.company_id == current_user.company_id
    ).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Shift not found or unauthorized access."
        )

    old_values = {
        "employee_id": shift.employee_id,
        "date": shift.date.isoformat(),
        "start_time": shift.start_time.isoformat(),
        "end_time": shift.end_time.isoformat()
    }

    # Check target employee if changed
    if payload.employee_id != shift.employee_id:
        emp = db.query(Employee).filter(
            Employee.id == payload.employee_id,
            Employee.company_id == current_user.company_id
        ).first()
        if not emp:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Target employee does not belong to your company."
            )
        shift.employee_id = payload.employee_id

    # Check if another shift already exists for the target employee on the specified date
    existing_shift = db.query(Shift).filter(
        Shift.employee_id == payload.employee_id,
        Shift.date == payload.date,
        Shift.id != shift_id
    ).first()
    if existing_shift:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El empleado ya tiene un turno asignado para esta fecha."
        )

    shift.date = payload.date
    shift.start_time = payload.start_time
    shift.end_time = payload.end_time
    
    db.commit()
    db.refresh(shift)

    # Log to audit trail
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="UPDATE",
        table_name="shifts",
        record_id=shift.id,
        old_values=old_values,
        new_values={
            "employee_id": shift.employee_id,
            "date": shift.date.isoformat(),
            "start_time": shift.start_time.isoformat(),
            "end_time": shift.end_time.isoformat()
        },
        user_id=current_user.id
    )

    return shift

@router.delete("/{shift_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_shift(
    shift_id: str,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Deletes a shift schedule, registering the event in audit_logs.
    """
    shift = db.query(Shift).filter(
        Shift.id == shift_id,
        Shift.company_id == current_user.company_id
    ).first()
    if not shift:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Shift not found or unauthorized access."
        )

    old_values = {
        "employee_id": shift.employee_id,
        "date": shift.date.isoformat(),
        "start_time": shift.start_time.isoformat(),
        "end_time": shift.end_time.isoformat()
    }

    db.delete(shift)
    db.commit()

    # Log deletion event
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="DELETE",
        table_name="shifts",
        record_id=shift_id,
        old_values=old_values,
        new_values=None,
        user_id=current_user.id
    )
