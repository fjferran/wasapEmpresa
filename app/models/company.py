import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.core.database import Base

class Company(Base):
    __tablename__ = "companies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)
    cif = Column(String(20), nullable=False, unique=True)
    ccc = Column(String(50), nullable=True) # Codigo de Cuenta de Cotizacion
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    employees = relationship("Employee", back_populates="company", cascade="all, delete-orphan")
    inspection_tokens = relationship("InspectionToken", back_populates="company", cascade="all, delete-orphan")


