#!/usr/bin/env python3
"""
Seed script to generate large amounts of test data for FPK Exam Guard system.
This script creates:
- 10 Departments
- 30 Filieres (3 per department)
- 150 Modules (5 per filiere)
- 50 Professors
- 200 Exams
- 400 Assignments

Usage:
    python seed_test_data.py

Note: Run this after initializing the database with init_db.py
"""

import random
from datetime import datetime, time, timedelta
from models import db, Department, Filier, Module, Professor, User, Salle, Exam, Assignment, ProfessorFilier, AssignmentHistory, Incident

def clear_existing_data():
    """Clear existing data to start fresh"""
    print("Clearing existing data...")
    
    # Clear department references in users first
    # Set department_id to NULL for all users
    User.query.update({'department_id': None})
    db.session.commit()
    
    # Clear department head references
    Department.query.update({'head_id': None})
    db.session.commit()
    
    # Delete in reverse order due to foreign key constraints
    # First delete assignments (depends on professors and exams)
    Assignment.query.delete()
    
    # Delete assignment history
    AssignmentHistory.query.delete()
    
    # Then delete exams (depends on modules, salles, departments)
    Exam.query.delete()
    
    # Delete professor_filier associations first (depends on professors and filieres)
    ProfessorFilier.query.delete()
    
    # Then delete professors (depends on users and departments)
    Professor.query.delete()
    
    # Then delete modules (depends on filieres and professors)
    Module.query.delete()
    
    # Then delete filieres (depends on departments)
    Filier.query.delete()
    
    # Then delete salles (no dependencies)
    Salle.query.delete()
    
    # Delete incidents (depends on professors, assignments, exams, users)
    Incident.query.delete()
    
    # Now delete users with professor/admin roles
    User.query.filter(User.role.in_(['professor', 'admin'])).delete()
    
    # Finally delete departments
    Department.query.delete()
    
    db.session.commit()
    print("Existing data cleared!\n")

def create_departments():
    """Create 10 departments"""
    print("Creating departments...")
    
    department_names = [
        "Computer Science",
        "Mathematics",
        "Physics",
        "Chemistry",
        "Biology",
        "Engineering",
        "Business Administration",
        "Economics",
        "Psychology",
        "Literature",
    ]
    
    departments = []
    for i, name in enumerate(department_names, start=1):
        dept = Department(
            name=name,
            code=f"DEPT-{i:02d}",
            head_id=None,  # Will set later
            staff_count=random.randint(15, 50),
        )
        db.session.add(dept)
        departments.append(dept)
    
    db.session.commit()
    print(f"Created {len(departments)} departments!\n")
    return departments

def create_filieres(departments):
    """Create 30 filieres (3 per department)"""
    print("Creating filieres...")
    
    filiere_names = {
        "Computer Science": ["Software Engineering", "Computer Systems", "Artificial Intelligence", "Data Science", "Cybersecurity"],
        "Mathematics": ["Pure Mathematics", "Applied Mathematics", "Statistics", "Operations Research", "Computational Mathematics"],
        "Physics": ["Theoretical Physics", "Experimental Physics", "Quantum Physics", "Astrophysics", "Condensed Matter"],
        "Chemistry": ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry", "Analytical Chemistry", "Biochemistry"],
        "Biology": ["Molecular Biology", "Cell Biology", "Genetics", "Ecology", "Microbiology"],
        "Engineering": ["Mechanical Engineering", "Electrical Engineering", "Civil Engineering", "Chemical Engineering", "Industrial Engineering"],
        "Business Administration": ["Marketing", "Finance", "Human Resources", "Operations Management", "Entrepreneurship"],
        "Economics": ["Microeconomics", "Macroeconomics", "Econometrics", "Development Economics", "International Trade"],
        "Psychology": ["Clinical Psychology", "Cognitive Psychology", "Social Psychology", "Developmental Psychology", "Industrial-Organizational Psychology"],
        "Literature": ["English Literature", "Comparative Literature", "Linguistics", "Creative Writing", "Literary Theory"],
    }
    
    filieres = []
    for dept in departments:
        dept_filieres = filiere_names.get(dept.name, [])
        if not dept_filieres:
            # Generate generic names if not in mapping
            dept_filieres = [f"{dept.name} Track {i+1}" for i in range(3)]
        
        for i, name in enumerate(dept_filieres[:3]):  # Max 3 per department
            filier = Filier(
                name=name,
                code=f"{dept.code}-F{i+1}",
                department_id=dept.id,
                max_modules=random.randint(5, 10),
                description=f"Field of study in {dept.name}",
                is_active=True,
            )
            db.session.add(filier)
            filieres.append(filier)
    
    db.session.commit()
    print(f"Created {len(filieres)} filieres!\n")
    return filieres

