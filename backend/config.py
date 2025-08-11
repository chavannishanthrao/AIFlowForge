import os
from typing import Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # App settings
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/aiorch")
    
    # Redis settings
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Encryption
    ENCRYPTION_KEY: Optional[str] = os.getenv("ENCRYPTION_KEY")
    
    # LLM Providers
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    AZURE_OPENAI_KEY: Optional[str] = os.getenv("AZURE_OPENAI_KEY")
    AZURE_OPENAI_ENDPOINT: Optional[str] = os.getenv("AZURE_OPENAI_ENDPOINT")
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY")
    
    # Vector Database
    VECTOR_STORE_TYPE: str = os.getenv("VECTOR_STORE_TYPE", "memory")  # memory, pgvector, milvus
    MILVUS_HOST: str = os.getenv("MILVUS_HOST", "localhost")
    MILVUS_PORT: int = int(os.getenv("MILVUS_PORT", "19530"))
    
    # Embedding Providers
    EMBEDDING_PROVIDER: str = os.getenv("EMBEDDING_PROVIDER", "huggingface")  # openai, huggingface
    
    # Connector Settings - Salesforce
    SALESFORCE_CLIENT_ID: Optional[str] = os.getenv("SALESFORCE_CLIENT_ID")
    SALESFORCE_CLIENT_SECRET: Optional[str] = os.getenv("SALESFORCE_CLIENT_SECRET")
    
    # Connector Settings - NetSuite
    NETSUITE_ACCOUNT_ID: Optional[str] = os.getenv("NETSUITE_ACCOUNT_ID")
    NETSUITE_CONSUMER_KEY: Optional[str] = os.getenv("NETSUITE_CONSUMER_KEY")
    NETSUITE_CONSUMER_SECRET: Optional[str] = os.getenv("NETSUITE_CONSUMER_SECRET")
    
    # Connector Settings - Email
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USERNAME: Optional[str] = os.getenv("SMTP_USERNAME")
    SMTP_PASSWORD: Optional[str] = os.getenv("SMTP_PASSWORD")
    
    # Workflow Engine
    MAX_CONCURRENT_EXECUTIONS: int = int(os.getenv("MAX_CONCURRENT_EXECUTIONS", "10"))
    EXECUTION_TIMEOUT_MINUTES: int = int(os.getenv("EXECUTION_TIMEOUT_MINUTES", "30"))
    
    # File Upload
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "50"))
    ALLOWED_FILE_TYPES: list = [".pdf", ".txt", ".doc", ".docx", ".md"]
    
    # Security
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5000").split(",")
    RATE_LIMIT_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_PER_MINUTE", "100"))
    
    # Monitoring
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENABLE_METRICS: bool = os.getenv("ENABLE_METRICS", "true").lower() == "true"
    
    # Queue Settings
    QUEUE_BACKEND: str = os.getenv("QUEUE_BACKEND", "redis")  # redis, memory
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()

# Validate required settings in production
def validate_production_settings():
    """Validate that required settings are present for production"""
    if not settings.DEBUG:
        required_settings = [
            "SECRET_KEY",
            "DATABASE_URL",
            "ENCRYPTION_KEY"
        ]
        
        missing_settings = []
        for setting in required_settings:
            if not getattr(settings, setting) or getattr(settings, setting) == "your-secret-key-change-in-production":
                missing_settings.append(setting)
        
        if missing_settings:
            raise ValueError(f"Missing required production settings: {', '.join(missing_settings)}")

def get_llm_provider_settings() -> dict:
    """Get available LLM provider settings"""
    providers = {}
    
    if settings.OPENAI_API_KEY:
        providers["openai"] = {
            "api_key": settings.OPENAI_API_KEY,
            "models": ["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"]
        }
    
    if settings.AZURE_OPENAI_KEY and settings.AZURE_OPENAI_ENDPOINT:
        providers["azure"] = {
            "api_key": settings.AZURE_OPENAI_KEY,
            "endpoint": settings.AZURE_OPENAI_ENDPOINT,
            "models": ["gpt-35-turbo", "gpt-4"]
        }
    
    if settings.ANTHROPIC_API_KEY:
        providers["anthropic"] = {
            "api_key": settings.ANTHROPIC_API_KEY,
            "models": ["claude-3-sonnet", "claude-3-haiku"]
        }
    
    # Ollama is always available (local)
    providers["ollama"] = {
        "endpoint": "http://localhost:11434",
        "models": ["llama2", "codellama", "mistral"]
    }
    
    return providers

def get_vector_store_settings() -> dict:
    """Get vector store configuration"""
    config = {
        "type": settings.VECTOR_STORE_TYPE,
        "embedding_provider": settings.EMBEDDING_PROVIDER
    }
    
    if settings.VECTOR_STORE_TYPE == "pgvector":
        config["connection_string"] = settings.DATABASE_URL
    elif settings.VECTOR_STORE_TYPE == "milvus":
        config["host"] = settings.MILVUS_HOST
        config["port"] = settings.MILVUS_PORT
    
    return config

def get_connector_settings() -> dict:
    """Get connector configuration"""
    return {
        "salesforce": {
            "client_id": settings.SALESFORCE_CLIENT_ID,
            "client_secret": settings.SALESFORCE_CLIENT_SECRET,
            "enabled": bool(settings.SALESFORCE_CLIENT_ID)
        },
        "netsuite": {
            "account_id": settings.NETSUITE_ACCOUNT_ID,
            "consumer_key": settings.NETSUITE_CONSUMER_KEY,
            "consumer_secret": settings.NETSUITE_CONSUMER_SECRET,
            "enabled": bool(settings.NETSUITE_ACCOUNT_ID)
        },
        "email": {
            "smtp_server": settings.SMTP_SERVER,
            "smtp_port": settings.SMTP_PORT,
            "username": settings.SMTP_USERNAME,
            "enabled": bool(settings.SMTP_USERNAME)
        }
    }

