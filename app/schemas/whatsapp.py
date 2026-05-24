from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class WhatsAppLogResponse(BaseModel):
    id: str
    company_id: Optional[str] = None
    phone_number: str
    message_body: str
    direction: str
    twilio_message_sid: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
