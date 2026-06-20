from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import config
from models import db, User, Professor, Department, Salle, Exam, Assignment, Incident, AssignmentHistory
from routes import register_blueprints
from utils.database import init_db
import os

def create_app(config_name='default'):
    """Create and configure the Flask application"""
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Enable CORS
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    # Initialize database
    init_db(app)
    
    # Register blueprints
    register_blueprints(app)
    
    # JWT callbacks
    @jwt.user_identity_loader
    def user_identity_lookup(user_id):
        return user_id
    
    @jwt.additional_claims_loader
    def add_claims_to_jwt(identity):
        user = User.query.get(identity)
        if user:
            return {
                'role': user.role,
                'username': user.username,
                'email': user.email,
                'full_name': user.full_name
            }
        return {}
    
    # Create default users function
    def create_default_users():
        with app.app_context():
            # Check and create admin user
            if not User.query.filter_by(username='admin').first():
                admin = User(
                    username='admin',
                    email='admin@fpk.edu',
                    first_name='Admin',
                    last_name='System',
                    role='admin',
                    institutional_grade='ADMIN'
                )
                admin.set_password('admin')
                db.session.add(admin)
                db.session.commit()
                print("Default admin user created: admin/admin")
                
                # Create admin department
                admin_dept = Department(
                    name='Scolarite',
                    code='ADMIN',
                    head_id=admin.id,
                    staff_count=1
                )
                db.session.add(admin_dept)
                db.session.commit()
            
            # Check and create professor user
            if not User.query.filter_by(username='prof').first():
                prof_user = User(
                    username='prof',
                    email='prof@fpk.edu',
                    first_name='Sarah',
                    last_name='Connor',
                    role='professor',
                    institutional_grade='PR'
                )
                prof_user.set_password('prof')
                db.session.add(prof_user)
                db.session.commit()
                print("Default professor user created: prof/prof")
                
                # Create Computer Science department if not exists
                cs_dept = Department.query.filter_by(name='Computer Science').first()
                if not cs_dept:
                    cs_dept = Department(
                        name='Computer Science',
                        code='CS',
                        staff_count=0
                    )
                    db.session.add(cs_dept)
                    db.session.commit()
                
                # Create professor profile
                professor = Professor(
                    user_id=prof_user.id,
                    department_id=cs_dept.id,
                    academic_title='DR',
                    max_guards=4,
                    completed_guards=0
                )
                db.session.add(professor)
                db.session.commit()
                
                # Update department staff count
                cs_dept.staff_count += 1
                db.session.commit()
                
                # Create some default salles
                salles = [
                    {'name': 'Amphi A', 'code': 'A', 'type': 'AMPHI', 'capacity': 200, 'building': 'Main', 'floor': '1'},
                    {'name': 'Amphi B', 'code': 'B', 'type': 'AMPHI', 'capacity': 150, 'building': 'Main', 'floor': '1'},
                    {'name': 'Salle B12', 'code': 'B12', 'type': 'SALLE', 'capacity': 50, 'building': 'Building B', 'floor': '2'},
                    {'name': 'Lab 201', 'code': 'L201', 'type': 'LAB', 'capacity': 30, 'building': 'Science', 'floor': '2'},
                    {'name': 'Lab 104', 'code': 'L104', 'type': 'LAB', 'capacity': 25, 'building': 'Science', 'floor': '1'},
                    {'name': 'Amphi C', 'code': 'C', 'type': 'AMPHI', 'capacity': 100, 'building': 'Main', 'floor': '2'},
                ]
                
                for salle_data in salles:
                    if not Salle.query.filter_by(code=salle_data['code']).first():
                        salle = Salle(**salle_data)
                        db.session.add(salle)
                db.session.commit()
                print("Default salles created")
                
                # Create some default departments
                departments = [
                    {'name': 'Mathematics', 'code': 'MATH', 'staff_count': 0},
                    {'name': 'Physics', 'code': 'PHYSICS', 'staff_count': 0},
                    {'name': 'Philosophy', 'code': 'PHIL', 'staff_count': 0},
                ]
                
                for dept_data in departments:
                    if not Department.query.filter_by(name=dept_data['name']).first():
                        dept = Department(**dept_data)
                        db.session.add(dept)
                db.session.commit()
                print("Default departments created")
    
    return app


# Create the app
app = create_app()


if __name__ == '__main__':
    # Run the application
    port = int(os.getenv('PORT', 5006))
    app.run(host='0.0.0.0', port=port, debug=True)
