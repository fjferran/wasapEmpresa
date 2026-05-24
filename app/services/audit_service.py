import hashlib
from datetime import datetime, date, time
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

def _serialize_dict_values(d: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    if d is None:
        return None
    res = {}
    for k, v in d.items():
        if isinstance(v, (datetime, date, time)):
            res[k] = v.isoformat()
        elif isinstance(v, dict):
            res[k] = _serialize_dict_values(v)
        else:
            res[k] = v
    return res

def log_audit_event(
    db: Session,
    company_id: str,
    action: str, # CREATE, UPDATE, DELETE
    table_name: str,
    record_id: str,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = None
) -> AuditLog:
    """
    Logs an event in the audit_logs table.
    Enforces compliance with labor registration regulations by tracing all modifications.
    """
    audit = AuditLog(
        company_id=company_id,
        user_id=user_id,
        action=action,
        table_name=table_name,
        record_id=record_id,
        old_values=_serialize_dict_values(old_values),
        new_values=_serialize_dict_values(new_values)
    )
    db.add(audit)
    db.commit()
    db.refresh(audit)
    return audit

def sign_clock_record(db: Session, record: Any) -> str:
    """
    Computes a cryptographic SHA-256 hash of a clock record to prove data integrity.
    If the record is tampered with in the database, the hash will mismatch.
    """
    in_str = record.clock_in.isoformat() if record.clock_in else ""
    out_str = record.clock_out.isoformat() if record.clock_out else ""
    lat_str = f"{record.latitude}" if record.latitude is not None else ""
    lon_str = f"{record.longitude}" if record.longitude is not None else ""
    lat_out_str = f"{record.latitude_out}" if record.latitude_out is not None else ""
    lon_out_str = f"{record.longitude_out}" if record.longitude_out is not None else ""
    raw_str = f"{record.id}|{record.company_id}|{record.employee_id}|{in_str}|{out_str}|{record.clock_in_method}|{record.clock_out_method}|{lat_str}|{lon_str}|{lat_out_str}|{lon_out_str}"
    
    # Calculate SHA-256 hash
    record_hash = hashlib.sha256(raw_str.encode('utf-8')).hexdigest()
    record.record_hash = record_hash
    db.commit()
    db.refresh(record)
    return record_hash

