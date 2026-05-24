import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Float, Integer, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    employee_id = Column(String(36), ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    
    client_name = Column(String(100), nullable=False)
    address = Column(String(255), nullable=False)
    destination_latitude = Column(Float, nullable=False)
    destination_longitude = Column(Float, nullable=False)
    
    status = Column(String(20), default="PENDING", nullable=False) # PENDING, IN_TRANSIT, COMPLETED, FAILED
    route_order = Column(Integer, default=0, nullable=False)
    delivery_notes = Column(String(255), nullable=True)
    
    verified_latitude = Column(Float, nullable=True)
    verified_longitude = Column(Float, nullable=True)
    gps_verified = Column(Boolean, default=False, nullable=False)
    
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    employee = relationship("Employee", back_populates="work_orders")

    # Indexes
    __table_args__ = (
        Index("ix_work_orders_company_id", "company_id"),
        Index("ix_work_orders_employee_id", "employee_id"),
    )
