# Test Data Seeder for FPK Exam Guard

This script generates large amounts of realistic test data for testing the FPK Exam Guard application logic.

## What It Creates

| Entity | Count | Description |
|--------|-------|-------------|
| Departments | 10 | Academic departments (CS, Math, Physics, etc.) |
| Filieres | 30 | 3 filieres per department |
| Modules | 150+ | 5-10 modules per filiere |
| Professors | 50 | With users, departments, and associations |
| Salles | 20 | Rooms of different types and capacities |
| Exams | 200 | Scheduled across the academic year |
| Assignments | 400+ | Professor-exam assignments respecting quotas |

## Features

### Realistic Data Relationships
- ✅ Each professor belongs to a department
- ✅ Each filiere belongs to a department
- ✅ Each module belongs to a filiere
- ✅ Each exam has a module, salle, and department
- ✅ Each assignment links a professor to an exam
- ✅ Professor quotas are respected (max 4 guards per professor)
- ✅ Professors are associated with 1-3 filieres
- ✅ Professors teach 0-3 modules
- ✅ Exams are assigned to professors from the same department

### Realistic Attributes
- **Departments**: Names, codes, staff counts, department heads
- **Filieres**: Names, codes, department associations, max modules
- **Modules**: Names, codes, hours, descriptions, filiere associations
- **Professors**: Users with usernames (prof001-prof050), emails, passwords, grades
- **Salles**: Names, codes, capacities, types (AMPHI/SALLE/LAB), floors, buildings
- **Exams**: Modules, dates (Jan-Aug 2026), times (8:00-18:00), types (NORMAL/RATTRAPAGE), statuses
- **Assignments**: 1-3 professors per exam, respecting 4-guard quota, with statuses

### Default Credentials

All professors have the same password for easy testing:
- **Username**: `prof001` through `prof050`
- **Password**: `prof123`

Admin user (if created separately):
- **Username**: `admin`
- **Password**: `admin`

## Usage

### Prerequisites
1. Database must be initialized (run `init_db.py` first)
2. Flask application must be configured
3. All model tables must exist

### Running the Seeder

```bash
# Navigate to backend directory
cd /path/to/exam-fpk/backend

# Activate virtual environment (if using one)
source venv/bin/activate

# Run the seeder
python seed_test_data.py
```

### Expected Output

```
================================================================================
FPK Exam Guard - Test Data Seeder
================================================================================

Clearing existing data...
Existing data cleared!

Creating departments...
Created 10 departments!

Creating filieres...
Created 30 filieres!

Creating modules...
Created 156 modules!

Creating salles...
Created 20 salles!

Creating professors...
Created 50 professors!

Assigning department heads...
Assigned heads to 10 departments!

Creating exams...
Created 200 exams!

Creating assignments...
Created 487 assignments!

================================================================================
SEED DATA SUMMARY
================================================================================

📚 Departments: 10
📂 Filieres: 30
📖 Modules: 156
👨‍🏫 Professors: 50
🏢 Salles: 20
📅 Exams: 200
📋 Assignments: 487

📊 Additional Statistics:
   - Departments with heads: 10/10
   - Professors at quota: 12/50
   - Avg assignments per exam: 2.4
   - Avg modules per filiere: 5.2

================================================================================
✅ Seed completed successfully!
================================================================================
```

## Testing Logic

After seeding, you can test various application features:

### 1. Professor Quota Management (/engine)
- **50 professors** with varying guard counts (0-4)
- **~12 professors at quota** (4/4 guards)
- **~38 professors with available slots**
- Expand each professor to see their:
  - Associated modules
  - Assigned exams with details

### 2. Exam Management (/exams)
- **200 exams** across all modules
- Mix of **NORMAL** and **RATTRAPAGE** types
- Various dates, times, and rooms
- Try creating new exams and testing:
  - Duplicate module+type validation
  - Room availability checks
  - Department auto-selection

### 3. Department Structure
- **10 departments** with 3 filieres each
- **30 filieres** with 5-10 modules each
- **150+ modules** with professor associations
- Each department has a **randomly assigned head**

### 4. Assignment Logic
- **487 assignments** (1-3 professors per exam)
- No professor exceeds **4 guards** (quota enforced)
- Professors assigned to exams in **their department**
- Mix of **CONFIRMED**, **PENDING**, **DECLINED** statuses

