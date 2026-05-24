import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Request(Base):
    __tablename__ = "requests"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(30), nullable=False) # VACATION, SICK_LEAVE, CLOCK_CORRECTION
    status = Column(String(20), default="PENDING", nullable=False) # PENDING, APPROVED, REJECTED
    details = Column(Text, nullable=False)
    resolved_by = Column(String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    employee = relationship("Employee", foreign_keys=[employee_id])
    resolver = relationship("Employee", foreign_keys=[resolved_by])

    __table_args__ = (
        Index("ix_requests_company_id", "company_id"),
        Index("ix_requests_employee_id", "employee_id"),
    )
