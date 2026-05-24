import re
from datetime import datetime, time
from typing import Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

class EmployeeBase(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    phone_number: str = Field(..., description="WhatsApp number in E.164 format, e.g. +34600000000")
    email: EmailStr
    role: str = Field("employee", description="Role: admin, manager, or employee")
    nif_nie: Optional[str] = Field(None, max_length=20, description="DNI/NIF/NIE del trabajador en España")
    nss: Optional[str] = Field(None, max_length=20, description="Número de la Seguridad Social")
    default_start_time: Optional[time] = Field(None, description="Hora de entrada por defecto")
    default_end_time: Optional[time] = Field(None, description="Hora de salida por defecto")
    default_working_days: Optional[str] = Field("1,2,3,4,5", description="Días laborables por defecto (1=Lunes, 5=Viernes)")

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        # Standard E.164 formatting check
        pattern = r"^\+[1-9]\d{1,14}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must be E.164 compliant (e.g., +34600000000)")
        return v

class EmployeeCreate(EmployeeBase):
    password: str = Field(..., min_length=6)

class EmployeeUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    nif_nie: Optional[str] = None
    nss: Optional[str] = None
    rgpd_accepted: Optional[bool] = None
    default_start_time: Optional[time] = None
    default_end_time: Optional[time] = None
    default_working_days: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        pattern = r"^\+[1-9]\d{1,14}$"
        if not re.match(pattern, v):
            raise ValueError("Phone number must be E.164 compliant (e.g., +34600000000)")
        return v

class EmployeeResponse(EmployeeBase):
    id: str
    company_id: str
    is_active: bool
    rgpd_accepted: bool
    rgpd_accepted_at: Optional[datetime] = None
    rgpd_accepted_ip: Optional[str] = None
    last_latitude: Optional[float] = None
    last_longitude: Optional[float] = None
    last_location_updated_at: Optional[datetime] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
