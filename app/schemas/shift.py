from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict

class ShiftBase(BaseModel):
    employee_id: str
    date: date
    start_time: time
    end_time: time

class ShiftCreate(ShiftBase):
    is_forever: bool = True

class ShiftResponse(ShiftBase):
    id: str
    company_id: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
