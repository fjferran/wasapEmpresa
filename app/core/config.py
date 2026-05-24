from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_ignore_empty=True, extra="ignore"
    )
    
    PROJECT_NAME: str = "SaaS Fichajes WhatsApp"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    DATABASE_URL: str = "sqlite:///./sql_app.db"
    
    # JWT Auth Settings
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # Twilio Sandbox Settings
    TWILIO_ACCOUNT_SID: str = "ACmockaccount"
    TWILIO_AUTH_TOKEN: str = "mocktoken"
    TWILIO_WHATSAPP_NUMBER: str = "whatsapp:+14155238886"

settings = Settings()