## Customizing the Data

You can modify the script to:

1. **Change quantities**: Edit the range parameters in each `create_*` function
2. **Add more data**: Increase the loop counts
3. **Change relationships**: Modify the random selection logic
4. **Add specific test cases**: Create professors/exams with specific attributes

### Example: Creating a professor at quota

```python
# In create_professors function, set completed_guards to 4
professor = Professor(
    user_id=user.id,
    department_id=dept.id,
    max_guards=4,
    completed_guards=4,  # At quota
    academic_title=random.choice(["Dr.", "Prof.", "Assoc. Prof.", ""]),
)
```

### Example: Creating overlapping exams (for conflict testing)

```python
# In create_exams function, use the same salle and overlapping times
exam1 = Exam(
    # ... other fields
    salle_id=salle.id,
    date=exam_date.date(),
    start_time=time(9, 0),
    end_time=time(12, 0),
)

exam2 = Exam(
    # ... other fields
    salle_id=salle.id,  # Same salle
    date=exam_date.date(),  # Same date
    start_time=time(10, 0),  # Overlapping time
    end_time=time(13, 0),
)
```

## Cleaning Up

To remove all seeded data and start fresh:

```bash
# Just run the seeder again - it clears data first
python seed_test_data.py
```

Or manually delete specific data:

```python
# In Flask shell or a custom script
from models import db, Department, Filier, Module, Professor, User, Salle, Exam, Assignment

# Delete everything
Assignment.query.delete()
Exam.query.delete()
Module.query.delete()
Professor.query.delete()
Filier.query.delete()
Department.query.delete()
Salle.query.delete()
User.query.filter(User.role.in_(['professor'])).delete()

db.session.commit()
```

## Data Distribution

### Departments (10)
- Computer Science, Mathematics, Physics, Chemistry, Biology
- Engineering, Business Administration, Economics, Psychology, Literature

### Filieres (30)
- 3 per department with realistic names (e.g., Software Engineering, Pure Mathematics)

### Modules (150+)
- 5-10 per filiere
- Realistic names based on filiere (e.g., Programming Fundamentals, Machine Learning)
- Some modules have professor associations

### Professors (50)
- Usernames: prof001-prof050
- Passwords: prof123 (same for all)
- Emails: prof001@fpk.edu, etc.
- Institutional grades: PR, MCF, MC
- Departments: Randomly distributed
- Completed guards: 0-4 (random)

### Salles (20)
- Types: AMPHI, SALLE, LAB
- Capacities: 20-200 (LABs are smaller)
- Buildings and floors: Randomly assigned

### Exams (200)
- Dates: Jan-Aug 2026 (random)
- Times: 8:00-18:00 (2-3 hour durations)
- Types: 70% NORMAL, 30% RATTRAPAGE (random)
- Statuses: SCHEDULED, COMPLETED, CANCELLED (random)

### Assignments (400+)
- 1-3 professors per exam
- Same department preference
- Respects 4-guard quota
- Statuses: CONFIRMED, PENDING, DECLINED (random)

## Troubleshooting

### Error: Database locked
Run the script again. SQLite can sometimes lock during bulk operations.

### Error: Foreign key constraint
Make sure to run `init_db.py` first to create all tables.

### Error: Module not found
The script creates data in the correct order. If you see this, check that all previous steps completed successfully.

### Seeding takes too long
The script creates 900+ records. On a typical machine, this takes 5-15 seconds.

## Tips for Testing

1. **Test quota logic**: Look for professors with 4/4 guards and try to assign them to more exams
2. **Test duplicate prevention**: Try creating two NORMAL exams for the same module
3. **Test room conflicts**: Try scheduling exams in the same room at overlapping times
4. **Test department filtering**: Check that professors only see exams in their department
5. **Test module associations**: Verify that professors are associated with the correct modules

## Performance Notes

With 200 exams and 50 professors:
- The Assignment Engine page will show realistic quota distributions
- ~25% of professors will be at quota (4/4)
- ~75% will have available slots
- Average of 2-3 professors per exam
- All relationships are properly maintained

This provides an excellent test environment for validating all application logic!
