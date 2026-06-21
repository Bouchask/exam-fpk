# FPK Exam Guard Management System

A comprehensive web application for managing exam guards, professors, modules, and assignments for the FPK (Faculte Polydisciplinaire de Khenifra) university system.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Project Structure](#project-structure)
- [Installation and Setup](#installation-and-setup)
- [Configuration](#configuration)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Key Features Details](#key-features-details)
- [Guard Assignment Logic](#guard-assignment-logic)
- [Real-time Updates](#real-time-updates)
- [Deployment to Aiven.io](#deployment-to-aivenio)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

The FPK Exam Guard Management System is designed to automate and streamline the process of assigning professors as guards for examinations. The system ensures fair distribution of guard duties among professors while respecting constraints such as maximum guard limits and department affiliations.

The application consists of:
- **Frontend**: React-based web interface with TypeScript
- **Backend**: Flask-based REST API with Python
- **Database**: PostgreSQL for data persistence

---

## Features

### Admin Features
- User management (create, edit, delete professors and admins)
- Department management
- Filier (field of study) and module management
- Salle (room) management
- Exam scheduling and management
- Assignment engine for automatic guard assignment
- Dashboard with statistics and analytics
- Real-time monitoring of assignments

### Professor Features
- Personal dashboard showing teaching modules
- View assigned guard duties
- View exam details and schedules
- Track guard quota (maximum 4 guards per professor)
- Change email and password
- Real-time updates of assignments

### System Features
- JWT-based authentication
- Role-based access control
- Real-time data synchronization
- Responsive design
- Error handling and validation
- Mock data fallback for development

---

## Technologies Used

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client
- **React Router** - Hash-based routing

### Backend
- **Flask** - Web framework
- **Flask-JWT-Extended** - JWT authentication
- **SQLAlchemy** - ORM
- **Flask-CORS** - Cross-origin support
- **Werkzeug** - Security utilities
- **psycopg2** - PostgreSQL adapter

### Database
- **PostgreSQL** - Relational database
- **Aiven.io** - Managed PostgreSQL hosting (recommended for production)

---

## Project Structure

```
exam-fpk/
├── backend/                          # Backend server
│   ├── app.py                       # Flask application entry point
│   ├── config.py                    # Configuration settings
│   ├── models.py                    # Database models
│   ├── run.py                       # Server entry point
│   ├── routes/                      # API route definitions
│   │   ├── __init__.py              # Route registration
│   │   ├── auth.py                  # Authentication routes
│   │   ├── dashboard.py             # Dashboard routes
│   │   ├── professors.py            # Professor routes
│   │   ├── exams.py                 # Exam routes
│   │   ├── departments.py           # Department routes
│   │   ├── salles.py                # Salle routes
│   │   ├── assignments.py           # Assignment routes
│   │   ├── incidents.py             # Incident routes
│   │   ├── filieres.py              # Filier routes
│   │   └── modules.py               # Module routes
│   └── utils/                      # Utility functions
│       ├── database.py              # Database initialization
│       └── helpers.py               # Helper functions
├── src/                             # Frontend source
│   ├── views/                      # Page components
│   │   ├── AdminDashboard.tsx       # Admin dashboard
│   │   ├── AssignmentEngine.tsx     # Assignment engine
│   │   ├── FilierModuleManagement.tsx # Filier/module management
│   │   ├── Login.tsx               # Login page
│   │   └── ProfessorPortal.tsx     # Professor portal
│   ├── services/                   # API services
│   │   ├── api.ts                   # Axios API configuration
│   │   ├── authService.ts           # Authentication service
│   │   ├── dashboardService.ts      # Dashboard service
│   │   ├── professorService.ts      # Professor service
│   │   ├── examService.ts          # Exam service
│   │   ├── moduleService.ts        # Module service
│   │   ├── assignmentService.ts    # Assignment service
│   │   ├── departmentService.ts     # Department service
│   │   ├── salleService.ts         # Salle service
│   │   ├── filierService.ts        # Filier service
│   │   └── index.ts                # Service exports
│   ├── types/                      # TypeScript interfaces
│   │   └── index.ts                # All type definitions
│   ├── components/                 # Reusable components
│   │   └── ui/                     # UI components
│   ├── contexts/                   # React contexts
│   │   └── AuthContext.tsx         # Authentication context
│   ├── hooks/                      # Custom React hooks
│   ├── utils/                      # Utility functions
│   ├── App.tsx                     # Main application component
│   ├── App.css                    # Global styles
│   └── main.tsx                   # Application entry point
├── init_aiven_db.py                # Aiven.io database initialization
├── init_aiven_db_final.py          # Final Aiven.io database script
├── .env.aiven                     # Aiven.io configuration
├── package.json                   # Frontend dependencies
├── vite.config.ts                 # Vite configuration
└── tsconfig.json                  # TypeScript configuration
```

---

## Installation and Setup

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.10+ (for backend)
- PostgreSQL 14+ (for database)
- Git

### Frontend Setup

```bash
# Navigate to project directory
cd /path/to/exam-fpk

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python run.py
```

The backend will be available at `http://localhost:5006`

---

## Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the project root for the frontend and in the `backend/` directory for the backend.

#### Frontend Configuration (`src/services/api.ts`)

```env
VITE_API_URL=http://localhost:5006/api
```

#### Backend Configuration (`.env` in backend/)

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/fpk_exam_guard

# Server
PORT=5006
FLASK_HOST=0.0.0.0
FLASK_DEBUG=true

# Security
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
```

### Aiven.io Configuration

For production deployment on Aiven.io, use the provided `.env.aiven` file:

```env
# Aiven.io Database Connection
DATABASE_URL=postgres://avnadmin:[REDACTED]@exam-fpk-yahyabouaachak-c539.b.aivencloud.com:21532/defaultdb?sslmode=require

# Backend Server
PORT=5006
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production

# Frontend API
VITE_API_URL=http://localhost:5006/api
```

---

## Database Setup

### Local PostgreSQL Setup

1. Install PostgreSQL on your system
2. Create a database:
   ```bash
   createdb fpk_exam_guard
   ```
3. Update the `DATABASE_URL` in backend configuration

### Aiven.io Database Setup

1. Sign up for Aiven.io and create a PostgreSQL service
2. Note the connection URL from the Aiven console
3. Update the `.env.aiven` file with your connection details
4. Run the initialization script:
   ```bash
   python init_aiven_db_final.py
   ```

The script will:
- Test connection to Aiven.io PostgreSQL
- Create all required tables
- Insert default data (admin and professor users)
- Configure SSL connections

---

## Running the Application

### Development Mode

Run both frontend and backend servers:

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
python run.py

# Terminal 2: Start frontend
cd /path/to/exam-fpk
npm run dev
```

### Production Mode

For production, you should:
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Serve the built files with a production server
3. Run the backend with `FLASK_DEBUG=false`

---

## Authentication

The system uses JWT (JSON Web Tokens) for authentication with the following default credentials:

### Default Users

| Username | Password | Role | Description |
|----------|----------|------|-------------|
| admin | admin | admin | Administrator with full access |
| prof | prof | professor | Professor with limited access |

### Login

1. Navigate to `http://localhost:5173`
2. Enter username and password
3. Click "SIGN IN"

### Session Management

- Tokens are stored in browser localStorage
- Access token expires after 1 hour (configurable)
- Automatic token refresh is implemented
- Logout clears all session data

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/api/auth/login` | User login | No |
| GET | `/api/auth/me` | Get current user info | Yes |
| POST | `/api/auth/logout` | Logout | No |
| POST | `/api/auth/refresh` | Refresh token | Yes (refresh) |
| POST | `/api/auth/change-password` | Change password | Yes |
| PUT | `/api/auth/users/<user_id>` | Update user | Yes (admin) |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/dashboard/overview` | Dashboard statistics | Yes |
| GET | `/api/dashboard/stats` | Detailed statistics | Yes |
| GET | `/api/dashboard/exam-calendar` | Exam calendar data | Yes |
| GET | `/api/dashboard/notifications` | User notifications | Yes |

### Professors

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/professors` | List all professors | Yes |
| GET | `/api/professors/<id>` | Get professor details | Yes |
| POST | `/api/professors` | Create professor | Yes (admin) |
| PUT | `/api/professors/<id>` | Update professor | Yes (admin) |
| DELETE | `/api/professors/<id>` | Delete professor | Yes (admin) |

### Exams

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/exams` | List all exams | Yes |
| GET | `/api/exams/<id>` | Get exam details | Yes |
| POST | `/api/exams` | Create exam | Yes (admin) |
| PUT | `/api/exams/<id>` | Update exam | Yes (admin) |
| DELETE | `/api/exams/<id>` | Delete exam | Yes (admin) |
| POST | `/api/exams/<id>/assign` | Assign professor to exam | Yes |
| POST | `/api/exams/<id>/unassign/<prof_id>` | Unassign professor | Yes |
| GET | `/api/exams/module/<module_id>` | Get exams by module | Yes |
| GET | `/api/exams/upcoming` | Get upcoming exams | Yes |

### Departments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/departments` | List all departments | Yes |
| GET | `/api/departments/<id>` | Get department details | Yes |
| POST | `/api/departments` | Create department | Yes (admin) |
| PUT | `/api/departments/<id>` | Update department | Yes (admin) |

### Salles (Rooms)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/salles` | List all salles | Yes |
| POST | `/api/salles` | Create salle | Yes (admin) |
| PUT | `/api/salles/<id>` | Update salle | Yes (admin) |
| DELETE | `/api/salles/<id>` | Delete salle | Yes (admin) |

### Assignments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/assignments` | List all assignments | Yes |
| GET | `/api/assignments/professor/<prof_id>` | Get assignments by professor | Yes |
| GET | `/api/assignments/exam/<exam_id>` | Get assignments by exam | Yes |
| POST | `/api/assignments` | Create assignment | Yes |
| PUT | `/api/assignments/<id>` | Update assignment | Yes |
| DELETE | `/api/assignments/<id>` | Delete assignment | Yes |

### Filieres (Fields of Study)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/filieres` | List all filieres | Yes |
| POST | `/api/filieres` | Create filier | Yes (admin) |
| PUT | `/api/filieres/<id>` | Update filier | Yes (admin) |
| DELETE | `/api/filieres/<id>` | Delete filier | Yes (admin) |

### Modules

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/modules` | List all modules | Yes |
| GET | `/api/modules/<id>` | Get module details | Yes |
| POST | `/api/modules` | Create module | Yes (admin) |
| PUT | `/api/modules/<id>` | Update module | Yes (admin) |
| DELETE | `/api/modules/<id>` | Delete module | Yes (admin) |
| GET | `/api/modules/filier/<filier_id>` | Get modules by filier | Yes |
| GET | `/api/modules/professor/<prof_id>` | Get modules by professor | Yes |

### Incidents

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| GET | `/api/incidents` | List all incidents | Yes |
| POST | `/api/incidents` | Report incident | Yes |
| PUT | `/api/incidents/<id>` | Update incident | Yes |
| DELETE | `/api/incidents/<id>` | Delete incident | Yes |

---

## Database Schema

### Core Tables

#### users
Stores user authentication information
```sql
- id: Integer (Primary Key)
- username: String (Unique, Required)
- email: String (Unique, Required)
- password_hash: String (Required, 255 chars)
- first_name: String (Required)
- last_name: String (Required)
- full_name: String (Required)
- role: String (Required, 'admin' or 'professor')
- institutional_grade: String (Optional)
- department_id: Integer (Foreign Key to departments)
- digital_signature: String (Optional)
- is_active: Boolean (Default: true)
- created_at: Timestamp
- updated_at: Timestamp
```

#### professors
Stores professor-specific information
```sql
- id: Integer (Primary Key)
- user_id: Integer (Unique, Foreign Key to users)
- name: String (Optional)
- department_id: Integer (Foreign Key to departments)
- department: String (Optional)
- max_guards: Integer (Default: 4)
- completed_guards: Integer (Default: 0)
- quota_status: String (Default: 'ACTIVE')
- quota_percentage: Numeric (Default: 0)
- is_quota_full: Boolean (Default: false)
- academic_title: String (Optional)
- created_at: Timestamp
- updated_at: Timestamp
```

#### departments
Stores academic departments
```sql
- id: Integer (Primary Key)
- name: String (Unique, Required)
- code: String (Unique, Optional)
- head_id: Integer (Foreign Key to users)
- head_name: String (Optional)
- staff_count: Integer (Default: 0)
- created_at: Timestamp
- updated_at: Timestamp
```

#### filieres
Stores fields of study
```sql
- id: Integer (Primary Key)
- name: String (Unique, Required)
- code: String (Unique, Optional)
- department_id: Integer (Foreign Key to departments)
- department_name: String (Optional)
- max_modules: Integer (Default: 10)
- description: Text (Optional)
- is_active: Boolean (Default: true)
- module_count: Integer (Default: 0)
- created_at: Timestamp
- updated_at: Timestamp
```

#### modules
Stores course/modules information
```sql
- id: Integer (Primary Key)
- name: String (Unique, Required)
- code: String (Unique, Optional)
- filier_id: Integer (Foreign Key to filieres)
- filier_name: String (Optional)
- professor_id: Integer (Foreign Key to professors)
- professor_name: String (Optional)
- hours: Integer (Default: 45)
- description: Text (Optional)
- is_active: Boolean (Default: true)
- created_at: Timestamp
- updated_at: Timestamp
```

#### exams
Stores examination information
```sql
- id: Integer (Primary Key)
- module_id: Integer (Foreign Key to modules)
- module: String (Required)
- module_code: String (Optional)
- exam_type: String (Required, 'NORMAL' or 'RATTRAPAGE')
- filier_id: Integer (Foreign Key to filieres)
- filier: String (Optional)
- date: Date (Required)
- time: String (Optional)
- start_time: Time (Required)
- end_time: Time (Required)
- duration_minutes: Integer (Optional)
- salle_id: Integer (Foreign Key to salles)
- salle: String (Optional)
- department_id: Integer (Foreign Key to departments)
- department: String (Optional)
- academic_year: String (Default: '2025-2026')
- semester: String (Default: 'S2')
- status: String (Default: 'SCHEDULED')
- notes: Text (Optional)
- created_at: Timestamp
- updated_at: Timestamp
```

#### salles
Stores room/venue information
```sql
- id: Integer (Primary Key)
- name: String (Unique, Required)
- code: String (Unique, Required)
- capacity: Integer (Optional)
- type: String (Optional, 'AMPHI', 'SALLE', 'LAB')
- floor: String (Optional)
- building: String (Optional)
- is_active: Boolean (Default: true)
- created_at: Timestamp
- updated_at: Timestamp
```

#### assignments
Stores guard assignments
```sql
- id: Integer (Primary Key)
- professor_id: Integer (Foreign Key to professors)
- professor: String (Optional)
- professor_department: String (Optional)
- exam_id: Integer (Foreign Key to exams)
- exam_module: String (Optional)
- exam_date: String (Optional)
- exam_time: String (Optional)
- exam_room: String (Optional)
- status: String (Default: 'PENDING')
- assignment_date: Timestamp (Default: CURRENT_TIMESTAMP)
- notes: Text (Optional)
- created_at: Timestamp
- updated_at: Timestamp
```

#### incidents
Stores reported incidents
```sql
- id: Integer (Primary Key)
- professor_id: Integer (Foreign Key to professors)
- professor: String (Optional)
- assignment_id: Integer (Foreign Key to assignments)
- incident_type: String (Required)
- description: Text (Required)
- status: String (Default: 'UNDER REVIEW')
- reported_date: Timestamp (Default: CURRENT_TIMESTAMP)
- resolved_date: Timestamp (Optional)
- resolved_by: Integer (Foreign Key to users)
- resolution_notes: Text (Optional)
- severity: String (Default: 'LOW')
- related_exam_id: Integer (Foreign Key to exams)
- related_exam: String (Optional)
- created_at: Timestamp
- updated_at: Timestamp
```

#### assignment_history
Stores history of completed assignments
```sql
- id: Integer (Primary Key)
- assignment_id: Integer (Foreign Key to assignments)
- professor_id: Integer (Foreign Key to professors)
- professor: String (Optional)
- exam_id: Integer (Foreign Key to exams)
- exam_module: String (Optional)
- exam_date: String (Optional)
- exam_type: String (Optional)
- completion_date: Timestamp (Default: CURRENT_TIMESTAMP)
- status: String (Required)
- report_path: String (Optional)
- notes: Text (Optional)
- created_at: Timestamp
- updated_at: Timestamp
```

#### professor_filier
Association table for many-to-many relationship between professors and filieres
```sql
- id: Integer (Primary Key)
- professor_id: Integer (Foreign Key to professors)
- filier_id: Integer (Foreign Key to filieres)
- is_active: Boolean (Default: true)
- created_at: Timestamp
```

---

## User Roles and Permissions

### Admin
- Full access to all features
- Can create, edit, delete users, departments, filieres, modules, exams, salles
- Can assign professors to exams
- Can view and manage all assignments
- Can view dashboard statistics

### Professor
- Can view personal dashboard with teaching modules
- Can view assigned guard duties
- Can view exam details for their modules
- Can change own email and password
- Can report incidents
- Cannot access admin features

---

## Key Features Details

### Dashboard Overview

#### Admin Dashboard
- **Statistics**: Total professors, exams, salles, allocation rate
- **Quota Distribution**: Visual distribution of professors by guard completion
- **Department Exam Load**: Exam distribution across departments
- **Upcoming Exams**: Next 5 scheduled exams
- **Recent Assignments**: Last 5 assignments made

#### Professor Dashboard
- **Personal Information**: Name, department, institutional grade
- **Current Quota**: Guard assignments (X/4)
- **Modules Taught**: List of modules with expandable exam details
- **Active Guard Assignments**: List of current guard duties
- **System Status**: Connection and sync status

### Assignment Engine

The Assignment Engine is the core feature for automatically assigning professors as guards to exams. It implements the following logic:

1. **Filter Available Professors**: Only professors who haven't reached their maximum guard limit (4)
2. **Department Matching**: Prioritize professors from the same department as the exam's department
3. **Filier Matching**: Match professors teaching in the same filier as the exam's module
4. **Module Professor**: Include the professor who teaches the module (counts toward their quota)
5. **Random Selection**: Randomly select from available professors to ensure fair distribution
6. **Quota Tracking**: Automatically update professor's completed_guards count

### Module Management

- Create modules with code, name, filier, professor
- Assign professors to teach modules
- Track module hours and descriptions
- View modules by filier or professor
- Activate/deactivate modules

### Exam Management

- Schedule exams with date, time, salle, module
- Support for normal and rattrapage (makeup) exams
- Associate multiple professors with exams
- Track exam status (SCHEDULED, COMPLETED, CANCELLED)
- View exams by module, department, or date range

---

## Guard Assignment Logic

The system implements a sophisticated guard assignment algorithm:

### Rules

1. **Maximum Limit**: Each professor can have at most 4 guard assignments
2. **Department Preference**: Professors from the same department as the exam are preferred
3. **Filier Matching**: Professors teaching in the same filier are prioritized
4. **Module Professor**: The professor who teaches the module is automatically considered (if quota allows)
5. **Minimum Requirement**: At least 3 professors per exam (including module professor)
6. **Fair Distribution**: Random selection from available professors to ensure fairness

### Assignment Process

1. Get all exams that need guards
2. For each exam:
   a. Get the module's professor (primary candidate)
   b. Find professors from the same department who have quota available
   c. Find professors from the same filier who have quota available
   d. Select up to 3 additional professors randomly from available pool
   e. Verify total assignments don't exceed professor limits
   f. Create assignments in database

### Quota Management

- Each professor has `max_guards: 4`
- `completed_guards` tracks current assignments
- `quota_status` shows current state (e.g., "2/4")
- `quota_percentage` calculates completion percentage
- `is_quota_full` flag when limit reached

---

## Real-time Updates

The application implements real-time updates through polling:

- **Frontend**: ProfessorPortal.tsx polls for new data every 30 seconds
- **Backend**: All endpoints return current data from database
- **Mechanism**: Axios interceptors automatically add Authorization header with JWT token
- **Result**: Changes in database (new assignments, status updates) are reflected in UI within 30 seconds

### How It Works

1. User logs in and receives JWT token
2. Token is stored in localStorage
3. Axios interceptor adds token to all requests
4. Frontend polls backend every 30 seconds
5. Backend validates token and returns fresh data
6. UI updates automatically with new data

---

## Deployment to Aiven.io

### Step 1: Set Up Aiven.io PostgreSQL

1. Sign up for Aiven.io account
2. Create a new PostgreSQL service
3. Note the connection URL (format: `postgres://user:password@host:port/database?sslmode=require`)
4. Create a new database user with appropriate permissions

### Step 2: Configure Environment

Update `.env.aiven` file:

```env
# Aiven.io Database Connection
DATABASE_URL=postgres://avnadmin:[REDACTED]@exam-fpk-yahyabouaachak-c539.b.aivencloud.com:21532/defaultdb?sslmode=require

# Backend Server
PORT=5006
SECRET_KEY=your-strong-secret-key-change-in-production
JWT_SECRET_KEY=your-strong-jwt-secret-key-change-in-production

# Frontend API
VITE_API_URL=http://localhost:5006/api
```

### Step 3: Initialize Database

```bash
# Using the final initialization script
python init_aiven_db_final.py
```

This script:
- Tests connection to Aiven.io
- Creates all tables with proper schema
- Inserts default users (admin/admin, prof/prof)
- Configures SSL connections automatically
- Handles `postgres://` to `postgresql://` URL conversion

### Step 4: Run Application

```bash
# Terminal 1: Backend
cd backend
source venv/bin/activate
cp ../.env.aiven .env
python run.py

# Terminal 2: Frontend
cd /path/to/exam-fpk
npm run dev
```

### Step 5: Verify Deployment

1. Access `http://localhost:5173`
2. Login with admin/admin or prof/prof
3. Verify all data loads correctly
4. Check real-time updates work
5. Test guard assignment functionality

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

**Symptoms**: Backend fails to start, connection errors

**Solutions**:
- Verify DATABASE_URL is correct
- Check PostgreSQL server is running
- Test connection manually with psql or pgAdmin
- Ensure user has proper permissions
- For Aiven.io, ensure SSL mode is set to 'require'

#### Authentication Failed

**Symptoms**: Login returns 401, token not accepted

**Solutions**:
- Verify credentials are correct
- Check JWT_SECRET_KEY matches between sessions
- Clear browser localStorage and retry
- Check if token expired (1 hour default)
- Verify user is active in database

#### 422 Unprocessable Entity

**Symptoms**: API calls return 422 error

**Solutions**:
- Ensure Authorization header is sent with valid JWT token
- Check token format (should be 'Bearer <token>')
- Verify JWT_SECRET_KEY is consistent
- Clear localStorage and login again

#### Frontend Import Errors

**Symptoms**: `examService is not defined`, `professorId is not defined`

**Solutions**:
- Ensure all services are imported from `"../services"` not individual files
- Check TypeScript compilation completed successfully
- Clear browser cache and reload
- Verify all type definitions are correct

#### Real-time Updates Not Working

**Symptoms**: Changes in database not reflected in UI

**Solutions**:
- Check polling interval is active (30 seconds default)
- Verify network connectivity
- Ensure JWT token is valid and not expired
- Check browser console for errors
- Try manual refresh to verify backend is returning data

### Debugging Tips

1. **Backend Logs**: Check Flask server console for errors
2. **Frontend Console**: Open browser DevTools to see JavaScript errors
3. **Network Tab**: Inspect API calls and responses
4. **Database Logs**: Check PostgreSQL logs for query errors
5. **Token Inspection**: Use jwt.io to decode and verify JWT tokens

---

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- **Frontend**: Follow React/TypeScript best practices
- **Backend**: Follow Flask/Python best practices
- **Database**: Use SQLAlchemy ORM for all queries
- **Security**: Always use parameterized queries to prevent SQL injection
- **Error Handling**: Handle exceptions gracefully with appropriate error messages

### Testing

- Test all new features thoroughly
- Ensure existing functionality still works
- Verify edge cases and error conditions
- Test with both mock and real database

---

## License

This project is proprietary software developed for FPK (Faculte Polydisciplinaire de Khenifra).

---

## Contact

For questions or support, please contact the development team.

---

*Last updated: June 2026*