def create_modules(filieres):
    """Create 150+ modules (5-10 per filiere)"""
    print("Creating modules...")
    
    module_names_by_filier = {
        "Software Engineering": ["Programming Fundamentals", "Data Structures", "Algorithms", "Software Design", "Software Testing", "Object-Oriented Programming", "Design Patterns", "Web Development", "Mobile Development", "Database Systems"],
        "Computer Systems": ["Computer Architecture", "Operating Systems", "Computer Networks", "Distributed Systems", "Embedded Systems", "Real-Time Systems", "Parallel Computing", "Cloud Computing", "Cybersecurity Fundamentals", "Computer Security"],
        "Artificial Intelligence": ["Machine Learning", "Deep Learning", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Neural Networks", "AI Ethics", "Robotics", "Expert Systems", "Data Mining"],
        "Data Science": ["Statistical Analysis", "Data Visualization", "Big Data Technologies", "Predictive Modeling", "Time Series Analysis", "Data Warehousing", "Business Intelligence", "Power BI", "Tableau", "Python for Data Science"],
        "Cybersecurity": ["Network Security", "Cryptography", "Security Protocols", "Ethical Hacking", "Digital Forensics", "Risk Management", "Security Architecture", "Incident Response", "Security Compliance", "Malware Analysis"],
    }
    
    # Generic module names for filieres not in mapping
    generic_modules = [
        "Introduction to {}", "Advanced {}", "Principles of {}", "{} Fundamentals", "{} Theory",
        "{} Applications", "Modern {}", "{} Methods", "{} Techniques", "Special Topics in {}"
    ]
    
    modules = []
    
    for filier in filieres:
        # Get filier info safely (already loaded)
        filier_name = filier.name
        filier_code = filier.code
        
        num_modules = random.randint(5, 10)
        
        for i in range(num_modules):
            # Use the predefined module names for specific filieres, or generate generic names
            # For specific filieres with predefined names
            predefined_names = module_names_by_filier.get(filier_name, [])
            if predefined_names and i < len(predefined_names):
                module_name = predefined_names[i]
            else:
                # Generate unique module name
                module_name = f"{filier_name.replace(' ', '_')}_M{i+1}"
            
            module = Module(
                name=module_name,
                code=f"{filier_code}-M{i+1:02d}",
                filier_id=filier.id,
                professor_id=None,  # Will set in next step
                hours=random.choice([30, 45, 60, 75]),
                description=f"Study module in {filier_name}",
                is_active=True,
            )
            db.session.add(module)
            modules.append(module)
            
            # Commit periodically to avoid memory issues
            if len(modules) % 50 == 0:
                db.session.commit()
    
    db.session.commit()
    print(f"Created {len(modules)} modules!\n")
    return modules

def create_professors(departments, filieres, modules):
    """Create 50 professors with associated users"""
    print("Creating professors...")
    
    first_names = [
        "James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth",
        "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
        "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Margaret", "Anthony", "Betty", "Donald", "Sandra",
        "Mark", "Ashley", "Paul", "Dorothy", "Steven", "Kimberly", "Andrew", "Emily", "Kenneth", "Donna"
    ]
    
    last_names = [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
        "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
        "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
        "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores"
    ]
    
    professors = []
    
    for i in range(50):
        first_name = random.choice(first_names)
        last_name = random.choice(last_names)
        dept = random.choice(departments)
        
        # Create user first
        username = f"prof{(i+1):03d}"
        user = User(
            username=username,
            email=f"{username}@fpk.edu",
            password_hash="$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGgaYlPO",  # password = "prof123"
            first_name=first_name,
            last_name=last_name,
            role="professor",
            institutional_grade=random.choice(["PR", "MCF", "MC"]),
            department_id=dept.id,
            is_active=True,
        )
        db.session.add(user)
        db.session.flush()  # Get user ID
        
        # Create professor with higher max_guards for seeding
        # We'll set it to 10 during seeding, then update to 4 at the end
        professor = Professor(
            user_id=user.id,
            department_id=dept.id,
            max_guards=10,  # Temporary high value for seeding
            completed_guards=random.randint(0, 4),
            academic_title=random.choice(["Dr.", "Prof.", "Assoc. Prof.", ""]),
        )
        db.session.add(professor)
        db.session.flush()
        
        # Associate professor with 1-3 random filieres from their department
        dept_filieres = [f for f in filieres if f.department_id == dept.id]
        num_filieres = random.randint(1, min(3, len(dept_filieres)))
        for filier in random.sample(dept_filieres, num_filieres):
            # SQLAlchemy many-to-many relationship will be handled by ORM
            professor.filieres.append(filier)
        
        # Associate professor with 2-5 random modules from their filieres
        prof_filier_ids = [f.id for f in professor.filieres]
        prof_modules = [m for m in modules if m.filier_id in prof_filier_ids]
        num_modules = random.randint(0, min(3, len(prof_modules)))
        for module in random.sample(prof_modules, num_modules):
            module.professor_id = professor.id
        
        professors.append(professor)
        db.session.commit()
    
    print(f"Created {len(professors)} professors!\n")
    return professors

def create_salles():
    """Create 20 rooms/salles"""
    print("Creating salles...")
    
    salle_types = ["AMPHI", "SALLE", "LAB"]
    buildings = ["Main Building", "Science Building", "Engineering Block", "Library Annex", "New Wing"]
    floors = ["Ground", "1st", "2nd", "3rd", "Basement"]
    
    salles = []
    for i in range(20):
        salle_type = random.choice(salle_types)
        salle = Salle(
            name=f"{salle_type} {chr(65 + i // 5)}{i % 5 + 1}",
            code=f"{salle_type}-{i+1:03d}",
            capacity=random.choice([30, 50, 80, 100, 150, 200]) if salle_type != "LAB" else random.choice([20, 25, 30]),
            type=salle_type,
            floor=random.choice(floors),
            building=random.choice(buildings),
            is_active=True,
        )
        db.session.add(salle)
        salles.append(salle)
    
    db.session.commit()
    print(f"Created {len(salles)} salles!\n")
    return salles

def create_exams(filieres, salles, modules):
    """Create 200 exams"""
    print("Creating exams...")
    
    exam_types = ["NORMAL", "RATTRAPAGE"]
    semesters = ["S1", "S2"]
    
    exams = []
    start_date = datetime(2026, 1, 15)
    
    for i in range(200):
        # Random module
        module = random.choice(modules)
        
        # Random date within 2026
        days_offset = random.randint(0, 200)
        exam_date = start_date + timedelta(days=days_offset)
        
        # Random time slot (9:00-18:00)
        start_hour = random.randint(8, 15)
        end_hour = start_hour + random.choice([2, 3])
        if end_hour > 18:
            end_hour = 18
        
        start_time = time(start_hour, random.choice([0, 30]))
        end_time = time(end_hour, random.choice([0, 30]))
        
        # Random salle
        salle = random.choice(salles)
        
        exam = Exam(
            module_id=module.id,
            module=module.name,
            module_code=module.code,
            exam_type=random.choice(exam_types),
            filier_id=module.filier_id,
            date=exam_date.date(),
            start_time=start_time,
            end_time=end_time,
            duration_minutes=int((end_time.hour * 60 + end_time.minute) - (start_time.hour * 60 + start_time.minute)),
            salle_id=salle.id,
            department_id=module.filier.department_id,
            academic_year="2025-2026",
            semester=random.choice(semesters),
            status=random.choice(["SCHEDULED", "COMPLETED", "CANCELLED"]),
            notes=f"Exam {i+1}",
        )
        db.session.add(exam)
        exams.append(exam)
    
    db.session.commit()
    print(f"Created {len(exams)} exams!\n")
    return exams

def create_assignments(professors, exams):
    """Create 400+ assignments"""
    print("Creating assignments...")
    
    assignments = []
    
    # Make sure we don't exceed professor quotas
    professor_assignments_count = {p.id: 0 for p in professors}
    # Track which professor-exam pairs already exist
    existing_pairs = set()
    
    # Assign professors to exams
    # We'll assign 2-3 professors per exam to get ~500 total assignments
    for exam in exams:
        # Find eligible professors (from same department, not at quota)
        eligible_profs = [p for p in professors 
                         if p.department_id == exam.department_id 
                         and professor_assignments_count[p.id] < 4]
        
        if not eligible_profs:
            # Fallback: find any professor not at quota
            eligible_profs = [p for p in professors if professor_assignments_count[p.id] < 4]
        
        if eligible_profs:
            # Assign 1-2 professors per exam (not all 4 slots per professor)
            # This leaves room for testing quota management
            max_assignees = min(2, len(eligible_profs))
            num_assignees = random.randint(1, max_assignees) if max_assignees >= 1 else 1
            
            # Sort professors by current assignment count (prefer those with fewer assignments)
            eligible_profs_sorted = sorted(eligible_profs, key=lambda p: professor_assignments_count[p.id])
            
            for prof in random.sample(eligible_profs_sorted[:max_assignees], num_assignees):
                pair_key = (prof.id, exam.id)
                if pair_key not in existing_pairs and professor_assignments_count[prof.id] < 10:  # Use 10 since we set max to 10
                    assignment = Assignment(
                        professor_id=prof.id,
                        exam_id=exam.id,
                        status=random.choice(["CONFIRMED", "PENDING", "DECLINED"]),
                        assignment_date=datetime.now() - timedelta(days=random.randint(1, 30)),
                        notes=f"Assignment for {exam.module}",
                    )
                    db.session.add(assignment)
                    assignments.append(assignment)
                    existing_pairs.add(pair_key)
                    professor_assignments_count[prof.id] += 1
    
    db.session.commit()
    print(f"Created {len(assignments)} assignments!\n")
    return assignments

def update_department_heads(departments, professors):
    """Assign department heads"""
    print("Assigning department heads...")
    
    for dept in departments:
        # Find professors in this department
        dept_profs = [p for p in professors if p.department_id == dept.id]
        if dept_profs:
            head = random.choice(dept_profs)
            dept.head_id = head.user_id
    
    db.session.commit()
    print(f"Assigned heads to {len(departments)} departments!\n")

def update_professor_quotas(professors, assignments):
    """Update professor max_guards to 4 and completed_guards to match actual assignments"""
    print("Updating professor quotas...")
    
    for prof in professors:
        # Count actual assignments for this professor
        actual_assignments = len([a for a in assignments if a.professor_id == prof.id])
        
        # Update max_guards to 4 (standard quota)
        prof.max_guards = 4
        
        # Update completed_guards to match actual assignments (but cap at max_guards)
        # For better testing, we'll set completed_guards to actual assignments
        # but cap at max_guards (4)
        # This means professors with <= 4 assignments will show their actual count
        prof.completed_guards = min(actual_assignments, 4)
        
        # Randomly reduce completed_guards for some professors to create available slots
        # This simulates professors who haven't completed all their assigned guards yet
        if random.random() < 0.4:  # 40% chance to have incomplete guards
            reduction = random.randint(1, min(2, prof.completed_guards))
            prof.completed_guards -= reduction
    
    db.session.commit()
    print(f"Updated quotas for {len(professors)} professors!\n")

def print_summary(departments, filieres, modules, professors, salles, exams, assignments):
    """Print summary of created data"""
    print("=" * 80)
    print("SEED DATA SUMMARY")
    print("=" * 80)
    print(f"\n📚 Departments: {len(departments)}")
    print(f"📂 Filieres: {len(filieres)}")
    print(f"📖 Modules: {len(modules)}")
    print(f"👨‍🏫 Professors: {len(professors)}")
    print(f"🏢 Salles: {len(salles)}")
    print(f"📅 Exams: {len(exams)}")
    print(f"📋 Assignments: {len(assignments)}")
    
    # Additional stats
    depts_with_heads = sum(1 for d in departments if d.head_id)
    profs_at_quota = sum(1 for p in professors if p.completed_guards >= p.max_guards)
    
    print(f"\n📊 Additional Statistics:")
    print(f"   - Departments with heads: {depts_with_heads}/{len(departments)}")
    print(f"   - Professors at quota: {profs_at_quota}/{len(professors)}")
    print(f"   - Avg assignments per exam: {len(assignments)/len(exams):.1f}")
    print(f"   - Avg modules per filiere: {len(modules)/len(filieres):.1f}")
    
    print("\n" + "=" * 80)
    print("✅ Seed completed successfully!")
    print("=" * 80)

def main():
    """Main seed function"""
    print("\n" + "=" * 80)
    print("FPK Exam Guard - Test Data Seeder")
    print("=" * 80 + "\n")
    
    try:
        # Clear existing data
        clear_existing_data()
        
        # Create data in order (respecting foreign key dependencies)
        departments = create_departments()
        filieres = create_filieres(departments)
        modules = create_modules(filieres)
        salles = create_salles()
        professors = create_professors(departments, filieres, modules)
        
        # Update department heads
        update_department_heads(departments, professors)
        
        # Create exams and assignments
        exams = create_exams(filieres, salles, modules)
        assignments = create_assignments(professors, exams)
        
        # Update professor quotas to standard value (4)
        update_professor_quotas(professors, assignments)
        
        # Print summary
        print_summary(departments, filieres, modules, professors, salles, exams, assignments)
        
    except Exception as e:
        db.session.rollback()
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0

if __name__ == "__main__":
    from app import create_app
    
    app = create_app()
    with app.app_context():
        exit(main())
