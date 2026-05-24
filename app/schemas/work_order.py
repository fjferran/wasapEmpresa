from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class WorkOrderBase(BaseModel):
    client_name: str
    address: str
    destination_latitude: float
    destination_longitude: float
    employee_id: Optional[str] = None
    status: str = "PENDING"
    route_order: int = 0
    delivery_notes: Optional[str] = None
    verified_latitude: Optional[float] = None
    verified_longitude: Optional[float] = None
    gps_verified: bool = False
    completed_at: Optional[datetime] = None

class WorkOrderCreate(BaseModel):
    client_name: str
    address: str
    destination_latitude: float
    destination_longitude: float
    employee_id: Optional[str] = None

class WorkOrderUpdate(BaseModel):
    client_name: Optional[str] = None
    address: Optional[str] = None
    destination_latitude: Optional[float] = None
    destination_longitude: Optional[float] = None
    employee_id: Optional[str] = None
    status: Optional[str] = None
    route_order: Optional[int] = None
    delivery_notes: Optional[str] = None
    verified_latitude: Optional[float] = None
    verified_longitude: Optional[float] = None
    gps_verified: Optional[bool] = None
    completed_at: Optional[datetime] = None

class WorkOrderResponse(WorkOrderBase):
    id: str
    company_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
