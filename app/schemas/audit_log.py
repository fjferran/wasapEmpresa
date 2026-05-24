from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict

class AuditLogResponse(BaseModel):
    id: str
    company_id: str
    user_id: Optional[str] = None
    action: str # CREATE, UPDATE, DELETE
    table_name: str
    record_id: str
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
