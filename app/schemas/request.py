from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class RequestBase(BaseModel):
    type: str # VACATION, SICK_LEAVE, CLOCK_CORRECTION
    details: str

class RequestCreate(RequestBase):
    pass

class RequestUpdate(BaseModel):
    status: str # APPROVED, REJECTED

class EmployeeMinInfo(BaseModel):
    id: str
    first_name: str
    last_name: str
    email: str

    model_config = ConfigDict(from_attributes=True)

class RequestResponse(RequestBase):
    id: str
    company_id: str
    employee_id: str
    status: str
    resolved_by: Optional[str]
    created_at: datetime
    updated_at: datetime
    employee: Optional[EmployeeMinInfo] = None

    model_config = ConfigDict(from_attributes=True)

