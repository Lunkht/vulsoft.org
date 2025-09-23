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
    
    # OpenAI API Key
    OPENAI_API_KEY: str = "votre_clé_api_openai_ici"

    # Stripe Keys
    STRIPE_PUBLIC_KEY: str = "pk_test_VOTRE_CLE_PUBLIQUE"
    STRIPE_SECRET_KEY: str = "sk_test_VOTRE_CLE_SECRETE"

    # OAuth2 Google
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""

    # OAuth2 GitHub
    GITHUB_CLIENT_ID: str = ""
    GITHUB_CLIENT_SECRET: str = ""
    
    # 2FA
    TWO_FACTOR_ISSUER_NAME: str = "Vulsoft"

    class Config:
        env_file = ".env"
        env_file_encoding = 'utf-8'

settings = Settings()