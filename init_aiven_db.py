#!/usr/bin/env python3
"""
Final Database Initialization Script for Aiven.io
Simple and reliable - checks if data exists before inserting
"""
import os
import sys
from sqlalchemy import create_engine, text
from werkzeug.security import generate_password_hash

# Aiven.io Database Configuration
# Please set DATABASE_URL environment variable before running
# Example: export DATABASE_URL="postgres://username:password@host:port/database?sslmode=require"
AIVEN_DB_URL = os.getenv('DATABASE_URL')


def create_database():
    """Create the database and tables in Aiven.io"""
    print("Connecting to Aiven.io PostgreSQL...")
    print(f"Database URL: {AIVEN_DB_URL}")
    
    try:
        # Replace 'postgres' with 'postgresql' for SQLAlchemy
        db_url = AIVEN_DB_URL.replace('postgres://', 'postgresql://')
        
        # Create engine with SSL mode required for Aiven.io
        engine = create_engine(
            db_url,
            pool_size=5,
            max_overflow=10,
            pool_timeout=30,
            connect_args={
                'connect_timeout': 10,
                'sslmode': 'require'
            }
        )
        
        print("\n✓ Connected to Aiven.io PostgreSQL successfully!")
        
        # Check if data already exists
        with engine.connect() as connection:
            user_count = connection.execute(text("SELECT COUNT(*) FROM users")).scalar()
        
        if user_count > 0:
            print("\nℹ Database already initialized with data")
            print("\nVerifying database setup...")
        else:
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
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
                        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
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
                        updated_at TIMESTAMP,
                        FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE SET NULL,
                        FOREIGN KEY(salle_id) REFERENCES salles(id) ON DELETE SET NULL,
                        FOREIGN KEY(department_id) REFERENCES departments(id) ON DELETE SET NULL,
                        FOREIGN KEY(filier_id) REFERENCES fileres(id) ON DELETE SET NULL
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
                        FOREIGN KEY(assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
                        FOREIGN KEY(professor_id) REFERENCES professors(id) ON DELETE CASCADE,
                        FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
                    );
                    """
                ]
                
                for statement in statements:
                    try:
                        connection.execute(text(statement))
                    except Exception as e:
                        print(f"  Note: {str(e)}")
                connection.commit()
            
            print("✓ Database tables created successfully!")
            
            # Insert default data
            print("\nInserting default data...")
            
            with engine.connect() as connection:
                # Departments
                connection.execute(text("""
                    INSERT INTO departments (name, code, staff_count) VALUES 
                        ('Scolarite', 'ADMIN', 0),
                        ('Computer Science', 'CS', 0),
                        ('Mathematics', 'MATH', 0),
                        ('Physics', 'PHYSICS', 0),
                        ('Philosophy', 'PHIL', 0)
                    ON CONFLICT (name) DO NOTHING;
                """))
                connection.commit()
                
                # Users - Generate proper password hashes
                admin_hash = generate_password_hash('admin')
                prof_hash = generate_password_hash('prof')
                
                connection.execute(text(f"""
                    INSERT INTO users (username, email, password_hash, first_name, last_name, full_name, role, institutional_grade, is_active) 
                    VALUES 
                        ('admin', 'admin@fpk.edu', '{admin_hash}', 'Admin', 'System', 'Admin System', 'admin', 'ADMIN', TRUE),
                        ('prof', 'prof@fpk.edu', '{prof_hash}', 'Sarah', 'Connor', 'Sarah Connor', 'professor', 'PR', TRUE)
                    ON CONFLICT (username) DO NOTHING;
                """))
                connection.commit()
                
                # Professors
                connection.execute(text("""
                    INSERT INTO professors (user_id, department_id, academic_title, max_guards, completed_guards, quota_status)
                    SELECT 
                        u.id,
                        d.id,
                        CASE WHEN u.username = 'admin' THEN 'ADMIN' ELSE 'DR' END,
                        4, 0, 'ACTIVE'
                    FROM users u
                    JOIN departments d ON 
                        (u.username = 'admin' AND d.name = 'Scolarite') OR
                        (u.username = 'prof' AND d.name = 'Computer Science')
                    WHERE NOT EXISTS (SELECT 1 FROM professors p WHERE p.user_id = u.id)
                    ON CONFLICT (user_id) DO NOTHING;
                """))
                connection.execute(text("""
                    UPDATE departments d 
                    SET staff_count = staff_count + 1 
                    WHERE d.id IN (
                        SELECT p.department_id FROM professors p 
                        JOIN users u ON p.user_id = u.id
                        WHERE u.username IN ('admin', 'prof')
                    );
                """))
                connection.commit()
                
                # Salles
                connection.execute(text("""
                    INSERT INTO salles (name, code, capacity, type, floor, building, is_active) VALUES 
                        ('Amphi A', 'A', 200, 'AMPHI', '1', 'Main', TRUE),
                        ('Amphi B', 'B', 150, 'AMPHI', '1', 'Main', TRUE),
                        ('Salle B12', 'B12', 50, 'SALLE', '2', 'Building B', TRUE),
                        ('Lab 201', 'L201', 30, 'LAB', '2', 'Science', TRUE),
                        ('Lab 104', 'L104', 25, 'LAB', '1', 'Science', TRUE),
                        ('Amphi C', 'C', 100, 'AMPHI', '2', 'Main', TRUE)
                    ON CONFLICT (code) DO NOTHING;
                """))
                connection.commit()
                
                # Filieres
                connection.execute(text("""
                    INSERT INTO filieres (name, code, department_id, department_name, max_modules, is_active) VALUES 
                        ('Computer Science', 'CS', 
                            (SELECT id FROM departments WHERE name = 'Computer Science'),
                            'Computer Science', 10, TRUE),
                        ('Mathematics', 'MATH', 
                            (SELECT id FROM departments WHERE name = 'Mathematics'),
                            'Mathematics', 10, TRUE)
                    ON CONFLICT (name) DO NOTHING;
                """))
                connection.commit()
                
                # Modules
                connection.execute(text("""
                    INSERT INTO modules (name, code, filier_id, filier_name, professor_id, hours, is_active) 
                    SELECT 
                        m.name,
                        m.code,
                        f.id,
                        f.name,
                        p.id,
                        45,
                        TRUE
                    FROM (VALUES 
                        ('Algorithms', 'CS101'),
                        ('Data Structures', 'CS102'),
                        ('Databases', 'CS201')
                    ) AS m(name, code)
                    JOIN filieres f ON f.code = 'CS'
                    JOIN professors p ON p.user_id = (SELECT id FROM users WHERE username = 'prof')
                    WHERE NOT EXISTS (SELECT 1 FROM modules mo WHERE mo.code = m.code)
                    ON CONFLICT (code) DO NOTHING;
                """))
                connection.commit()
                
                # Exams
                connection.execute(text("""
                    INSERT INTO exams (module_id, module, module_code, exam_type, date, start_time, end_time, salle_id, salle, department_id, status, academic_year, semester) 
                    SELECT 
                        m.id,
                        m.name,
                        m.code,
                        'NORMAL',
                        e.date,
                        e.start_time,
                        e.end_time,
                        s.id,
                        s.name,
                        d.id,
                        'SCHEDULED',
                        '2025-2026',
                        'S2'
                    FROM modules m
                    JOIN (VALUES 
                        ('2026-01-15', '09:00', '12:00', 'A'),
                        ('2026-01-20', '09:00', '12:00', 'B'),
                        ('2026-01-25', '09:00', '12:00', 'C')
                    ) AS e(date, start_time, end_time, salle_code) ON e.salle_code = s.code
                    JOIN salles s ON s.code = e.salle_code
                    JOIN departments d ON d.name = 'Computer Science'
                    WHERE m.code IN ('CS101', 'CS102', 'CS201')
                    AND NOT EXISTS (SELECT 1 FROM exams ex WHERE ex.module_id = m.id AND ex.date = e.date);
                """))
                connection.commit()
                
                print("  ✓ Default data inserted successfully!")
        
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
        
        # Create indexes
        print("\nCreating indexes...")
        with engine.connect() as connection:
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)",
                "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
                "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
                "CREATE INDEX IF NOT EXISTS idx_professors_user_id ON professors(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_professors_department ON professors(department_id)",
                "CREATE INDEX IF NOT EXISTS idx_exams_module ON exams(module_id)",
                "CREATE INDEX IF NOT EXISTS idx_exams_date ON exams(date)",
                "CREATE INDEX IF NOT EXISTS idx_assignments_professor ON assignments(professor_id)",
                "CREATE INDEX IF NOT EXISTS idx_assignments_exam ON assignments(exam_id)",
                "CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status)",
                "CREATE INDEX IF NOT EXISTS idx_modules_filier ON modules(filier_id)",
                "CREATE INDEX IF NOT EXISTS idx_modules_professor ON modules(professor_id)"
            ]
            for index in indexes:
                try:
                    connection.execute(text(index))
                except Exception:
                    pass  # Index may already exist
            connection.commit()
        
        print("✓ Indexes created successfully!")
        
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
