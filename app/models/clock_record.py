import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class ClockRecord(Base):
    __tablename__ = "clock_records"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    clock_in = Column(DateTime(timezone=True), nullable=False)
    clock_out = Column(DateTime(timezone=True), nullable=True)
    clock_in_method = Column(String(20), default="WHATSAPP", nullable=False) # WHATSAPP, WEB, etc.
    clock_out_method = Column(String(20), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    latitude_out = Column(Float, nullable=True)
    longitude_out = Column(Float, nullable=True)
    record_hash = Column(String(64), nullable=True) # SHA-256 validation of content integrity
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="clock_records")


    # Indexes
    __table_args__ = (
        Index("ix_clock_records_company_id", "company_id"),
        Index("ix_clock_records_employee_id", "employee_id"),
    )
