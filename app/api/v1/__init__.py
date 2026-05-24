from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.companies import router as companies_router
from app.api.v1.employees import router as employees_router
from app.api.v1.shifts import router as shifts_router
from app.api.v1.clock_records import router as clock_records_router
from app.api.v1.whatsapp import router as whatsapp_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.requests import router as requests_router
from app.api.v1.inspection import router as inspection_router
from app.api.v1.work_orders import router as work_orders_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(companies_router, prefix="/companies", tags=["companies"])
api_router.include_router(employees_router, prefix="/employees", tags=["employees"])
api_router.include_router(shifts_router, prefix="/shifts", tags=["shifts"])
api_router.include_router(clock_records_router, prefix="/clock-records", tags=["clock-records"])
api_router.include_router(whatsapp_router, prefix="/whatsapp", tags=["whatsapp"])
api_router.include_router(audit_logs_router, prefix="/audit-logs", tags=["audit-logs"])
api_router.include_router(requests_router, prefix="/requests", tags=["requests"])
api_router.include_router(inspection_router, prefix="/inspection", tags=["inspection"])
api_router.include_router(work_orders_router, prefix="/work-orders", tags=["work-orders"])


