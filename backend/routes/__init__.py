# Routes package
from .auth import auth_bp
from .professors import professors_bp
from .exams import exams_bp
from .departments import departments_bp
from .salles import salles_bp
from .assignments import assignments_bp
from .incidents import incidents_bp
from .dashboard import dashboard_bp
from .filieres import filieres_bp
from .modules import modules_bp

# Register all blueprints
def register_blueprints(app):
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(professors_bp, url_prefix='/api/professors')
    app.register_blueprint(exams_bp, url_prefix='/api/exams')
    app.register_blueprint(departments_bp, url_prefix='/api/departments')
    app.register_blueprint(salles_bp, url_prefix='/api/salles')
    app.register_blueprint(assignments_bp, url_prefix='/api/assignments')
    app.register_blueprint(incidents_bp, url_prefix='/api/incidents')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(filieres_bp, url_prefix='/api/filieres')
    app.register_blueprint(modules_bp, url_prefix='/api/modules')
