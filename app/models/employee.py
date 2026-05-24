import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Index, Time, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    phone_number = Column(String(20), nullable=False, unique=True) # Globally unique to route WhatsApp webhooks
    email = Column(String(100), nullable=False, unique=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(20), default="employee", nullable=False) # admin, manager, employee
    is_active = Column(Boolean, default=True, nullable=False)
    
    # Spanish Legal Compliance
    nif_nie = Column(String(20), nullable=True) # DNI / NIE / Passport
    nss = Column(String(30), nullable=True) # Numero Seguridad Social
    
    # GDPR Consent
    rgpd_accepted = Column(Boolean, default=False, nullable=False)
    rgpd_accepted_at = Column(DateTime(timezone=True), nullable=True)
    rgpd_accepted_ip = Column(String(45), nullable=True)

    # Default Weekly Schedule
    default_start_time = Column(Time, nullable=True)
    default_end_time = Column(Time, nullable=True)
    default_working_days = Column(String(30), default="1,2,3,4,5", nullable=True) # "1,2,3,4,5" = Mon-Fri

    # Voluntary GPS location tracking (only updated when clocked-in)
    last_latitude = Column(Float, nullable=True)
    last_longitude = Column(Float, nullable=True)
    last_location_updated_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    company = relationship("Company", back_populates="employees")
    shifts = relationship("Shift", back_populates="employee", cascade="all, delete-orphan")
    clock_records = relationship("ClockRecord", back_populates="employee", cascade="all, delete-orphan")
    work_orders = relationship("WorkOrder", back_populates="employee", cascade="all, delete-orphan")


    # Composite Index for tenancy filtering
    __table_args__ = (
        Index("ix_employees_company_id", "company_id"),
        Index("ix_employees_phone_number", "phone_number"),
    )
