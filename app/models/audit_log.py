import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, JSON
from app.core.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True) # Null if system/WhatsApp webhook
    action = Column(String(20), nullable=False) # CREATE, UPDATE, DELETE
    table_name = Column(String(50), nullable=False) # e.g. clock_records
    record_id = Column(String(36), nullable=False)
    old_values = Column(JSON, nullable=True)
    new_values = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("ix_audit_logs_company_id", "company_id"),
        Index("ix_audit_logs_table_record", "table_name", "record_id"),
    )
