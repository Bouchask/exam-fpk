# FPK Exam Guard Backend

A Flask-based REST API backend for the FPK Exam Guard Industrial Platform. This backend provides role-based authentication and all necessary endpoints for managing university examinations, professors, departments, and invigilation assignments.

## Features

- **Role-Based Authentication**: JWT-based authentication with `admin` and `professor` roles
- **PostgreSQL Database**: Full relational database with SQLAlchemy ORM
- **REST API**: Complete CRUD operations for all entities
- **Assignment Engine**: Automated exam-professor assignment with quota management
- **Incident Tracking**: Report and manage examination incidents
- **Dashboard Analytics**: Statistics and overview data for both roles

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## Installation

### 1. Clone the repository (if not already done)

```bash
cd /Users/ggffghg/Desktop/exam-fpk/backend
```

### 2. Create and activate virtual environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Set up PostgreSQL database

#### Option A: Use the initialization script

```bash
# Set your database credentials (optional)
export DB_NAME=fpk_exam_guard
export DB_USER=postgres
export DB_PASSWORD=postgres
export DB_HOST=localhost
export DB_PORT=5432

# Run initialization
python init_db.py
```

#### Option B: Manual setup

```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE fpk_exam_guard;

-- Create user (optional)
CREATE USER fpk_user WITH PASSWORD 'fpk_password';
GRANT ALL PRIVILEGES ON DATABASE fpk_exam_guard TO fpk_user;
```

Then configure the database connection in `.env` file:

```bash
cp .env.example .env
# Edit .env with your database credentials
```

### 5. Configure environment variables

Create a `.env` file in the backend directory:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/fpk_exam_guard

# JWT Configuration
JWT_SECRET_KEY=your-very-secure-jwt-secret-key-here

# Flask Configuration
SECRET_KEY=your-flask-secret-key-here
FLASK_ENV=development
FLASK_DEBUG=true
```

## Database Schema

The backend uses the following PostgreSQL tables:

### Core Tables
- **users**: User accounts with authentication
- **professors**: Professor profiles with quota tracking
- **departments**: Academic departments
- **salles**: Examination rooms
- **exams**: Scheduled examinations
- **assignments**: Professor-exam assignments
- **incidents**: Incident reports
- **assignment_history**: Historical assignment records

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | Register new user (admin only) |
| GET | `/api/auth/me` | Get current user info |
| POST | `/api/auth/refresh` | Refresh JWT token |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/change-password` | Change password |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/overview` | Get dashboard overview |
| GET | `/api/dashboard/stats` | Get detailed statistics |
| GET | `/api/dashboard/exam-calendar` | Get exam calendar data |
| GET | `/api/dashboard/notifications` | Get user notifications |

### Professors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/professors` | List all professors |
| GET | `/api/professors/<id>` | Get specific professor |
| POST | `/api/professors` | Create professor (admin only) |
| PUT | `/api/professors/<id>` | Update professor (admin only) |
| DELETE | `/api/professors/<id>` | Delete professor (admin only) |
| GET | `/api/professors/<id>/assignments` | Get professor's assignments |
| GET | `/api/professors/<id>/quota` | Get professor's quota info |
| POST | `/api/professors/<id>/quota/reset` | Reset professor's quota (admin only) |
| GET | `/api/professors/me/assignments` | Get current user's assignments |

### Exams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams` | List all exams |
| GET | `/api/exams/<id>` | Get specific exam |
| POST | `/api/exams` | Create exam (admin only) |
| PUT | `/api/exams/<id>` | Update exam (admin only) |
| DELETE | `/api/exams/<id>` | Delete exam (admin only) |
| POST | `/api/exams/<id>/assign` | Assign professor to exam (admin only) |
| GET | `/api/exams/<id>/assignments` | Get exam's assignments |
| POST | `/api/exams/<id>/unassign/<professor_id>` | Unassign professor (admin only) |
| GET | `/api/exams/upcoming` | Get upcoming exams |

### Departments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | List all departments |
| GET | `/api/departments/<id>` | Get specific department |
| POST | `/api/departments` | Create department (admin only) |
| PUT | `/api/departments/<id>` | Update department (admin only) |
| DELETE | `/api/departments/<id>` | Delete department (admin only) |
| GET | `/api/departments/<id>/professors` | Get department's professors |
| GET | `/api/departments/<id>/exams` | Get department's exams |
| GET | `/api/departments/stats` | Get department statistics |

