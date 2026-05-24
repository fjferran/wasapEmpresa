import csv
import io
from datetime import date, datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from app.api.deps import get_current_active_manager, get_current_employee, get_db
from app.models.employee import Employee
from app.models.clock_record import ClockRecord
from app.schemas.clock_record import ClockRecordCreate, ClockRecordUpdate, ClockRecordResponse
from app.services.audit_service import log_audit_event

router = APIRouter()

@router.get("/", response_model=List[ClockRecordResponse])
def list_clock_records(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: Employee = Depends(get_current_employee),
    db: Session = Depends(get_db)
):
    """
    Lists clock-in/out records.
    - Employees can only view their own records.
    - Managers/Admins can filter by any employee within the same company.
    """
    query = db.query(ClockRecord).filter(ClockRecord.company_id == current_user.company_id)
    
    if current_user.role not in ["admin", "manager"]:
        # Standard employees are restricted to their own entries
        query = query.filter(ClockRecord.employee_id == current_user.id)
    elif employee_id:
        query = query.filter(ClockRecord.employee_id == employee_id)
        
    if start_date:
        query = query.filter(ClockRecord.clock_in >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(ClockRecord.clock_in <= datetime.combine(end_date, datetime.max.time()))
        
    return query.order_by(ClockRecord.clock_in.desc()).all()

@router.post("/", response_model=ClockRecordResponse, status_code=status.HTTP_201_CREATED)
def create_clock_record_manually(
    payload: ClockRecordCreate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Registers a clock-in manually. Restricted to managers/admins.
    Enforces compliance by writing a detailed audit log entry.
    """
    # Enforce employee belongs to the same tenant
    emp = db.query(Employee).filter(
        Employee.id == payload.employee_id,
        Employee.company_id == current_user.company_id
    ).first()
    if not emp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Employee not found or unauthorized access."
        )

    new_record = ClockRecord(
        company_id=current_user.company_id,
        employee_id=payload.employee_id,
        clock_in=payload.clock_in,
        clock_in_method=payload.clock_in_method,
        latitude=payload.latitude,
        longitude=payload.longitude,
        latitude_out=payload.latitude_out,
        longitude_out=payload.longitude_out
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    from app.services.audit_service import sign_clock_record
    sign_clock_record(db, new_record)

    # Log to audit trail
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="CREATE_MANUAL",
        table_name="clock_records",
        record_id=new_record.id,
        old_values=None,
        new_values={
            "employee_id": new_record.employee_id,
            "clock_in": new_record.clock_in.isoformat(),
            "clock_in_method": new_record.clock_in_method,
            "latitude": new_record.latitude,
            "longitude": new_record.longitude,
            "latitude_out": new_record.latitude_out,
            "longitude_out": new_record.longitude_out
        },
        user_id=current_user.id
    )

    return new_record

@router.put("/{record_id}", response_model=ClockRecordResponse)
def update_clock_record_manually(
    record_id: str,
    payload: ClockRecordUpdate,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Updates a clock record (e.g. to fix a forgotten clock-out).
    Restricted to managers/admins.
    Spanish law compliance:
    1. Keeps original row ID intact (no physical delete).
    2. Writes a complete before/after audit state.
    """
    record = db.query(ClockRecord).filter(
        ClockRecord.id == record_id,
        ClockRecord.company_id == current_user.company_id
    ).first()
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Clock record not found or unauthorized access."
        )

    # Cache old values for audit logging
    old_values = {
        "clock_in": record.clock_in.isoformat() if record.clock_in else None,
        "clock_out": record.clock_out.isoformat() if record.clock_out else None,
        "clock_in_method": record.clock_in_method,
        "clock_out_method": record.clock_out_method,
        "latitude": record.latitude,
        "longitude": record.longitude,
        "latitude_out": record.latitude_out,
        "longitude_out": record.longitude_out
    }

    update_data = payload.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        setattr(record, key, val)

    db.commit()
    db.refresh(record)

    from app.services.audit_service import sign_clock_record
    sign_clock_record(db, record)

    # Log update event
    log_audit_event(
        db=db,
        company_id=current_user.company_id,
        action="UPDATE_MANUAL",
        table_name="clock_records",
        record_id=record.id,
        old_values=old_values,
        new_values=update_data,
        user_id=current_user.id
    )

    return record

@router.get("/export")
def export_clock_records_csv(
    employee_id: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    current_user: Employee = Depends(get_current_active_manager),
    db: Session = Depends(get_db)
):
    """
    Generates a CSV export of work records.
    Formatted with a semicolon (;) delimiter, standard for Spanish office programs like Microsoft Excel.
    """
    query = db.query(ClockRecord).filter(ClockRecord.company_id == current_user.company_id)
    if employee_id:
        query = query.filter(ClockRecord.employee_id == employee_id)
    if start_date:
        query = query.filter(ClockRecord.clock_in >= datetime.combine(start_date, datetime.min.time()))
    if end_date:
        query = query.filter(ClockRecord.clock_in <= datetime.combine(end_date, datetime.max.time()))

    records = query.order_by(ClockRecord.clock_in.asc()).all()

    # Create CSV structure in-memory
    output = io.StringIO()
    writer = csv.writer(output, delimiter=";")
    
    # Header fields
    writer.writerow([
        "ID_Registro",
        "ID_Empleado",
        "Nombre",
        "Apellidos",
        "Email",
        "Fecha_Entrada",
        "Hora_Entrada",
        "Metodo_Entrada",
        "Fecha_Salida",
        "Hora_Salida",
        "Metodo_Salida",
        "Horas_Trabajadas"
    ])

    for r in records:
        emp = r.employee
        first_name = emp.first_name if emp else "Desconocido"
        last_name = emp.last_name if emp else ""
        email = emp.email if emp else ""

        # Entry local timezone extraction
        in_local = r.clock_in.astimezone() if r.clock_in else None
        in_date_str = in_local.strftime("%Y-%m-%d") if in_local else ""
        in_time_str = in_local.strftime("%H:%M:%S") if in_local else ""

        # Exit local timezone extraction
        out_local = r.clock_out.astimezone() if r.clock_out else None
        out_date_str = out_local.strftime("%Y-%m-%d") if out_local else ""
        out_time_str = out_local.strftime("%H:%M:%S") if out_local else ""

        # Calculate exact duration
        hours_str = ""
        if r.clock_in and r.clock_out:
            duration = r.clock_out - r.clock_in
            hours_str = f"{duration.total_seconds() / 3600:.2f}"

        writer.writerow([
            r.id,
            r.employee_id,
            first_name,
            last_name,
            email,
            in_date_str,
            in_time_str,
            r.clock_in_method,
            out_date_str,
            out_time_str,
            r.clock_out_method or "",
            hours_str
        ])

    csv_content = output.getvalue()
    output.close()

    filename = f"registro_jornada_{date.today().isoformat()}.csv"
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    return Response(content=csv_content, media_type="text/csv", headers=headers)
