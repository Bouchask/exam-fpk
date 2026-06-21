#!/usr/bin/env python3
"""
Database initialization script for FPK Exam Guard Backend
This script creates the PostgreSQL database and tables
"""

import os
import sys

# Import the create_app function from app.py
from app import create_app
from models import db, User, Professor, Department, Salle, Filier, Module, Exam, ProfessorFilier

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
            
            # Create modules for Computer Science filier
            modules = [
                {'name': 'Power BI', 'code': 'POWER-BI', 'hours': 45},
                {'name': 'Data Science', 'code': 'DS-101', 'hours': 45},
                {'name': 'Web Development', 'code': 'WEB-201', 'hours': 45},
                {'name': 'Database Systems', 'code': 'DB-301', 'hours': 45},
                {'name': 'Algorithms', 'code': 'ALG-401', 'hours': 45},
            ]
            
            for module_data in modules:
                if not Module.query.filter_by(code=module_data['code']).first():
                    module = Module(
                        name=module_data['name'],
                        code=module_data['code'],
                        filier_id=cs_filier.id,
                        hours=module_data['hours'],
                        is_active=True
                    )
                    db.session.add(module)
            db.session.commit()
            print("Default modules created for Computer Science filier")
            
            # Create Yahya professor for Power BI module
            yahya_user = User.query.filter_by(username='yahya').first()
            if not yahya_user:
                yahya_user = User(
                    username='yahya',
                    email='yahya.benali@fpk.edu',
                    first_name='Yahya',
                    last_name='Benali',
                    role='professor',
                    institutional_grade='PR'
                )
                yahya_user.set_password('yahya')
                db.session.add(yahya_user)
                db.session.commit()
                print("Yahya professor user created: yahya/yahya")
            
            # Create Yahya professor profile
            yahya_prof = Professor.query.filter_by(user_id=yahya_user.id).first()
            if not yahya_prof:
                yahya_prof = Professor(
                    user_id=yahya_user.id,
                    department_id=cs_dept.id,
                    academic_title='DR',
                    max_guards=4,
                    completed_guards=0
                )
                db.session.add(yahya_prof)
                db.session.commit()
                print("Yahya professor profile created")
            
            # Link Yahya to Power BI module (direct relationship)
            power_bi = Module.query.filter_by(code='POWER-BI').first()
            if power_bi and power_bi.professor_id is None:
                power_bi.professor_id = yahya_prof.id
                db.session.commit()
                print("Yahya linked as professor for Power BI module")
            
            # Also link Yahya to Computer Science filier (many-to-many)
            existing_link = ProfessorFilier.query.filter_by(
                professor_id=yahya_prof.id,
                filier_id=cs_filier.id
            ).first()
            if not existing_link:
                prof_filier_link = ProfessorFilier(
                    professor_id=yahya_prof.id,
                    filier_id=cs_filier.id
                )
                db.session.add(prof_filier_link)
                db.session.commit()
                print("Yahya linked to Computer Science filier")
            
            # Create additional professors for other modules
            fatima_user = User.query.filter_by(username='fatima').first()
            if not fatima_user:
                fatima_user = User(
                    username='fatima',
                    email='fatima.zahra@fpk.edu',
                    first_name='Fatima',
                    last_name='Zahra',
                    role='professor',
                    institutional_grade='PR'
                )
                fatima_user.set_password('fatima')
                db.session.add(fatima_user)
                db.session.commit()
                print("Fatima professor user created: fatima/fatima")
            
            fatima_prof = Professor.query.filter_by(user_id=fatima_user.id).first()
            if not fatima_prof:
                fatima_prof = Professor(
                    user_id=fatima_user.id,
                    department_id=cs_dept.id,
                    academic_title='DR',
                    max_guards=4,
                    completed_guards=0
                )
                db.session.add(fatima_prof)
                db.session.commit()
                print("Fatima professor profile created")
            
            # Link Fatima to Data Science module
            data_science = Module.query.filter_by(code='DS-101').first()
            if data_science and data_science.professor_id is None:
                data_science.professor_id = fatima_prof.id
                db.session.commit()
                print("Fatima linked as professor for Data Science module")
            
            # Link Fatima to Computer Science filier
            existing_link = ProfessorFilier.query.filter_by(
                professor_id=fatima_prof.id,
                filier_id=cs_filier.id
            ).first()
            if not existing_link:
                prof_filier_link = ProfessorFilier(
                    professor_id=fatima_prof.id,
                    filier_id=cs_filier.id
                )
                db.session.add(prof_filier_link)
                db.session.commit()
            
            # Create exams for the modules
            from datetime import date, time
            exams_data = [
                {
                    'module_code': 'POWER-BI',
                    'exam_type': 'NORMAL',
                    'date': date(2026, 7, 9),
                    'start_time': time(9, 0),
                    'end_time': time(11, 0),
                    'salle_code': 'A',
                },
                {
                    'module_code': 'DS-101',
                    'exam_type': 'NORMAL',
                    'date': date(2026, 7, 10),
                    'start_time': time(14, 0),
                    'end_time': time(16, 0),
                    'salle_code': 'B',
                },
            ]
            
            for exam_data in exams_data:
                module = Module.query.filter_by(code=exam_data['module_code']).first()
                salle = Salle.query.filter_by(code=exam_data['salle_code']).first()
                
                if module and salle:
                    existing_exam = Exam.query.filter_by(
                        module_id=module.id,
                        exam_type=exam_data['exam_type']
                    ).first()
                    
                    if not existing_exam:
                        exam = Exam(
                            module_id=module.id,
                            module=module.name,
                            module_code=module.code,
                            exam_type=exam_data['exam_type'],
                            filier_id=cs_filier.id,
                            date=exam_data['date'],
                            start_time=exam_data['start_time'],
                            end_time=exam_data['end_time'],
                            duration_minutes=120,
                            salle_id=salle.id,
                            department_id=cs_dept.id,
                            academic_year='2025-2026',
                            semester='S2',
                            status='SCHEDULED'
                        )
                        db.session.add(exam)
            db.session.commit()
            print("Default exams created")
            
            # Update department staff count
            cs_dept.staff_count = Professor.query.filter_by(department_id=cs_dept.id).count()
            db.session.commit()

    print("\n" + "=" * 60)
    print("Database initialization completed successfully!")
    print("=" * 60)
    print("\nYou can now start the Flask server:")
    print("  python app.py")
    print("\nOr use the run script:")
    print("  python run.py")

if __name__ == '__main__':
    main()
