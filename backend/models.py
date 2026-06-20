from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()


class User(db.Model):
    """User model for authentication and authorization"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(50), nullable=False)
    last_name = db.Column(db.String(50), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    institutional_grade = db.Column(db.String(50))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    digital_signature = db.Column(db.String(255))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    professor_profile = db.relationship('Professor', back_populates='user', uselist=False)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'role': self.role,
            'institutional_grade': self.institutional_grade,
            'department_id': self.department_id,
            'digital_signature': self.digital_signature,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Department(db.Model):
    """Department model"""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    head_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    staff_count = db.Column(db.Integer, default=0)
    code = db.Column(db.String(10))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    professors = db.relationship('Professor', back_populates='department', cascade='all, delete-orphan')
    exams = db.relationship('Exam', back_populates='department', cascade='all, delete-orphan')
    filieres = db.relationship('Filier', back_populates='department', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'head_id': self.head_id,
            'head_name': User.query.get(self.head_id).full_name if self.head_id else None,
            'staff_count': self.staff_count,
            'code': self.code,
            'created_at': self.created_at.isoformat()
        }


class Filier(db.Model):
    """Field of Study/Filier model - e.g., Computer Science, Mathematics"""
    __tablename__ = 'filieres'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    max_modules = db.Column(db.Integer, default=7)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    department = db.relationship('Department', back_populates='filieres')
    modules = db.relationship('Module', back_populates='filier', cascade='all, delete-orphan')
    professors = db.relationship('Professor', secondary='professor_filier', back_populates='filieres')
    exams = db.relationship('Exam', back_populates='filier', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'department_id': self.department_id,
            'department_name': self.department.name if self.department else None,
            'max_modules': self.max_modules,
            'description': self.description,
            'is_active': self.is_active,
            'module_count': len(self.modules) if self.modules else 0,
            'created_at': self.created_at.isoformat()
        }


class Module(db.Model):
    """Module/Course model - e.g., Programming, Algorithms"""
    __tablename__ = 'modules'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True)
    filier_id = db.Column(db.Integer, db.ForeignKey('filieres.id'))
    credits = db.Column(db.Integer, default=3)
    hours = db.Column(db.Integer, default=45)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    filier = db.relationship('Filier', back_populates='modules')
    exams = db.relationship('Exam', back_populates='module_obj', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'filier_id': self.filier_id,
            'filier_name': self.filier.name if self.filier else None,
            'credits': self.credits,
            'hours': self.hours,
            'description': self.description,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class ProfessorFilier(db.Model):
    """Association table for many-to-many relationship between Professor and Filier"""
    __tablename__ = 'professor_filier'
    
    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('professors.id'))
    filier_id = db.Column(db.Integer, db.ForeignKey('filieres.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Professor(db.Model):
    """Professor model with quota tracking"""
    __tablename__ = 'professors'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    max_guards = db.Column(db.Integer, default=4)
    completed_guards = db.Column(db.Integer, default=0)
    academic_title = db.Column(db.String(50))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = db.relationship('User', back_populates='professor_profile')
    department = db.relationship('Department', back_populates='professors')
    assignments = db.relationship('Assignment', back_populates='professor', cascade='all, delete-orphan')
    incidents = db.relationship('Incident', back_populates='professor', cascade='all, delete-orphan')
    history_records = db.relationship('AssignmentHistory', back_populates='professor', cascade='all, delete-orphan')
    filieres = db.relationship('Filier', secondary='professor_filier', back_populates='professors')
    
    @property
    def quota_status(self):
        return f"{self.completed_guards}/{self.max_guards}"
    
    @property
    def quota_percentage(self):
        return (self.completed_guards / self.max_guards) * 100 if self.max_guards > 0 else 0
    
    @property
    def is_quota_full(self):
        return self.completed_guards >= self.max_guards
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'name': self.user.full_name if self.user else None,
            'department_id': self.department_id,
            'department': Department.query.get(self.department_id).name if self.department_id else None,
            'max_guards': self.max_guards,
            'completed_guards': self.completed_guards,
            'quota_status': self.quota_status,
            'quota_percentage': self.quota_percentage,
            'academic_title': self.academic_title,
            'is_quota_full': self.is_quota_full,
            'created_at': self.created_at.isoformat()
        }


class Salle(db.Model):
    """Room/Salle model"""
    __tablename__ = 'salles'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True)
    capacity = db.Column(db.Integer)
    type = db.Column(db.String(50))
    floor = db.Column(db.String(20))
    building = db.Column(db.String(50))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    exams = db.relationship('Exam', backref='salle', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'capacity': self.capacity,
            'type': self.type,
            'floor': self.floor,
            'building': self.building,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat()
        }


class Exam(db.Model):
    """Exam model"""
    __tablename__ = 'exams'
    
    id = db.Column(db.Integer, primary_key=True)
    module_id = db.Column(db.Integer, db.ForeignKey('modules.id'))
    module = db.Column(db.String(100), nullable=False)
    module_code = db.Column(db.String(20))
    exam_type = db.Column(db.String(20), nullable=False, default='NORMAL')  # NORMAL or RATTRAPAGE
    filier_id = db.Column(db.Integer, db.ForeignKey('filieres.id'))
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    duration_minutes = db.Column(db.Integer)
    salle_id = db.Column(db.Integer, db.ForeignKey('salles.id'))
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    academic_year = db.Column(db.String(20), default='2025-2026')
    semester = db.Column(db.String(10), default='S2')
    status = db.Column(db.String(20), default='SCHEDULED')
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    module_obj = db.relationship('Module', back_populates='exams')
    filier = db.relationship('Filier', back_populates='exams')
    
    assignments = db.relationship('Assignment', back_populates='exam', cascade='all, delete-orphan')
    history_records = db.relationship('AssignmentHistory', back_populates='exam', cascade='all, delete-orphan')
    
    @property
    def time_range(self):
        return f"{self.start_time.strftime('%H:%M')} - {self.end_time.strftime('%H:%M')}"
    
    @property
    def full_date(self):
        return self.date.strftime('%Y-%m-%d')
    
    def to_dict(self):
        return {
            'id': self.id,
            'module_id': self.module_id,
            'module': self.module,
            'module_code': self.module_code,
            'module_obj': Module.query.get(self.module_id).to_dict() if self.module_id else None,
            'exam_type': self.exam_type,
            'filier_id': self.filier_id,
            'filier': Filier.query.get(self.filier_id).name if self.filier_id else None,
            'date': self.full_date,
            'time': self.time_range,
            'start_time': self.start_time.strftime('%H:%M'),
            'end_time': self.end_time.strftime('%H:%M'),
            'duration_minutes': self.duration_minutes,
            'salle_id': self.salle_id,
            'salle': Salle.query.get(self.salle_id).name if self.salle_id else None,
            'department_id': self.department_id,
            'department': Department.query.get(self.department_id).name if self.department_id else None,
            'academic_year': self.academic_year,
            'semester': self.semester,
            'status': self.status,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


class Assignment(db.Model):
    """Assignment of professors to exams"""
    __tablename__ = 'assignments'
    
    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('professors.id'), nullable=False)
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'), nullable=False)
    status = db.Column(db.String(20), default='CONFIRMED')
    assignment_date = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.UniqueConstraint('professor_id', 'exam_id', name='unique_assignment'),
    )
    
    incidents = db.relationship('Incident', back_populates='assignment', cascade='all, delete-orphan')
    history = db.relationship('AssignmentHistory', back_populates='assignment', cascade='all, delete-orphan')
    
    def to_dict(self):
        prof = Professor.query.get(self.professor_id)
        exam = Exam.query.get(self.exam_id)
        return {
            'id': self.id,
            'professor_id': self.professor_id,
            'professor': prof.user.full_name if prof and prof.user else None,
            'professor_department': prof.department if prof else None,
            'exam_id': self.exam_id,
            'exam_module': exam.module if exam else None,
            'exam_date': exam.date.strftime('%Y-%m-%d') if exam else None,
            'exam_time': exam.time_range if exam else None,
            'exam_room': exam.salle.name if exam and exam.salle_id and Salle.query.get(exam.salle_id) else None,
            'status': self.status,
            'assignment_date': self.assignment_date.isoformat(),
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


class Incident(db.Model):
    """Incident/Exception log model"""
    __tablename__ = 'incidents'
    
    id = db.Column(db.Integer, primary_key=True)
    professor_id = db.Column(db.Integer, db.ForeignKey('professors.id'))
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'))
    incident_type = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='UNDER REVIEW')
    reported_date = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_date = db.Column(db.DateTime)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolution_notes = db.Column(db.Text)
    severity = db.Column(db.String(20), default='MEDIUM')
    related_exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        prof = Professor.query.get(self.professor_id)
        assignment = Assignment.query.get(self.assignment_id) if self.assignment_id else None
        related_exam = Exam.query.get(self.related_exam_id) if self.related_exam_id else None
        resolver = User.query.get(self.resolved_by) if self.resolved_by else None
        return {
            'id': self.id,
            'professor_id': self.professor_id,
            'professor': prof.user.full_name if prof and prof.user else None,
            'assignment_id': self.assignment_id,
            'incident_type': self.incident_type,
            'description': self.description,
            'status': self.status,
            'reported_date': self.reported_date.isoformat(),
            'resolved_date': self.resolved_date.isoformat() if self.resolved_date else None,
            'resolved_by': self.resolved_by,
            'resolution_notes': self.resolution_notes,
            'severity': self.severity,
            'related_exam_id': self.related_exam_id,
            'related_exam': related_exam.module if related_exam else None,
            'created_at': self.created_at.isoformat()
        }


class AssignmentHistory(db.Model):
    """Historical record of completed assignments"""
    __tablename__ = 'assignment_history'
    
    id = db.Column(db.Integer, primary_key=True)
    assignment_id = db.Column(db.Integer, db.ForeignKey('assignments.id'))
    professor_id = db.Column(db.Integer, db.ForeignKey('professors.id'))
    exam_id = db.Column(db.Integer, db.ForeignKey('exams.id'))
    completion_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='COMPLETED')
    report_path = db.Column(db.String(255))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        professor = Professor.query.get(self.professor_id)
        exam = Exam.query.get(self.exam_id)
        return {
            'id': self.id,
            'assignment_id': self.assignment_id,
            'professor_id': self.professor_id,
            'professor': professor.user.full_name if professor and professor.user else None,
            'exam_id': self.exam_id,
            'exam_module': exam.module if exam else None,
            'exam_date': exam.date.strftime('%Y-%m-%d') if exam else None,
            'exam_type': exam.exam_type if exam else None,
            'completion_date': self.completion_date.isoformat(),
            'status': self.status,
            'report_path': self.report_path,
            'notes': self.notes,
            'created_at': self.created_at.isoformat()
        }


# Initialize database


def create_default_users(app):
    """Create default users if not exists"""
    with app.app_context():
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
        
        if not User.query.filter_by(username='prof').first():
            prof = User(
                username='prof',
                email='prof@fpk.edu',
                first_name='Sarah',
                last_name='Connor',
                role='professor',
                institutional_grade='PR'
            )
            prof.set_password('prof')
            db.session.add(prof)
            db.session.commit()
            print("Default professor user created: prof/prof")
