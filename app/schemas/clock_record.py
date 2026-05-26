from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class ClockRecordBase(BaseModel):
    employee_id: str
    clock_in: datetime
    clock_out: Optional[datetime] = None
    clock_in_method: str = "WEB"
    clock_out_method: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    latitude_out: Optional[float] = None
    longitude_out: Optional[float] = None

class ClockRecordCreate(BaseModel):
    employee_id: str
    clock_in: datetime
    clock_in_method: str = "WEB"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    latitude_out: Optional[float] = None
    longitude_out: Optional[float] = None

class ClockRecordUpdate(BaseModel):
    # Modifications are restricted and logged under audit logs
    clock_in: Optional[datetime] = None
    clock_out: Optional[datetime] = None
    clock_in_method: Optional[str] = None
    clock_out_method: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    latitude_out: Optional[float] = None
    longitude_out: Optional[float] = None

class ClockRecordResponse(ClockRecordBase):
    id: str
    company_id: str
    record_hash: Optional[str] = None
    signature_verified: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

