from models import db
from config import config


def init_db(app):
    """Initialize database with Flask app"""
    # Apply SQLAlchemy engine options if available
    if hasattr(app.config, 'SQLALCHEMY_ENGINE_OPTIONS'):
        app.config.setdefault('SQLALCHEMY_ENGINE_OPTIONS', config['default'].SQLALCHEMY_ENGINE_OPTIONS)
    
    db.init_app(app)
    with app.app_context():
        db.create_all()
        print("Database initialized successfully")


def reset_db(app):
    """Reset database - DANGER: Drops all tables"""
    with app.app_context():
        db.drop_all()
        db.create_all()
        print("Database reset successfully")
