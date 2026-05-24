import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from app.core.database import Base

class WhatsAppLog(Base):
    __tablename__ = "whatsapp_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="SET NULL"), nullable=True) # Null if number is unknown
    phone_number = Column(String(30), nullable=False) # e.g. +34600000000
    message_body = Column(Text, nullable=False)
    direction = Column(String(10), nullable=False) # INBOUND or OUTBOUND
    twilio_message_sid = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_whatsapp_logs_phone_number", "phone_number"),
    )
