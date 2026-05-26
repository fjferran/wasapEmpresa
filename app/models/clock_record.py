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

    @property
    def signature_verified(self) -> bool:
        import hashlib
        if not self.record_hash:
            return False
        in_str = self.clock_in.isoformat() if self.clock_in else ""
        out_str = self.clock_out.isoformat() if self.clock_out else ""
        lat_str = f"{self.latitude}" if self.latitude is not None else ""
        lon_str = f"{self.longitude}" if self.longitude is not None else ""
        lat_out_str = f"{self.latitude_out}" if self.latitude_out is not None else ""
        lon_out_str = f"{self.longitude_out}" if self.longitude_out is not None else ""
        raw_str = f"{self.id}|{self.company_id}|{self.employee_id}|{in_str}|{out_str}|{self.clock_in_method}|{self.clock_out_method}|{lat_str}|{lon_str}|{lat_out_str}|{lon_out_str}"
        recalculated = hashlib.sha256(raw_str.encode('utf-8')).hexdigest()
        return self.record_hash == recalculated

    # Relationships
    employee = relationship("Employee", back_populates="clock_records")


    # Indexes
    __table_args__ = (
        Index("ix_clock_records_company_id", "company_id"),
        Index("ix_clock_records_employee_id", "employee_id"),
    )
