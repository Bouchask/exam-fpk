-- FPK Exam Guard Database Schema
-- PostgreSQL SQL Script
-- This script creates all tables for the FPK Exam Guard application

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(128) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor')),
    institutional_grade VARCHAR(50),
    department_id INTEGER,
    digital_signature VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    head_id INTEGER,
    staff_count INTEGER DEFAULT 0,
    code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key to users.department_id
ALTER TABLE users ADD CONSTRAINT fk_users_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Add foreign key to departments.head_id
ALTER TABLE departments ADD CONSTRAINT fk_departments_head 
    FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE NOT NULL,
    department_id INTEGER,
    max_guards INTEGER DEFAULT 4,
    completed_guards INTEGER DEFAULT 0,
    academic_title VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys to professors
ALTER TABLE professors ADD CONSTRAINT fk_professors_user 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE professors ADD CONSTRAINT fk_professors_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Create salles (rooms) table
CREATE TABLE IF NOT EXISTS salles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE,
    capacity INTEGER,
    type VARCHAR(50),
    floor VARCHAR(20),
    building VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    module VARCHAR(100) NOT NULL,
    module_code VARCHAR(20),
    exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('FINAL', 'MIDTERM', 'QUIZ', 'OTHER')),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER,
    salle_id INTEGER,
    department_id INTEGER,
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    semester VARCHAR(10) DEFAULT 'S2',
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys to exams
ALTER TABLE exams ADD CONSTRAINT fk_exams_salle 
    FOREIGN KEY (salle_id) REFERENCES salles(id) ON DELETE SET NULL;

ALTER TABLE exams ADD CONSTRAINT fk_exams_department 
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Create assignments table
CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER NOT NULL,
    exam_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED')),
    assignment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (professor_id, exam_id)
);

-- Add foreign keys to assignments
ALTER TABLE assignments ADD CONSTRAINT fk_assignments_professor 
    FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE CASCADE;

ALTER TABLE assignments ADD CONSTRAINT fk_assignments_exam 
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;

-- Create incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER,
    assignment_id INTEGER,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'UNDER REVIEW' CHECK (status IN ('UNDER REVIEW', 'RESOLVED', 'REJECTED')),
    reported_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP WITH TIME ZONE,
    resolved_by INTEGER,
    resolution_notes TEXT,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    related_exam_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys to incidents
ALTER TABLE incidents ADD CONSTRAINT fk_incidents_professor 
    FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL;

ALTER TABLE incidents ADD CONSTRAINT fk_incidents_assignment 
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE SET NULL;

ALTER TABLE incidents ADD CONSTRAINT fk_incidents_resolved_by 
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE incidents ADD CONSTRAINT fk_incidents_exam 
    FOREIGN KEY (related_exam_id) REFERENCES exams(id) ON DELETE SET NULL;

-- Create assignment_history table
CREATE TABLE IF NOT EXISTS assignment_history (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER,
    professor_id INTEGER,
    exam_id INTEGER,
    completion_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'COMPLETED',
    report_path VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys to assignment_history
ALTER TABLE assignment_history ADD CONSTRAINT fk_history_assignment 
    FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE;

ALTER TABLE assignment_history ADD CONSTRAINT fk_history_professor 
    FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL;

ALTER TABLE assignment_history ADD CONSTRAINT fk_history_exam 
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_professors_user_id ON professors(user_id);
CREATE INDEX IF NOT EXISTS idx_professors_department ON professors(department_id);

CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date);
CREATE INDEX IF NOT EXISTS idx_exams_salle ON exams(salle_id);
CREATE INDEX IF NOT EXISTS idx_exams_department ON exams(department_id);

