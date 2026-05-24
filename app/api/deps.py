from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.employee import Employee
from app.schemas.auth import TokenData

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login"
)

def get_current_employee(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> Employee:
    """
    Decodes the JWT token and returns the current authenticated employee.
    Ensures that only active employees can make requests.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        employee_id: str = payload.get("sub")
        if employee_id is None:
            raise credentials_exception
        token_data = TokenData(id=employee_id)
    except (JWTError, ValidationError):
        raise credentials_exception
        
    employee = db.query(Employee).filter(Employee.id == token_data.id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Employee not found"
        )
    if not employee.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Employee is inactive"
        )
    return employee

def get_current_active_manager(
    current_employee: Employee = Depends(get_current_employee),
) -> Employee:
    """
    Enforces that the authenticated user is either an 'admin' or 'manager'.
    """
    if current_employee.role not in ["admin", "manager"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Requires manager or admin privileges."
        )
    return current_employee

def get_current_active_admin(
    current_employee: Employee = Depends(get_current_employee),
) -> Employee:
    """
    Enforces that the authenticated user is an 'admin'.
    """
    if current_employee.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted. Requires admin privileges."
        )
    return current_employee
