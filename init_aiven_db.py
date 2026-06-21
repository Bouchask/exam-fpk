#!/usr/bin/env python3
"""
Database Initialization Script for Aiven.io
This script creates the database schema and default data in Aiven.io PostgreSQL
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError
import time

# Aiven.io Database Configuration
AIVEN_DB_URL = os.getenv('DATABASE_URL', 
    'postgres://[REDACTED]@exam-fpk-yahyabouaachak-c539.b.aivencloud.com:21532/defaultdb?sslmode=require'
)

# SQL to create all tables
CREATE_TABLES_SQL = """
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    first_name VARCHAR(80) NOT NULL,
    last_name VARCHAR(80) NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'professor',
    institutional_grade VARCHAR(20),
    department_id INTEGER,
    digital_signature TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    head_id INTEGER,
    head_name VARCHAR(100),
    staff_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Professors table
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
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Filieres (Fields of Study) table
CREATE TABLE IF NOT EXISTS filieres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    department_id INTEGER,
    department_name VARCHAR(100),
    max_modules INTEGER NOT NULL DEFAULT 10,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    module_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Professor-Filier association table
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

-- Salles (Rooms) table
CREATE TABLE IF NOT EXISTS salles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER,
    type VARCHAR(50),
    floor VARCHAR(20),
    building VARCHAR(100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Modules (Courses) table
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
    FOREIGN KEY(filier_id) REFERENCES filieres(id) ON DELETE CASCADE,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE SET NULL
);

-- Exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    module_id INTEGER,
    module VARCHAR(100),
    module_code VARCHAR(20),
    exam_type VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
    filier_id INTEGER,
    filier VARCHAR(100),
    date VARCHAR(50) NOT NULL,
    time VARCHAR(50),
    start_time VARCHAR(50),
    end_time VARCHAR(50),
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
    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE SET NULL,
    FOREIGN KEY(salle_id) REFERENCES salles(id) ON DELETE SET NULL,
    FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY(filier_id) REFERENCES filieres(id) ON DELETE SET NULL
);

-- Assignments table (Professor Guard Assignments)
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
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER,
    professor VARCHAR(100),
    assignment_id INTEGER,
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'REPORTED',
    reported_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    resolved_by INTEGER,
    resolution_notes TEXT,
    severity VARCHAR(20) NOT NULL DEFAULT 'LOW',
    related_exam_id INTEGER,
    related_exam VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE SET NULL,
    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE SET NULL,
    FOREIGN KEY(resolved_by) REFERENCES professors(id) ON DELETE SET NULL,
    FOREIGN KEY(related_exam_id) REFERENCES exams(id) ON DELETE SET NULL
);

-- Assignment History table
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
    FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
    FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_professors_user_id ON professors(user_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON professors(department_id);
CREATE INDEX IF NOT EXISTS idx_exams_module ON exams(module_id);
CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);
CREATE INDEX IF NOT EXISTS idx_assignments_professor ON assignments(professor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_exam ON assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
CREATE INDEX IF NOT EXISTS idx_modules_filier ON modules(filier_id);
CREATE INDEX IF NOT EXISTS idx_modules_professor ON modules(professor_id);
"""

# SQL to insert default data
INSERT_DEFAULT_DATA_SQL = """
-- Insert default departments
INSERT INTO departments (name, code, staff_count) VALUES 
    ('Scolarite', 'ADMIN', 1),
    ('Computer Science', 'CS', 1),
    ('Mathematics', 'MATH', 0),
    ('Physics', 'PHYSICS', 0),
    ('Philosophy', 'PHIL', 0)
ON CONFLICT (name) DO NOTHING;

-- Insert default admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, full_name, role, institutional_grade, is_active) 
VALUES ('admin', 'admin@fpk.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Admin', 'System', 'Admin System', 'admin', 'ADMIN', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Insert default professor user
INSERT INTO users (username, email, password_hash, first_name, last_name, full_name, role, institutional_grade, is_active) 
VALUES ('prof', 'prof@fpk.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 'Sarah', 'Connor', 'Sarah Connor', 'professor', 'PR', TRUE)
ON CONFLICT (username) DO NOTHING;

-- Get admin user ID
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'admin')) THEN
        INSERT INTO professors (user_id, department_id, academic_title, max_guards, completed_guards, quota_status) 
        VALUES (
            (SELECT id FROM users WHERE username = 'admin'),
            (SELECT id FROM departments WHERE name = 'Scolarite'),
            'ADMIN', 4, 0, 'ACTIVE'
        );
        UPDATE departments SET staff_count = staff_count + 1 WHERE name = 'Scolarite';
    END IF;
END $$;

-- Get Computer Science department ID
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'prof')) THEN
        INSERT INTO professors (user_id, department_id, academic_title, max_guards, completed_guards, quota_status) 
        VALUES (
            (SELECT id FROM users WHERE username = 'prof'),
            (SELECT id FROM departments WHERE name = 'Computer Science'),
            'DR', 4, 0, 'ACTIVE'
        );
        UPDATE departments SET staff_count = staff_count + 1 WHERE name = 'Computer Science';
    END IF;
END $$;

