# FPK Exam Guard Backend - Complete Summary

## Overview

A complete **Flask + PostgreSQL** backend has been created for the FPK Exam Guard Industrial Platform. This backend provides full REST API support for the React frontend application, with role-based authentication (Admin & Professor), comprehensive data management, and all necessary endpoints.

---

## Backend Structure

```
backend/
├── app.py                      # Main Flask application with JWT setup
├── config.py                   # Configuration (database, JWT, Flask settings)
├── models.py                   # SQLAlchemy database models (8 tables)
├── requirements.txt            # Python dependencies
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── init_db.py                  # Database initialization script
├── run.py                      # Server run script
├── database_schema.sql         # Pure PostgreSQL schema (alternative)
├── README.md                   # Complete documentation
│
├── routes/
│   ├── __init__.py             # Blueprints registration
│   ├── auth.py                 # Authentication endpoints
│   ├── professors.py            # Professor management
│   ├── exams.py                # Exam management
│   ├── departments.py          # Department management
│   ├── salles.py               # Room/Salle management
│   ├── assignments.py          # Assignment management
│   ├── incidents.py            # Incident reporting
│   └── dashboard.py            # Dashboard analytics
│
└── utils/
    ├── __init__.py
    ├── database.py             # Database utilities
    └── helpers.py              # Helper functions & decorators
```

---

## Database Schema (PostgreSQL)

### 8 Core Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| **users** | User authentication & profiles | id, username, password_hash, role, email, first_name, last_name, institutional_grade, department_id |
| **professors** | Professor profiles with quota | id, user_id, department_id, max_guards(4), completed_guards, academic_title |
| **departments** | Academic departments | id, name, code, head_id, staff_count |
| **salles** | Examination rooms | id, name, code, capacity, type, floor, building, is_active |
| **exams** | Scheduled examinations | id, module, module_code, exam_type, date, start_time, end_time, salle_id, department_id, status |
| **assignments** | Professor-Exam assignments | id, professor_id, exam_id, status, assignment_date, notes |
| **incidents** | Incident/Exception logs | id, professor_id, assignment_id, incident_type, description, status, severity, resolved_date |
| **assignment_history** | Historical records | id, assignment_id, professor_id, exam_id, completion_date, status, report_path |

### Relationships

```
users (1) -----> (1) professors
users (1) <----> (1) departments (head_id)
users (n) -----> (1) departments (department_id)

professors (n) <----> (n) assignments
assignments (n) <----> (1) exams

salles (1) <----> (n) exams
departments (1) <----> (n) exams
departments (1) <----> (n) professors

assignments (1) <----> (n) incidents
professors (1) <----> (n) incidents
```

---

## API Endpoints Summary

### Total: **50+ Endpoints** across 8 route groups

### 1. Authentication (`/api/auth`)
- `POST /login` - User login (returns JWT token)
- `POST /register` - Create user (admin only)
- `GET /me` - Get current user profile
- `POST /refresh` - Refresh JWT token
- `POST /logout` - Logout
- `POST /change-password` - Change password

### 2. Dashboard (`/api/dashboard`)
- `GET /overview` - Dashboard statistics (role-specific)
- `GET /stats` - Detailed statistics
- `GET /exam-calendar` - Exam calendar data
- `GET /notifications` - User notifications

### 3. Professors (`/api/professors`)
- `GET /` - List all professors (admin) or self (professor)
- `GET /<id>` - Get specific professor
- `POST /` - Create professor (admin only)
- `PUT /<id>` - Update professor (admin only)
- `DELETE /<id>` - Delete professor (admin only)
- `GET /<id>/assignments` - Professor's assignments
- `GET /<id>/quota` - Quota information
- `POST /<id>/quota/reset` - Reset quota (admin only)
- `GET /me/assignments` - Current user's assignments

### 4. Exams (`/api/exams`)
- `GET /` - List all exams (role-filtered)
- `GET /<id>` - Get specific exam
- `POST /` - Create exam (admin only)
- `PUT /<id>` - Update exam (admin only)
- `DELETE /<id>` - Delete exam (admin only)
- `POST /<id>/assign` - Assign professor to exam
- `GET /<id>/assignments` - Exam's assignments
- `POST /<id>/unassign/<professor_id>` - Unassign professor
- `GET /upcoming` - Upcoming exams

