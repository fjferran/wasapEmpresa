import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Date, Time, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="shifts")

    # Indexes
    __table_args__ = (
        Index("ix_shifts_company_id_date", "company_id", "date"),
        Index("ix_shifts_employee_id_date", "employee_id", "date"),
    )
