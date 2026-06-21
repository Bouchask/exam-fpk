import os
from dotenv import load_dotenv

# On Vercel, environment variables are already injected, so we only load .env in development
if os.getenv('VERCEL_ENV') is None:
    load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    
    # Handle both postgres:// and postgresql:// for Aiven.io compatibility
    db_url = os.getenv('DATABASE_URL', 'postgresql://ggffghg@localhost:5432/fpk_exam_guard')
    if db_url.startswith('postgres://'):
        db_url = db_url.replace('postgres://', 'postgresql://', 1)
    SQLALCHEMY_DATABASE_URI = db_url
    
    # SQLAlchemy engine options for Aiven.io (SSL mode)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'connect_args': {
            'connect_timeout': 10,
            'sslmode': 'require'
        },
        'pool_size': 5,
        'max_overflow': 10,
        'pool_timeout': 30
    }
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    
class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
