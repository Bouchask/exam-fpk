#!/usr/bin/env python3
"""
Database initialization script for FPK Exam Guard Backend
This script creates the PostgreSQL database and tables
"""

import os
import sys
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

# Database configuration from environment or defaults
DB_NAME = os.getenv('DB_NAME', 'fpk_exam_guard')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASSWORD = os.getenv('DB_PASSWORD', 'postgres')
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_PORT = os.getenv('DB_PORT', '5432')


def create_database():
    """Create the PostgreSQL database if it doesn't exist"""
    print(f"Creating database '{DB_NAME}'...")
    
    try:
        # Connect to the default postgres database
        conn = psycopg2.connect(
            dbname='postgres',
            user=DB_USER,
            password=DB_PASSWORD,
            host=DB_HOST,
            port=DB_PORT
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname = %s", (DB_NAME,))
        exists = cursor.fetchone()
        
        if not exists:
            # Create database
            cursor.execute(f"CREATE DATABASE {DB_NAME}")
            print(f"Database '{DB_NAME}' created successfully")
        else:
            print(f"Database '{DB_NAME}' already exists")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error creating database: {e}")
        sys.exit(1)


def create_tables():
    """Create database tables using SQLAlchemy"""
    print("Creating database tables...")
    
    # Set DATABASE_URL environment variable
    os.environ['DATABASE_URL'] = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    
    from app import app, db
    
    with app.app_context():
        try:
            db.create_all()
            print("All tables created successfully")
        except Exception as e:
            print(f"Error creating tables: {e}")
            sys.exit(1)


def create_sample_data():
    """Create sample data for testing"""
    print("Creating sample data...")
    
    from app import app, db
    from models import User, Professor, Department, Salle, Exam, Assignment
    
    with app.app_context():
        try:
            # Check if admin exists
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
                print("Created admin user: admin/admin")
            
            # Check if professor exists
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
                print("Created professor user: prof/prof")
                
                # Create CS department if not exists
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
                    user_id=prof.id,
                    department_id=cs_dept.id,
                    academic_title='DR',
                    max_guards=4
                )
                db.session.add(professor)
                db.session.commit()
                
                # Update department staff count
                cs_dept.staff_count += 1
                db.session.commit()
            
            # Create more sample data if needed
            if Salle.query.count() == 0:
                salles = [
                    Salle(name='Amphi A', code='A', type='AMPHI', capacity=200, building='Main', floor='1'),
                    Salle(name='Amphi B', code='B', type='AMPHI', capacity=150, building='Main', floor='1'),
                    Salle(name='Salle B12', code='B12', type='SALLE', capacity=50, building='Building B', floor='2'),
                    Salle(name='Lab 201', code='L201', type='LAB', capacity=30, building='Science', floor='2'),
                ]
                db.session.add_all(salles)
                db.session.commit()
                print(f"Created {len(salles)} sample salles")
            
            if Department.query.count() < 4:
                departments = [
                    {'name': 'Mathematics', 'code': 'MATH'},
                    {'name': 'Physics', 'code': 'PHYSICS'},
                    {'name': 'Philosophy', 'code': 'PHIL'},
                ]
                for dept_data in departments:
                    if not Department.query.filter_by(name=dept_data['name']).first():
                        dept = Department(**dept_data)
                        db.session.add(dept)
                db.session.commit()
                print("Created sample departments")
            
            print("Sample data created successfully")
            
        except Exception as e:
            db.session.rollback()
            print(f"Error creating sample data: {e}")
            sys.exit(1)


if __name__ == '__main__':
    print("=" * 60)
    print("FPK Exam Guard Backend - Database Initialization")
    print("=" * 60)
    
    # Step 1: Create database
    create_database()
    
    # Step 2: Create tables
    create_tables()
    
    # Step 3: Create sample data
    create_sample_data()
    
    print("\n" + "=" * 60)
    print("Database initialization completed successfully!")
    print("=" * 60)
    print("\nYou can now start the Flask server:")
    print("  python app.py")
    print("\nOr use the run script:")
    print("  python run.py")