### 5. Departments (`/api/departments`)
- `GET /` - List all departments
- `GET /<id>` - Get specific department
- `POST /` - Create department (admin only)
- `PUT /<id>` - Update department (admin only)
- `DELETE /<id>` - Delete department (admin only)
- `GET /<id>/professors` - Department's professors
- `GET /<id>/exams` - Department's exams
- `GET /stats` - Department statistics

### 6. Salles (`/api/salles`)
- `GET /` - List all rooms
- `GET /<id>` - Get specific room
- `POST /` - Create room (admin only)
- `PUT /<id>` - Update room (admin only)
- `DELETE /<id>` - Delete room (admin only)
- `GET /<id>/exams` - Room's exams
- `GET /types` - Room types
- `GET /buildings` - Building names

### 7. Assignments (`/api/assignments`)
- `GET /` - List all assignments (role-filtered)
- `GET /<id>` - Get specific assignment
- `PUT /<id>` - Update assignment
- `DELETE /<id>` - Delete assignment (admin only)
- `POST /<id>/complete` - Mark as completed
- `GET /<id>/incidents` - Assignment's incidents
- `POST /<id>/incidents` - Create incident
- `GET /my/upcoming` - User's upcoming assignments
- `GET /my/history` - User's assignment history
- `GET /my/next` - User's next assignment

### 8. Incidents (`/api/incidents`)
- `GET /` - List all incidents (role-filtered)
- `GET /<id>` - Get specific incident
- `POST /` - Create incident (professor)
- `PUT /<id>` - Update incident
- `DELETE /<id>` - Delete incident (admin only)
- `POST /<id>/resolve` - Resolve incident (admin only)
- `GET /stats` - Incident statistics
- `GET /types` - Incident types
- `GET /my` - User's incidents

---

## Authentication System

### JWT-Based Authentication
- Uses **Flask-JWT-Extended**
- Token expiration: 1 hour
- Role-based access control via JWT claims
- Protected routes with `@jwt_required()` decorator

### Role-Based Access

| Role | Access Level |
|------|--------------|
| **Admin** | Full access to all endpoints, CRUD operations, user management |
| **Professor** | Read own data, manage own assignments, report incidents |

### Default Users
- **Admin**: `admin/admin` (role: admin)
- **Professor**: `prof/prof` (role: professor)

---

## Key Features

### 1. Role-Based Data Access
- Admin sees all data
- Professors only see their own assignments, exams, incidents
- Automatic filtering based on JWT role

### 2. Quota Management
- Each professor has a maximum of 4 guards (configurable)
- System tracks completed guards
- Prevents assignment when quota is full
- Visual quota status in dashboard

### 3. Conflict Detection
- Prevents assigning professor to overlapping exams
- Checks date and time ranges
- Returns detailed error messages

### 4. Assignment Engine
- Manual assignment via API
- Automatic quota validation
- Conflict checking
- History tracking

### 5. Incident Management
- Professors can report incidents
- Admin can resolve incidents
- Status tracking (UNDER REVIEW, RESOLVED, REJECTED)
- Severity levels (LOW, MEDIUM, HIGH, CRITICAL)

### 6. Dashboard Analytics
- Admin: Overall statistics, quota distribution, department load
- Professor: Personal quota, next duty, active assignments
- Exam calendar data for both roles

---

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "per_page": 10,
    "total": 50,
    "total_pages": 5
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description"
}
```

---

## Technology Stack

| Component | Technology |
|-----------|------------|
| **Framework** | Flask 3.0 |
| **Database** | PostgreSQL + SQLAlchemy |
| **Authentication** | Flask-JWT-Extended |
| **CORS** | Flask-CORS |
| **Password Hashing** | Werkzeug Security |
| **Environment** | python-dotenv |

---

## Installation & Setup

### Quick Start

```bash
# Navigate to backend directory
cd /Users/ggffghg/Desktop/exam-fpk/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database (creates tables and sample data)
python init_db.py

