import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class InspectionToken(Base):
    __tablename__ = "inspection_tokens"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    company_id = Column(String(36), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(100), unique=True, index=True, nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)

    # Relationships
    company = relationship("Company", back_populates="inspection_tokens")

    __table_args__ = (
        Index("ix_inspection_tokens_company_id", "company_id"),
    )