### Salles (Rooms)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/salles` | List all salles |
| GET | `/api/salles/<id>` | Get specific salle |
| POST | `/api/salles` | Create salle (admin only) |
| PUT | `/api/salles/<id>` | Update salle (admin only) |
| DELETE | `/api/salles/<id>` | Delete salle (admin only) |
| GET | `/api/salles/<id>/exams` | Get salle's exams |
| GET | `/api/salles/types` | Get salle types |
| GET | `/api/salles/buildings` | Get building names |

### Assignments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assignments` | List all assignments |
| GET | `/api/assignments/<id>` | Get specific assignment |
| PUT | `/api/assignments/<id>` | Update assignment |
| DELETE | `/api/assignments/<id>` | Delete assignment (admin only) |
| POST | `/api/assignments/<id>/complete` | Mark as completed |
| GET | `/api/assignments/<id>/incidents` | Get assignment's incidents |
| POST | `/api/assignments/<id>/incidents` | Create incident |
| GET | `/api/assignments/my/upcoming` | Get user's upcoming assignments |
| GET | `/api/assignments/my/history` | Get user's assignment history |
| GET | `/api/assignments/my/next` | Get user's next assignment |

### Incidents
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List all incidents |
| GET | `/api/incidents/<id>` | Get specific incident |
| POST | `/api/incidents` | Create incident |
| PUT | `/api/incidents/<id>` | Update incident |
| DELETE | `/api/incidents/<id>` | Delete incident (admin only) |
| POST | `/api/incidents/<id>/resolve` | Resolve incident (admin only) |
| GET | `/api/incidents/stats` | Get incident statistics |
| GET | `/api/incidents/types` | Get incident types |
| GET | `/api/incidents/my` | Get user's incidents |

## Request Examples

### Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@fpk.edu",
      "full_name": "Admin System",
      "role": "admin",
      "institutional_grade": "ADMIN"
    }
  }
}
```

### Get Dashboard Overview

```bash
curl -X GET http://localhost:5000/api/dashboard/overview \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Create Exam

```bash
curl -X POST http://localhost:5000/api/exams \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "module": "Machine Learning",
    "module_code": "CS401",
    "exam_type": "FINAL",
    "date": "2026-06-25",
    "start_time": "09:00",
    "end_time": "11:00",
    "salle_id": 1,
    "department_id": 1,
    "academic_year": "2025-2026",
    "semester": "S2"
  }'
```

## Running the Server

### Development

```bash
# Using the run script
python run.py

# Or directly
python app.py

# With custom port
FLASK_PORT=8000 python app.py
```

The server will start on `http://localhost:5000` by default.

### Production

For production deployment:

```bash
# Set production environment
export FLASK_ENV=production
export FLASK_DEBUG=false

# Use a production WSGI server like Gunicorn
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

## Default Users

After database initialization, the following users are created:

- **Admin**: `admin/admin` (role: admin)
- **Professor**: `prof/prof` (role: professor)

## Testing

You can test the API using:

- **Postman**: Import the API collection
- **cURL**: Use the examples above
- **Swagger/OpenAPI**: Consider adding Flask-Swagger for API documentation

## Database Management

### Reset Database

```bash
# Delete and recreate all tables
python -c "from app import app, db; with app.app_context(): db.drop_all(); db.create_all()"
```

### Create Sample Data

```bash
python init_db.py
```

## Project Structure

```
backend/
├── app.py                 # Main Flask application
├── config.py              # Configuration settings
├── requirements.txt       # Python dependencies
├── .env.example           # Environment variables template
├── init_db.py             # Database initialization script
├── run.py                 # Server run script
├── README.md              # This file
├── models.py              # Database models
├── utils/
│   ├── __init__.py
│   ├── database.py        # Database utilities
│   └── helpers.py         # Helper functions
└── routes/
    ├── __init__.py        # Blueprints registration
    ├── auth.py            # Authentication routes
    ├── professors.py      # Professor routes
    ├── exams.py           # Exam routes
    ├── departments.py     # Department routes
    ├── salles.py          # Salle routes
    ├── assignments.py     # Assignment routes
    ├── incidents.py       # Incident routes
    └── dashboard.py       # Dashboard routes
```

## Frontend Integration

The backend is designed to work with the existing React frontend in the `src/` directory. Update the frontend to use these API endpoints instead of mock data.

### Example: Update Login Page

In `src/views/Login.tsx`, update the login function:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
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

## Security Notes

1. **Change default credentials** before production deployment
2. **Use HTTPS** in production
3. **Secure your PostgreSQL database** with strong passwords
4. **Rotate JWT secret keys** regularly
5. **Implement rate limiting** for authentication endpoints
6. **Use environment variables** for sensitive configuration

## License

This backend is part of the FPK Exam Guard Industrial Platform and is provided for educational purposes.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request