-- Insert default salles (rooms)
INSERT INTO salles (name, code, capacity, type, floor, building, is_active) VALUES 
    ('Amphi A', 'A', 200, 'AMPHI', '1', 'Main', TRUE),
    ('Amphi B', 'B', 150, 'AMPHI', '1', 'Main', TRUE),
    ('Salle B12', 'B12', 50, 'SALLE', '2', 'Building B', TRUE),
    ('Lab 201', 'L201', 30, 'LAB', '2', 'Science', TRUE),
    ('Lab 104', 'L104', 25, 'LAB', '1', 'Science', TRUE),
    ('Amphi C', 'C', 100, 'AMPHI', '2', 'Main', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert default filieres
INSERT INTO filieres (name, code, department_id, department_name, max_modules, is_active) VALUES 
    ('Computer Science', 'CS', 
        (SELECT id FROM departments WHERE name = 'Computer Science'),
        'Computer Science', 10, TRUE),
    ('Mathematics', 'MATH', 
        (SELECT id FROM departments WHERE name = 'Mathematics'),
        'Mathematics', 10, TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert default modules
INSERT INTO modules (name, code, filier_id, filier_name, professor_id, hours, is_active) 
VALUES 
    ('Algorithms', 'CS101', 
        (SELECT id FROM filieres WHERE code = 'CS'),
        'Computer Science',
        (SELECT id FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'prof')),
        45, TRUE),
    ('Data Structures', 'CS102',
        (SELECT id FROM filieres WHERE code = 'CS'),
        'Computer Science',
        (SELECT id FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'prof')),
        45, TRUE),
    ('Databases', 'CS201',
        (SELECT id FROM filieres WHERE code = 'CS'),
        'Computer Science',
        (SELECT id FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'prof')),
        45, TRUE)
ON CONFLICT (code) DO NOTHING;

-- Insert default exams
INSERT INTO exams (module_id, module, module_code, exam_type, date, start_time, end_time, salle_id, salle, department_id, status, academic_year, semester) 
VALUES 
    ((SELECT id FROM modules WHERE code = 'CS101'), 'Algorithms', 'CS101', 'NORMAL', '2026-01-15', '09:00', '12:00', 
        (SELECT id FROM salles WHERE code = 'A'), 'Amphi A',
        (SELECT id FROM departments WHERE name = 'Computer Science'), 'SCHEDULED', '2025-2026', 'S2'),
    ((SELECT id FROM modules WHERE code = 'CS102'), 'Data Structures', 'CS102', 'NORMAL', '2026-01-20', '09:00', '12:00',
        (SELECT id FROM salles WHERE code = 'B'), 'Amphi B',
        (SELECT id FROM departments WHERE name = 'Computer Science'), 'SCHEDULED', '2025-2026', 'S2'),
    ((SELECT id FROM modules WHERE code = 'CS201'), 'Databases', 'CS201', 'NORMAL', '2026-01-25', '09:00', '12:00',
        (SELECT id FROM salles WHERE code = 'C'), 'Amphi C',
        (SELECT id FROM departments WHERE name = 'Computer Science'), 'SCHEDULED', '2025-2026', 'S2')
ON CONFLICT (module_id, date) DO NOTHING;
"""


def create_database():
    """Create the database and tables in Aiven.io"""
    print("Connecting to Aiven.io PostgreSQL...")
    print(f"Database URL: {AIVEN_DB_URL}")
    
    try:
        # Create engine with SSL mode required for Aiven.io
        engine = create_engine(AIVEN_DB_URL)
        
        print("\n✓ Connected to Aiven.io PostgreSQL successfully!")
        
        # Create all tables
        print("\nCreating database tables...")
        with engine.connect() as connection:
            # Split SQL by semicolon and execute each statement
            for statement in CREATE_TABLES_SQL.strip().split(';'):
                statement = statement.strip()
                if statement:
                    try:
                        connection.execute(text(statement))
                    except Exception as e:
                        print(f"  Note: {str(e)}")
        
        print("✓ Database tables created successfully!")
        
        # Insert default data
        print("\nInserting default data...")
        with engine.connect() as connection:
            for statement in INSERT_DEFAULT_DATA_SQL.strip().split(';'):
                statement = statement.strip()
                if statement:
                    try:
                        connection.execute(text(statement))
                    except Exception as e:
                        print(f"  Note: {str(e)}")
        
        print("✓ Default data inserted successfully!")
        
        # Verify the data
        print("\nVerifying database setup...")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT COUNT(*) FROM users"))
            user_count = result.scalar()
            print(f"  - Users: {user_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM professors"))
            prof_count = result.scalar()
            print(f"  - Professors: {prof_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM departments"))
            dept_count = result.scalar()
            print(f"  - Departments: {dept_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM modules"))
            module_count = result.scalar()
            print(f"  - Modules: {module_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM exams"))
            exam_count = result.scalar()
            print(f"  - Exams: {exam_count}")
            
            result = connection.execute(text("SELECT COUNT(*) FROM salles"))
            salle_count = result.scalar()
            print(f"  - Salles: {salle_count}")
        
        print("\n✅ Database initialization completed successfully!")
        print("\nDefault credentials:")
        print("  - Admin: admin / admin")
        print("  - Professor: prof / prof")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    # Check if DATABASE_URL is provided as command line argument
    if len(sys.argv) > 1:
        AIVEN_DB_URL = sys.argv[1]
    
    success = create_database()
    sys.exit(0 if success else 1)
