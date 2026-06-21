#!/usr/bin/env python3
"""
Final Database Initialization Script for Aiven.io
This script ensures compatibility with Aiven.io PostgreSQL and SQLAlchemy
"""
import os
import sys
import psycopg2
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

# Aiven.io Database Configuration
# Note: Use postgresql:// for SQLAlchemy, postgres:// for psycopg2
AIVEN_DB_URL = os.getenv('DATABASE_URL', 
    'postgres://[REDACTED]@exam-fpk-yahyabouaachak-c539.b.aivencloud.com:21532/defaultdb?sslmode=require'
)

def get_psycopg2_url(db_url):
    """Convert SQLAlchemy URL to psycopg2 URL if needed"""
    if db_url.startswith('postgresql://'):
        return db_url.replace('postgresql://', 'postgres://', 1)
    return db_url

def get_sqlalchemy_url(db_url):
    """Convert to SQLAlchemy URL"""
    if db_url.startswith('postgres://'):
        return db_url.replace('postgres://', 'postgresql://', 1)
    return db_url

def test_connection():
    """Test connection to Aiven.io PostgreSQL"""
    print("Testing connection to Aiven.io PostgreSQL...")
    
    psycopg2_url = get_psycopg2_url(AIVEN_DB_URL)
    
    try:
        conn = psycopg2.connect(
            dsn=psycopg2_url,
            sslmode='require'
        )
        conn.close()
        print("✓ Connection to Aiven.io PostgreSQL successful!")
        return True
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return False