CREATE INDEX IF NOT EXISTS idx_assignments_professor ON assignments(professor_id);
CREATE INDEX IF NOT EXISTS idx_assignments_exam ON assignments(exam_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

CREATE INDEX IF NOT EXISTS idx_incidents_professor ON incidents(professor_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);

-- Create trigger for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_professors_updated_at
    BEFORE UPDATE ON professors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_salles_updated_at
    BEFORE UPDATE ON salles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
    BEFORE UPDATE ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON incidents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default data
-- Admin user
INSERT INTO departments (name, code, staff_count) 
VALUES ('Scolarite', 'ADMIN', 1) 
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (username, email, password_hash, first_name, last_name, role, institutional_grade) 
VALUES ('admin', 'admin@fpk.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGgaYl3W', 'Admin', 'System', 'admin', 'ADMIN') 
ON CONFLICT (username) DO NOTHING;

-- Professor user
INSERT INTO departments (name, code, staff_count) 
VALUES ('Computer Science', 'CS', 1) 
ON CONFLICT (name) DO NOTHING;

INSERT INTO users (username, email, password_hash, first_name, last_name, role, institutional_grade) 
VALUES ('prof', 'prof@fpk.edu', '$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGgaYl3W', 'Sarah', 'Connor', 'professor', 'PR') 
ON CONFLICT (username) DO NOTHING;

-- Get department IDs
DO $$
DECLARE
    cs_dept_id INTEGER;
    admin_dept_id INTEGER;
BEGIN
    SELECT id INTO cs_dept_id FROM departments WHERE name = 'Computer Science' LIMIT 1;
    SELECT id INTO admin_dept_id FROM departments WHERE name = 'Scolarite' LIMIT 1;
    
    -- Update admin user with department
    UPDATE users SET department_id = admin_dept_id WHERE username = 'admin';
    
    -- Update admin department head
    UPDATE departments SET head_id = (SELECT id FROM users WHERE username = 'admin') WHERE name = 'Scolarite';
    
    -- Create professor profile
    INSERT INTO professors (user_id, department_id, academic_title, max_guards, completed_guards) 
    VALUES (
        (SELECT id FROM users WHERE username = 'prof'),
        cs_dept_id,
        'DR',
        4,
        0
    ) 
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Update CS department staff count
    UPDATE departments SET staff_count = 1 WHERE name = 'Computer Science';
END $$;

-- Create sample salles
INSERT INTO salles (name, code, capacity, type, floor, building, is_active) 
VALUES 
    ('Amphi A', 'A', 200, 'AMPHI', '1', 'Main', TRUE),
    ('Amphi B', 'B', 150, 'AMPHI', '1', 'Main', TRUE),
    ('Salle B12', 'B12', 50, 'SALLE', '2', 'Building B', TRUE),
    ('Lab 201', 'L201', 30, 'LAB', '2', 'Science', TRUE),
    ('Lab 104', 'L104', 25, 'LAB', '1', 'Science', TRUE),
    ('Amphi C', 'C', 100, 'AMPHI', '2', 'Main', TRUE)
ON CONFLICT (code) DO NOTHING;

-- Create more departments
INSERT INTO departments (name, code, staff_count) 
VALUES 
    ('Mathematics', 'MATH', 0),
    ('Physics', 'PHYSICS', 0),
    ('Philosophy', 'PHIL', 0)
ON CONFLICT (name) DO NOTHING;

-- Create sample exams
INSERT INTO exams (module, module_code, exam_type, date, start_time, end_time, salle_id, department_id) 
VALUES 
    ('Linear Algebra', 'MATH101', 'FINAL', '2026-05-12', '09:00:00', '11:00:00', 
     (SELECT id FROM salles WHERE code = 'A'), 
     (SELECT id FROM departments WHERE code = 'MATH')),
    ('Data Structures', 'CS201', 'MIDTERM', '2026-05-12', '14:00:00', '16:00:00', 
     (SELECT id FROM salles WHERE code = 'L201'), 
     (SELECT id FROM departments WHERE code = 'CS')),
    ('Quantum Physics', 'PHYS401', 'FINAL', '2026-05-13', '10:00:00', '12:00:00', 
     (SELECT id FROM salles WHERE code = 'B'), 
     (SELECT id FROM departments WHERE code = 'PHYSICS'))
ON CONFLICT (module) DO NOTHING;

-- Create sample assignments
INSERT INTO assignments (professor_id, exam_id, status) 
VALUES (
    (SELECT id FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'prof')),
    (SELECT id FROM exams WHERE module = 'Data Structures'),
    'CONFIRMED'
) 
ON CONFLICT (professor_id, exam_id) DO NOTHING;

-- Update professor quota
UPDATE professors 
SET completed_guards = 1 
WHERE user_id = (SELECT id FROM users WHERE username = 'prof');

-- Create sample incidents
INSERT INTO incidents (professor_id, assignment_id, incident_type, description, severity, related_exam_id) 
VALUES (
    (SELECT id FROM professors WHERE user_id = (SELECT id FROM users WHERE username = 'prof')),
    (SELECT id FROM assignments WHERE exam_id = (SELECT id FROM exams WHERE module = 'Data Structures')),
    'SCHEDULE CONFLICT',
    'Conflict with another exam on the same day',
    'MEDIUM',
    (SELECT id FROM exams WHERE module = 'Data Structures')
) 
ON CONFLICT DO NOTHING;

-- Display completion message
SELECT 'FPK Exam Guard database schema and sample data created successfully!' AS message;
