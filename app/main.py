from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.core.database import Base, engine

# Auto-create tables if running SQLite locally (for developer convenience)
# For production Postgres, Alembic migrations should be run.
if settings.DATABASE_URL.startswith("sqlite"):
    Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware setup (useful for future web dashboards)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include modules router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    """
    Heartbeat endpoint showing application status.
    """
    return {
        "status": "online",
        "app_name": settings.PROJECT_NAME,
        "api_version": "1.0.0",
        "docs_url": "/docs"
    }
