#!/usr/bin/env python3
"""
Database initialization script for FPK Exam Guard Backend
This script creates the PostgreSQL database and tables
"""

import os
import sys

# Import the create_app function from app.py
from app import create_app
from models import db, User, Professor, Department, Salle, Filier

def main():
    """Main initialization function"""
    print("=" * 60)
    print("FPK Exam Guard Backend - Database Initialization")
    print("=" * 60)

    # Create the app
    app = create_app()

    with app.app_context():
        # Create all tables
        print("Creating database tables...")
        db.create_all()
        print("All tables created successfully")

        # Create default users
        print("Creating sample data...")

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
        else:
            admin = User.query.filter_by(username='admin').first()

        # Create admin department if not exists
        admin_dept = Department.query.filter_by(code='ADMIN').first()
        if not admin_dept:
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
        else:
            prof_user = User.query.filter_by(username='prof').first()

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

        # Create professor profile if not exists
        if not Professor.query.filter_by(user_id=prof_user.id).first():
            professor = Professor(
                user_id=prof_user.id,
                department_id=cs_dept.id,
                academic_title='DR',
                max_guards=4,
                completed_guards=0
            )
            db.session.add(professor)
            db.session.commit()
            print("Default professor profile created")

        # Update department staff count
        if cs_dept and cs_dept.staff_count == 0:
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

        # Create default filieres
        cs_dept = Department.query.filter_by(name='Computer Science').first()
        if cs_dept:
            # Create Computer Science filier if not exists
            cs_filier = Filier.query.filter_by(name='Computer Science').first()
            if not cs_filier:
                cs_filier = Filier(
                    name='Computer Science',
                    code='CS',
                    department_id=cs_dept.id,
                    max_modules=7,
                    description='Computer Science and Engineering',
                    is_active=True
                )
                db.session.add(cs_filier)
                db.session.commit()
                print("Default Computer Science filier created")

    print("\n" + "=" * 60)
    print("Database initialization completed successfully!")
    print("=" * 60)
    print("\nYou can now start the Flask server:")
    print("  python app.py")
    print("\nOr use the run script:")
    print("  python run.py")

if __name__ == '__main__':
    main()