def create_database():
    """Create the database and tables in Aiven.io"""
    print("\nInitializing database...")
    
    if not test_connection():
        print("Cannot continue without database connection")
        return False
    
    sqlalchemy_url = get_sqlalchemy_url(AIVEN_DB_URL)
    
    try:
        # Create engine with SSL mode required for Aiven.io
        engine = create_engine(
            sqlalchemy_url,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            connect_args={
                'connect_timeout': 10,
                'sslmode': 'require'
            }
        )
        
        print("✓ Connected to Aiven.io PostgreSQL with SQLAlchemy!")
        
        # Check if tables already exist
        with engine.connect() as connection:
            try:
                user_count = connection.execute(text("SELECT COUNT(*) FROM users")).scalar()
                print(f"\nℹ Found {user_count} users in database")
                
                if user_count > 0:
                    print("ℹ Database already initialized with data")
                    return True
            except Exception as e:
                print(f"ℹ No existing tables found: {e}")
        
        # Create all tables
        print("\nCreating database tables...")
        with engine.connect() as connection:
            statements = [
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    username VARCHAR(80) UNIQUE NOT NULL,
                    email VARCHAR(120) UNIQUE NOT NULL,
                    password_hash VARCHAR(255) NOT NULL,
                    first_name VARCHAR(80) NOT NULL,
                    last_name VARCHAR(80) NOT NULL,
                    full_name VARCHAR(160) NOT NULL,
                    role VARCHAR(20) NOT NULL DEFAULT 'professor',
                    institutional_grade VARCHAR(20),
                    department_id INTEGER,
                    digital_signature TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS departments (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    code VARCHAR(20) UNIQUE,
                    head_id INTEGER,
                    head_name VARCHAR(100),
                    staff_count INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS professors (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER UNIQUE,
                    name VARCHAR(100),
                    department_id INTEGER,
                    department VARCHAR(100),
                    max_guards INTEGER NOT NULL DEFAULT 4,
                    completed_guards INTEGER NOT NULL DEFAULT 0,
                    quota_status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
                    quota_percentage NUMERIC NOT NULL DEFAULT 0,
                    is_quota_full BOOLEAN NOT NULL DEFAULT FALSE,
                    academic_title VARCHAR(50),
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS filieres (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL UNIQUE,
                    code VARCHAR(20) UNIQUE,
                    department_id INTEGER,
                    department_name VARCHAR(100),
                    max_modules INTEGER NOT NULL DEFAULT 10,
                    description TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    module_count INTEGER NOT NULL DEFAULT 0,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS professor_filier (
                    id SERIAL PRIMARY KEY,
                    professor_id INTEGER NOT NULL,
                    filier_id INTEGER NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(professor_id, filier_id),
                    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
                    FOREIGN KEY(filier_id) REFERENCES filieres(id) ON DELETE CASCADE
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS salles (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    code VARCHAR(20) UNIQUE NOT NULL,
                    capacity INTEGER,
                    type VARCHAR(50),
                    floor VARCHAR(20),
                    building VARCHAR(100),
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS modules (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    code VARCHAR(20) UNIQUE,
                    filier_id INTEGER,
                    filier_name VARCHAR(100),
                    professor_id INTEGER,
                    professor_name VARCHAR(100),
                    hours INTEGER NOT NULL DEFAULT 45,
                    description TEXT,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(filier_id) REFERENCES filieres(id) ON DELETE CASCADE,
                    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE SET NULL
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS exams (
                    id SERIAL PRIMARY KEY,
                    module_id INTEGER,
                    module VARCHAR(100),
                    module_code VARCHAR(20),
                    exam_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
                    filier_id INTEGER,
                    filier VARCHAR(100),
                    date DATE NOT NULL,
                    time VARCHAR(50),
                    start_time TIME,
                    end_time TIME,
                    duration_minutes INTEGER,
                    salle_id INTEGER,
                    salle VARCHAR(100),
                    department_id INTEGER,
                    department VARCHAR(100),
                    academic_year VARCHAR(50),
                    semester VARCHAR(50),
                    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
                    notes TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE SET NULL,
                    FOREIGN KEY(salle_id) REFERENCES salles(id) ON DELETE SET NULL,
                    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL,
                    FOREIGN KEY(filier_id) REFERENCES filieres(id) ON DELETE SET NULL
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS assignments (
                    id SERIAL PRIMARY KEY,
                    professor_id INTEGER NOT NULL,
                    professor VARCHAR(100),
                    professor_department VARCHAR(100),
                    exam_id INTEGER NOT NULL,
                    exam_module VARCHAR(100),
                    exam_date VARCHAR(50),
                    exam_time VARCHAR(50),
                    exam_room VARCHAR(100),
                    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
                    assignment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    notes TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
                    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS incidents (
                    id SERIAL PRIMARY KEY,
                    professor_id INTEGER,
                    professor VARCHAR(100),
                    assignment_id INTEGER,
                    incident_type VARCHAR(50) NOT NULL,
                    description TEXT NOT NULL,
                    status VARCHAR(20) NOT NULL DEFAULT 'UNDER REVIEW',
                    reported_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    resolved_date TIMESTAMP,
                    resolved_by INTEGER,
                    resolution_notes TEXT,
                    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
                    related_exam_id INTEGER,
                    related_exam VARCHAR(100),
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
                    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
                    FOREIGN KEY(related_exam_id) REFERENCES exams(id) ON DELETE SET NULL
                );
                """,
                """
                CREATE TABLE IF NOT EXISTS assignment_history (
                    id SERIAL PRIMARY KEY,
                    assignment_id INTEGER NOT NULL,
                    professor_id INTEGER NOT NULL,
                    professor VARCHAR(100),
                    exam_id INTEGER NOT NULL,
                    exam_module VARCHAR(100),
                    exam_date VARCHAR(50),
                    exam_type VARCHAR(20),
                    completion_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(20) NOT NULL,
                    report_path TEXT,
                    notes TEXT,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
                    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
                    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
                );
                """
            ]
            
            for statement in statements:
                connection.execute(text(statement))
        
        print("✓ Database tables created successfully!")
        
        # Insert default data if database is empty
        with engine.connect() as connection:
            user_count = connection.execute(text("SELECT COUNT(*) FROM users")).scalar()
            
            if user_count == 0:
                print("\nInserting default data...")
                insert_default_data(connection)
            else:
                print("\nℹ Database already contains data, skipping default data insertion")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error creating database: {e}")
        import traceback
        traceback.print_exc()
        return False

def insert_default_data(connection):
    """Insert default users, departments, etc."""
    try:
        # Insert departments
        depts = [
            ("Scolarite", "ADMIN", None, 1),
            ("Computer Science", "CS", None, 0),
            ("Mathematics", "MATH", None, 0),
            ("Physics", "PHYSICS", None, 0),
            ("Philosophy", "PHIL", None, 0)
        ]
        
        for name, code, head_id, staff_count in depts:
            connection.execute(text(
                "INSERT INTO departments (name, code, head_id, staff_count, created_at, updated_at) "
                "VALUES (:name, :code, :head_id, :staff_count, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {'name': name, 'code': code, 'head_id': head_id, 'staff_count': staff_count}
            ))
        
        # Get department IDs
        cs_dept_id = connection.execute(text("SELECT id FROM departments WHERE code = 'CS'")).scalar()
        admin_dept_id = connection.execute(text("SELECT id FROM departments WHERE code = 'ADMIN'")).scalar()
        
        # Insert users
        users = [
            ('admin', 'admin@fpk.edu', generate_password_hash('admin'), 'Admin', 'System', 'admin', 'ADMIN', admin_dept_id),
            ('prof', 'prof@fpk.edu', generate_password_hash('prof'), 'Sarah', 'Connor', 'professor', 'PR', cs_dept_id)
        ]
        
        for username, email, password_hash, first_name, last_name, role, grade, dept_id in users:
            full_name = f"{first_name} {last_name}"
            connection.execute(text(
                "INSERT INTO users (username, email, password_hash, first_name, last_name, full_name, role, institutional_grade, department_id, is_active, created_at, updated_at) "
                "VALUES (:username, :email, :password_hash, :first_name, :last_name, :full_name, :role, :grade, :dept_id, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {
                    'username': username, 'email': email, 'password_hash': password_hash,
                    'first_name': first_name, 'last_name': last_name, 'full_name': full_name,
                    'role': role, 'grade': grade, 'dept_id': dept_id
                }
            ))
        
        # Get user IDs
        admin_id = connection.execute(text("SELECT id FROM users WHERE username = 'admin'")).scalar()
        prof_id = connection.execute(text("SELECT id FROM users WHERE username = 'prof'")).scalar()
        
        # Update department heads
        if admin_id:
            connection.execute(text(
                "UPDATE departments SET head_id = :head_id, head_name = (SELECT full_name FROM users WHERE id = :head_id) WHERE code = 'ADMIN'",
                {'head_id': admin_id}
            ))
        
        # Insert professors
        if prof_id and cs_dept_id:
            connection.execute(text(
                "INSERT INTO professors (user_id, name, department_id, department, max_guards, completed_guards, academic_title, created_at, updated_at) "
                "VALUES (:user_id, (SELECT full_name FROM users WHERE id = :user_id), :dept_id, (SELECT name FROM departments WHERE id = :dept_id), 4, 0, 'DR', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {'user_id': prof_id, 'dept_id': cs_dept_id}
            ))
        
        # Insert filieres
        filieres = [
            ('Computer Science', 'CS', cs_dept_id),
            ('Information Systems', 'IS', cs_dept_id),
            ('Software Engineering', 'SE', cs_dept_id)
        ]
        
        for name, code, dept_id in filieres:
            connection.execute(text(
                "INSERT INTO filieres (name, code, department_id, department_name, max_modules, is_active, module_count, created_at, updated_at) "
                "VALUES (:name, :code, :dept_id, (SELECT name FROM departments WHERE id = :dept_id), 10, TRUE, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {'name': name, 'code': code, 'dept_id': dept_id}
            ))
        
        # Get filier IDs
        cs_filier_id = connection.execute(text("SELECT id FROM filieres WHERE code = 'CS'")).scalar()
        
        # Insert modules
        modules = [
            ('Programming 1', 'PROG1', cs_filier_id, 'CS', prof_id, 'PR', 45),
            ('Algorithms', 'ALGO', cs_filier_id, 'CS', prof_id, 'DR', 60),
            ('Database Systems', 'DB', cs_filier_id, 'CS', None, None, 75)
        ]
        
        for name, code, filier_id, filier_name, prof_id_val, academic_title, hours in modules:
            connection.execute(text(
                "INSERT INTO modules (name, code, filier_id, filier_name, professor_id, professor_name, hours, is_active, created_at, updated_at) "
                "VALUES (:name, :code, :filier_id, :filier_name, :prof_id, :academic_title, :hours, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {
                    'name': name, 'code': code, 'filier_id': filier_id, 'filier_name': filier_name,
                    'prof_id': prof_id_val, 'academic_title': academic_title, 'hours': hours
                }
            ))
        
        # Get module IDs
        prog1_id = connection.execute(text("SELECT id FROM modules WHERE code = 'PROG1'")).scalar()
        algo_id = connection.execute(text("SELECT id FROM modules WHERE code = 'ALGO'")).scalar()
        db_id = connection.execute(text("SELECT id FROM modules WHERE code = 'DB'")).scalar()
        
        # Get salle IDs (insert if not exist)
        salles = ['Amphi A', 'Amphi B', 'Salle B12', 'Lab 201', 'Lab 104', 'Amphi C']
        salle_codes = ['A', 'B', 'B12', 'L201', 'L104', 'C']
        salle_types = ['AMPHI', 'AMPHI', 'SALLE', 'LAB', 'LAB', 'AMPHI']
        salle_data = list(zip(salles, salle_codes, salle_types))
        
        for name, code, type_val in salle_data:
            connection.execute(text(
                "INSERT INTO salles (name, code, type, capacity, floor, building, is_active, created_at, updated_at) "
                "VALUES (:name, :code, :type, NULL, NULL, NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {'name': name, 'code': code, 'type': type_val}
            ))
        
        # Get salle IDs
        amphi_a_id = connection.execute(text("SELECT id FROM salles WHERE code = 'A'")).scalar()
        amphi_b_id = connection.execute(text("SELECT id FROM salles WHERE code = 'B'")).scalar()
        salle_b12_id = connection.execute(text("SELECT id FROM salles WHERE code = 'B12'")).scalar()
        
        # Insert exams
        import datetime
        exams = [
            (prog1_id, 'Programming 1', 'PROG1', 'NORMAL', cs_filier_id, 'CS', datetime.date(2026, 6, 25), '09:00', '12:00', 180, amphi_a_id, 'Amphi A', cs_dept_id, '2025-2026', 'S2'),
            (algo_id, 'Algorithms', 'ALGO', 'NORMAL', cs_filier_id, 'CS', datetime.date(2026, 6, 26), '14:00', '17:00', 180, amphi_b_id, 'Amphi B', cs_dept_id, '2025-2026', 'S2'),
            (db_id, 'Database Systems', 'DB', 'NORMAL', cs_filier_id, 'CS', datetime.date(2026, 6, 27), '10:00', '13:00', 180, salle_b12_id, 'Salle B12', cs_dept_id, '2025-2026', 'S2')
        ]
        
        for module_id, module, module_code, exam_type, filier_id, filier, date, start_time, end_time, duration, salle_id, salle, dept_id, year, semester in exams:
            connection.execute(text(
                "INSERT INTO exams (module_id, module, module_code, exam_type, filier_id, filier, date, start_time, end_time, duration_minutes, salle_id, salle, department_id, department, academic_year, semester, status, created_at, updated_at) "
                "VALUES (:module_id, :module, :module_code, :exam_type, :filier_id, :filier, :date, :start_time, :end_time, :duration, :salle_id, :salle, :dept_id, (SELECT name FROM departments WHERE id = :dept_id), :year, :semester, 'SCHEDULED', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) "
                "ON CONFLICT DO NOTHING",
                {
                    'module_id': module_id, 'module': module, 'module_code': module_code,
                    'exam_type': exam_type, 'filier_id': filier_id, 'filier': filier,
                    'date': date, 'start_time': start_time, 'end_time': end_time,
                    'duration': duration, 'salle_id': salle_id, 'salle': salle,
                    'dept_id': dept_id, 'year': year, 'semester': semester
                }
            ))
        
        print("✓ Default data inserted successfully!")
        
    except Exception as e:
        print(f"❌ Error inserting default data: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    print("=" * 60)
    print("Aiven.io Database Initialization Script")
    print("=" * 60)
    
    success = create_database()
    
    if success:
        print("\n" + "=" * 60)
        print("Database initialization complete!")
        print("Default credentials:")
        print("  Admin: admin/admin")
        print("  Professor: prof/prof")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("Database initialization failed!")
        print("=" * 60)
        sys.exit(1)
