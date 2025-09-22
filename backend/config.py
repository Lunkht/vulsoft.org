from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # App settings
    PROJECT_NAME: str = "Vulsoft API"
    API_V1_STR: str = "/api"
    
    # Database
    DATABASE_URL: str = "sqlite:///./vulsoft.db"
    
    # Security
    SECRET_KEY: str = "a_very_secret_key_that_should_be_in_env"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Email settings
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    MAIL_STARTTLS: bool = True
    MAIL_SSL_TLS: bool = False
    
    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()