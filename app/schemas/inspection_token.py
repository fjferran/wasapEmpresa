from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

class InspectionTokenCreate(BaseModel):
    duration_hours: int = Field(24, ge=1, le=168, description="Expiration duration in hours (default 24h, max 7 days)")

class InspectionTokenResponse(BaseModel):
    id: str
    company_id: str
    token: str
    expires_at: datetime
    is_revoked: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