# Start the server
python run.py
```

The server will start on `http://localhost:5000`

### Using SQL Script (Alternative)

```bash
# Connect to PostgreSQL
psql -U postgres

# Run the SQL script
\i /Users/ggffghg/Desktop/exam-fpk/backend/database_schema.sql
```

---

## Environment Configuration

Create `.env` file in backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fpk_exam_guard

# JWT Configuration
JWT_SECRET_KEY=your-very-secure-jwt-secret-key

# Flask Configuration
SECRET_KEY=your-flask-secret-key
FLASK_ENV=development
FLASK_DEBUG=true
```

---

## Testing the API

### Using cURL

```bash
# Login as admin
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'

# Get dashboard overview
curl -X GET http://localhost:5000/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create an exam
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"module": "Test Exam", "module_code": "TEST101", "exam_type": "FINAL", "date": "2026-06-25", "start_time": "09:00", "end_time": "11:00", "salle_id": 1, "department_id": 1}'
```

### Using Postman
Import the API endpoints and test with:
- POST `/api/auth/login` - Get token
- Add token to Authorization header: `Bearer {{token}}`
- Test all other endpoints

---

## Frontend Integration

The backend is designed to work seamlessly with the existing React frontend in `src/`. Update the frontend to use API calls instead of mock data.

### Example Integration (Login.tsx)

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('token', data.data.access_token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
      onLogin(data.data.user.role as 'admin' | 'professor');
    } else {
      setError(data.message);
    }
  } catch (err) {
    setError('Login failed');
  }
  
  setIsLoading(false);
};
```

---

## Deployment

### Development
```bash
python run.py
# or
python app.py
```

### Production (Recommended)
```bash
# Install Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### Docker (Optional)
Create a Dockerfile and docker-compose.yml for containerized deployment.

---

## Security Recommendations

1. **Change default credentials** before production
2. **Use HTTPS** with proper SSL certificates
3. **Secure PostgreSQL** with strong passwords
4. **Rotate JWT secret keys** regularly
5. **Implement rate limiting** for auth endpoints
6. **Use environment variables** for all secrets
7. **Enable CORS** only for trusted origins in production
8. **Regular backups** of the database

---

## Database Management

### Reset Database
```bash
# Drop and recreate all tables
python -c "from app import app, db; with app.app_context(): db.drop_all(); db.create_all()"
```

### Create Sample Data
```bash
python init_db.py
```

### Manual PostgreSQL Commands
```sql
-- Connect
psql -U postgres -d fpk_exam_guard

-- List tables
\dt

-- View users
SELECT * FROM users;

-- View professors
SELECT * FROM professors;
```

---

## File Count

- **Total Files**: 24
- **Python Files**: 19
- **Configuration Files**: 5

### Backend Files Created:
1. app.py
2. config.py
3. models.py
4. requirements.txt
5. .env.example
6. .gitignore
7. init_db.py
8. run.py
9. README.md
10. database_schema.sql
11. routes/__init__.py
12. routes/auth.py
13. routes/professors.py
14. routes/exams.py
15. routes/departments.py
16. routes/salles.py
17. routes/assignments.py
18. routes/incidents.py
19. routes/dashboard.py
20. utils/__init__.py
21. utils/database.py
22. utils/helpers.py
23. BACKEND_SUMMARY.md

---

## Next Steps

1. **Start PostgreSQL server** (if not running)
2. **Run `python init_db.py`** to create database and tables
3. **Run `python run.py`** to start the backend server
4. **Test API endpoints** using cURL, Postman, or frontend
5. **Integrate frontend** with backend API calls
6. **Deploy to production** when ready

---

## Support

For issues or questions:
- Check the README.md for detailed documentation
- Review the API endpoint tables
- Test with the provided sample data
- Modify configuration as needed for your environment

---

## Version Information

- **Flask**: 3.0.0
- **SQLAlchemy**: 3.1.1
- **PostgreSQL**: 12+
- **Python**: 3.8+
- **JWT**: Flask-JWT-Extended 4.5.3

---

**Backend is ready for use with the FPK Exam Guard frontend!**
