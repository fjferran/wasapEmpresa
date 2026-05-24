from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field

class CompanyBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    cif: str = Field(..., min_length=9, max_length=20, description="Tax ID (CIF) in Spain")
    ccc: Optional[str] = Field(None, max_length=50, description="Código de Cuenta de Cotización de la Seguridad Social")


class CompanyCreate(CompanyBase):
    pass

class CompanyResponse(CompanyBase):
    id: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
