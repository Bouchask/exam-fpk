# FPK Exam Guard Management System

## Project Overview

**FPK Exam Guard** is a comprehensive web-based examination management system developed for the Faculty of Sciences and Techniques of Khouribga (FST Khouribga / FPK). This system automates and streamlines the process of assigning professors as exam guards, managing examination schedules, tracking assignments, and handling incident reports.

### Author Information

**Yahya Bouchak**
- **Role:** Master Student in Information Systems and Artificial Intelligence (SIIA)
- **Institution:** Faculty of Sciences and Techniques, Khouribga (FPK - Universite Sultan Moulay Slimane)
- **Specialization:** Information Systems and Artificial Intelligence
- **Project:** Master's Thesis - Exam Guard Assignment System

---

## Table of Contents

1. [Features](#features)
2. [Technologies](#technologies)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Frontend Components](#frontend-components)
7. [Setup and Installation](#setup-and-installation)
8. [Usage](#usage)
9. [Configuration](#configuration)
10. [Security](#security)
11. [Future Enhancements](#future-enhancements)
12. [Acknowledgments](#acknowledgments)

---

## Features

### Core Functionality

1. **User Authentication & Authorization**
   - Role-based access control (Admin, Professor)
   - Secure login with JWT tokens
   - Password management

2. **Professor Management**
   - Add, edit, and delete professor profiles
   - Track professor quotas for exam guard assignments
   - View professor statistics and assignment history

3. **Department Management**
   - Create and manage academic departments
   - Assign department heads
   - Track department statistics

4. **Filiere (Field of Study) Management**
   - Manage academic programs/fields
   - Associate modules with filieres
   - Track filiere progress

5. **Module Management**
   - Add and manage course modules
   - Assign professors to modules
   - Track module credits and hours

6. **Salle (Room) Management**
   - Manage examination rooms
   - Track room capacity and type
   - View room availability

7. **Exam Management**
   - Create and schedule examinations
   - Assign exam types (Normal, Rattrapage)
   - Manage exam rooms and schedules
   - Track exam status

8. **Assignment Engine**
   - Automatic professor assignment to exams
   - Smart assignment algorithms considering:
     - Department alignment
     - Quota availability
     - Schedule conflicts
     - Workload distribution
   - Manual override capabilities

9. **Incident Management**
   - Report examination incidents
   - Track incident status (Reported, Under Review, Resolved)
   - Categorize incidents by type and severity
   - Document resolution notes

10. **Dashboard & Analytics**
    - Real-time statistics
    - Visual data representations
    - Department-wise analysis
    - Quota distribution charts
    - Assignment history tracking

---

## Technologies

### Frontend

- **Framework:** React 18 + TypeScript + Vite
- **UI Library:** Custom components with Tailwind CSS
- **State Management:** React Context API
- **Data Visualization:** Recharts
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Build Tool:** Vite

### Backend

- **Framework:** Flask (Python)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy
- **Authentication:** JWT (Flask-JWT-Extended)
- **API:** RESTful endpoints
- **Password Hashing:** Werkzeug Security

### Database

- **Primary:** PostgreSQL
- **Connection:** SQLAlchemy ORM
- **Migration:** Flask-Migrate

### DevOps & Tools

- **Version Control:** Git + GitHub
- **Package Management:** npm / pip
- **Code Quality:** ESLint, TypeScript
- **Formatting:** Prettier (via ESLint)

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Frontend)                           │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   React + TSX   │  │   Vite Build    │  │   Recharts       │  │
│  │   Components     │  │   System        │  │   Charts         │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    API Calls (axios)                           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Backend)                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   Flask API      │  │   JWT Auth       │  │  PostgreSQL      │  │
│  │   Endpoints      │  │   Token Mgmt     │  │  Database        │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    SQLAlchemy ORM                             ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Entity-Relationship Diagram (Conceptual)

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Professor    │       │   Department    │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ PK id           │───┐   │ PK id           │       │ PK id           │
│    username     │   │   │ FK user_id      │◄──────│    name         │
│    email        │   │   │    name         │       │    code         │
│    password     │   │   │ FK department_id│───────┤    head_id      │
│    first_name   │   │   │    department   │       │    head_name    │
│    last_name    │   │   │    max_guards   │       │    staff_count  │
│    role         │   │   │    completed_   │       │    created_at   │
│    institutional│   │   │       guards   │       └─────────────────┘
│    grade        │   │   │    quota_status │                │
│    is_active    │   │   │    quota_pct    │                │
│    created_at   │   │   └─────────────────┘                │
└─────────────────┘   │          │                          │
         │            │          │                          │
         │            └──────────┼──────────────────────┘
         │                       ▼
         │            ┌─────────────────┐
         │            │   Assignment     │
         │            ├─────────────────┤
         │            │ PK id           │
         │            │ FK professor_id  │◄──────────────────────┐
         │            │ FK exam_id       │                       │
         │            │    status       │                       │
         │            │    assignment    │                       │
         │            │       _date     │                       │
         │            └─────────────────┘                       │
         │                     │                              │
         │                     ▼                              │
         │            ┌─────────────────┐                       │
         │            │     Exam        │                       │
         │            ├─────────────────┤                       │
         │            │ PK id           │                       │
         │            │ FK module_id    │───────────────────┐  │
         │            │ FK salle_id     │───────────────┐   │  │
         │            │ FK department_id│──────────┘   │  │  │
         │            │    exam_type    │                   │  │  │
         │            │    date         │                   │  │  │
         │            │    start_time   │                   │  │  │
         │            │    end_time     │                   │  │  │
         │            │    duration     │                   │  │  │
         │            │    academic_    │                   │  │  │
         │            │       year      │                   │  │  │
         │            │    semester     │                   │  │  │
         │            │    status       │                   │  │  │
         │            └─────────────────┘                   │  │  │
         │                                                     │  │
         │            ┌─────────────────┐                    ┌──┴──┴─────────────────┐
         │            │    Module       │                    │        Salle        │
         │            ├─────────────────┤                    ├─────────────────┤
         │            │ PK id           │                    │ PK id           │
         │            │    name         │                    │    name         │
         │            │    code         │                    │    code         │
         │            │ FK filier_id    │◄─────────────────┐ │    capacity     │
         │            │    credits      │                   │ │    type         │
         │            │    hours        │                   │ │    floor        │
         │            │    description  │                   │ │    building     │
         │            └─────────────────┘                   │ └─────────────────┘
         │                                                     │
         │            ┌─────────────────┐                    ┌──┴─────────────────┐
         │            │    Filier       │                    │     Incident       │
         │            ├─────────────────┤                    ├─────────────────┤
         │            │ PK id           │                    │ PK id           │
         │            │    name         │                    │ FK professor_id  │
         │            │    code         │                    │ FK assignment_id │
         │            │ FK department_id│───────────────────┘ │    incident_type │
         │            │    max_modules  │                      │    description  │
         │            └─────────────────┘                      │    status       │
         │                                                  │    severity     │
         └─────────────────────────────────────────────────┴─────────────────┘
```

### Database Tables

#### 1. users
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    full_name VARCHAR(101) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'professor')),
    institutional_grade VARCHAR(50),
    department_id INTEGER REFERENCES departments(id),
    digital_signature TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. professors
```sql
CREATE TABLE professors (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE REFERENCES users(id),
    name VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    department VARCHAR(100),
    max_guards INTEGER DEFAULT 4,
    completed_guards INTEGER DEFAULT 0,
    quota_status VARCHAR(20) DEFAULT '0/4',
    quota_percentage INTEGER DEFAULT 0,
    is_quota_full BOOLEAN DEFAULT FALSE,
    academic_title VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. departments
```sql
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    head_id INTEGER REFERENCES users(id),
    head_name VARCHAR(100),
    staff_count INTEGER DEFAULT 0,
    code VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. filieres
```sql
CREATE TABLE filieres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    department_id INTEGER REFERENCES departments(id),
    department_name VARCHAR(100),
    max_modules INTEGER DEFAULT 10,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    module_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. modules
```sql
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    filier_id INTEGER REFERENCES filieres(id),
    filier_name VARCHAR(100),
    professor_id INTEGER REFERENCES professors(id),
    professor_name VARCHAR(100),
    credits INTEGER,
    hours INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. salles
```sql
CREATE TABLE salles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    capacity INTEGER,
    type VARCHAR(20) CHECK (type IN ('AMPHI', 'SALLE', 'LAB')),
    floor VARCHAR(20),
    building VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. exams
```sql
CREATE TABLE exams (
    id SERIAL PRIMARY KEY,
    module_id INTEGER REFERENCES modules(id),
    module VARCHAR(100),
    module_code VARCHAR(20),
    exam_type VARCHAR(20) NOT NULL CHECK (exam_type IN ('NORMAL', 'MIDTERM', 'FINAL', 'RATTRAPAGE')),
    filier_id INTEGER REFERENCES filieres(id),
    filier VARCHAR(100),
    date DATE NOT NULL,
    time VARCHAR(50),
    start_time VARCHAR(10),
    end_time VARCHAR(10),
    duration_minutes INTEGER,
    salle_id INTEGER REFERENCES salles(id),
    salle VARCHAR(100),
    department_id INTEGER REFERENCES departments(id),
    department VARCHAR(100),
    academic_year VARCHAR(20) DEFAULT '2025-2026',
    semester VARCHAR(10) DEFAULT 'S2',
    status VARCHAR(20) DEFAULT 'SCHEDULED',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    guards_count INTEGER DEFAULT 0
);
```

#### 8. assignments
```sql
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER REFERENCES professors(id) NOT NULL,
    professor VARCHAR(100),
    professor_department VARCHAR(100),
    exam_id INTEGER REFERENCES exams(id) NOT NULL,
    exam_module VARCHAR(100),
    exam_date DATE,
    exam_time VARCHAR(50),
    exam_room VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'CONFIRMED', 'DECLINED', 'COMPLETED')),
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 9. incidents
```sql
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    professor_id INTEGER REFERENCES professors(id),
    professor VARCHAR(100),
    assignment_id INTEGER REFERENCES assignments(id),
    incident_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'REPORTED' CHECK (status IN ('REPORTED', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED')),
    reported_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_date TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id),
    resolution_notes TEXT,
    severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    related_exam_id INTEGER REFERENCES exams(id),
    related_exam VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 10. assignment_history
```sql
CREATE TABLE assignment_history (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id),
    professor_id INTEGER REFERENCES professors(id),
    professor VARCHAR(100),
    exam_id INTEGER REFERENCES exams(id),
    exam_module VARCHAR(100),
    exam_date DATE,
    exam_type VARCHAR(20),
    completion_date TIMESTAMP,
    status VARCHAR(20) NOT NULL,
    report_path VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/register` | Register new user (Admin only) | Yes |
| POST | `/api/auth/logout` | User logout | Yes |
| POST | `/api/auth/refresh` | Refresh JWT token | Yes |
| POST | `/api/auth/change-password` | Change user password | Yes |

### Professors

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/professors` | Get all professors | Yes |
| GET | `/api/professors/:id` | Get professor by ID | Yes |
| POST | `/api/professors` | Create new professor | Yes (Admin) |
| PUT | `/api/professors/:id` | Update professor | Yes (Admin) |
| DELETE | `/api/professors/:id` | Delete professor | Yes (Admin) |
| GET | `/api/professors/my/stats` | Get current professor stats | Yes |
| GET | `/api/professors/my/assignments` | Get current professor assignments | Yes |

### Departments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/departments` | Get all departments | Yes |
| GET | `/api/departments/:id` | Get department by ID | Yes |
| POST | `/api/departments` | Create new department | Yes (Admin) |
| PUT | `/api/departments/:id` | Update department | Yes (Admin) |
| DELETE | `/api/departments/:id` | Delete department | Yes (Admin) |

### Filieres

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/filieres` | Get all filieres | Yes |
| GET | `/api/filieres/:id` | Get filiere by ID | Yes |
| POST | `/api/filieres` | Create new filiere | Yes (Admin) |
| PUT | `/api/filieres/:id` | Update filiere | Yes (Admin) |
| DELETE | `/api/filieres/:id` | Delete filiere | Yes (Admin) |

### Modules

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/modules` | Get all modules | Yes |
| GET | `/api/modules/:id` | Get module by ID | Yes |
| POST | `/api/modules` | Create new module | Yes (Admin) |
| PUT | `/api/modules/:id` | Update module | Yes (Admin) |
| DELETE | `/api/modules/:id` | Delete module | Yes (Admin) |
| GET | `/api/modules/filier/:filier_id` | Get modules by filiere | Yes |

### Salles (Rooms)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/salles` | Get all salles | Yes |
| GET | `/api/salles/:id` | Get salle by ID | Yes |
| POST | `/api/salles` | Create new salle | Yes (Admin) |
| PUT | `/api/salles/:id` | Update salle | Yes (Admin) |
| DELETE | `/api/salles/:id` | Delete salle | Yes (Admin) |

### Exams

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/exams` | Get all exams | Yes |
| GET | `/api/exams/:id` | Get exam by ID | Yes |
| POST | `/api/exams` | Create new exam | Yes (Admin) |
| PUT | `/api/exams/:id` | Update exam | Yes (Admin) |
| DELETE | `/api/exams/:id` | Delete exam | Yes (Admin) |
| GET | `/api/exams/upcoming` | Get upcoming exams | Yes |
| GET | `/api/exams/module/:module_id` | Get exams by module | Yes |
| GET | `/api/exams/department/:dept_id` | Get exams by department | Yes |
| GET | `/api/exams/date/:date` | Get exams by date | Yes |

### Assignments

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/assignments` | Get all assignments | Yes |
| GET | `/api/assignments/:id` | Get assignment by ID | Yes |
| POST | `/api/assignments` | Create new assignment | Yes (Admin) |
| PUT | `/api/assignments/:id` | Update assignment | Yes (Admin) |
| DELETE | `/api/assignments/:id` | Delete assignment | Yes (Admin) |
| POST | `/api/assignments/:id/complete` | Mark assignment as completed | Yes |
| GET | `/api/assignments/my/upcoming` | Get current user's upcoming assignments | Yes |
| GET | `/api/assignments/my/history` | Get current user's assignment history | Yes |
| GET | `/api/assignments/my/next` | Get current user's next assignment | Yes |
| GET | `/api/assignments/professor/:professor_id` | Get assignments by professor | Yes |
| GET | `/api/assignments/exam/:exam_id` | Get assignments by exam | Yes |

### Incidents

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/incidents` | Get all incidents | Yes (Admin) |
| GET | `/api/incidents/:id` | Get incident by ID | Yes |
| POST | `/api/incidents` | Report new incident | Yes |
| PUT | `/api/incidents/:id` | Update incident | Yes (Admin) |
| DELETE | `/api/incidents/:id` | Delete incident | Yes (Admin) |
| POST | `/api/incidents/:id/resolve` | Resolve incident | Yes (Admin) |
| GET | `/api/incidents/my` | Get current user's incidents | Yes |
| GET | `/api/incidents/professor/:professor_id` | Get incidents by professor | Yes |
| GET | `/api/incidents/status/:status` | Get incidents by status | Yes |

### Dashboard

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/dashboard/overview` | Get dashboard overview | Yes |
| GET | `/api/dashboard/stats` | Get admin statistics | Yes (Admin) |
| GET | `/api/dashboard/calendar` | Get exam calendar events | Yes |
| GET | `/api/dashboard/exam-calendar` | Get calendar with date range | Yes |

### Assignment Engine (Smart Assignment)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/assign/auto` | Auto-assign professors to exams | Yes (Admin) |
| POST | `/api/assign/auto/exam/:exam_id` | Auto-assign to specific exam | Yes (Admin) |
| POST | `/api/assign/smart` | Smart assignment with algorithms | Yes (Admin) |

---

## Frontend Components

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Top Navigation Bar                            │
│  [Logo] | [Navigation Links] | [User Menu] | [Notifications]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐ │
│  │                 │  │                                     │ │
│  │   SIDEBAR       │  │         MAIN CONTENT                │ │
│  │   Navigation    │  │                                     │ │
│  │                 │  │  - Dashboard View                  │ │
│  │  • Dashboard    │  │  - Professor Management            │ │
│  │  • Professors   │  │  - Exam Management                 │ │
│  │  • Exams        │  │  - Assignment Engine                │ │
│  │  • Departments  │  │  - Module/Filier Management          │ │
│  │  • Salles       │  │  - Incident Reports                │ │
│  │  • Settings     │  │  - Statistics & Analytics           │ │
│  │                 │  │                                     │ │
│  └─────────────────┘  └─────────────────────────────────────┘ │
│                                                                     │
├─────────────────────────────────────────────────────────────────┤
│                    Footer (if applicable)                         │
└─────────────────────────────────────────────────────────────────┘
```

### Key Component Files

- **`src/main.tsx`**: Application entry point
- **`src/App.tsx`**: Main app router
- **`src/contexts/AuthContext.tsx`**: Authentication context provider
- **`src/components/layout/`**: Layout components (Sidebar, Topbar)
- **`src/components/ui/`**: UI components (Modal, DataTable, buttons, etc.)
- **`src/views/`**: Page views
  - `AdminDashboard.tsx`: Main admin dashboard
  - `ProfessorPortal.tsx`: Professor dashboard
  - `AssignmentEngine.tsx`: Smart assignment interface
  - `FilierModuleManagement.tsx`: Module and filiere management
  - `Login.tsx`: Authentication page
- **`src/services/`**: API service layers
  - `api.ts`: Base API configuration
  - `authService.ts`: Authentication services
  - `professorService.ts`, `examService.ts`, etc.: Entity-specific services
- **`src/types/index.ts`**: TypeScript type definitions
- **`src/hooks/`**: Custom React hooks
- **`src/utils/`**: Utility functions

---

## Setup and Installation

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- PostgreSQL 14+ (for database)
- npm / pip package managers

### Frontend Setup

```bash
# Navigate to project directory
cd /path/to/exam-fpk

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env file with your configuration
nano .env

# Run development server
npm run dev

# Or build for production
npm run build
```

### Backend Setup

```bash
# Navigate to backend directory
cd /path/to/exam-fpk/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy configuration file
cp .env.example .env

# Edit .env file with your configuration
nano .env

# Initialize database
flask db init
flask db migrate
flask db upgrade

# Seed database (optional)
flask seed

# Run development server
flask run
```

### Environment Variables

#### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5006/api
VITE_APP_NAME=FPK Exam Guard
```

#### Backend (.env)

```bash
FLASK_APP=app.py
FLASK_ENV=development
FLASK_SECRET_KEY=your-secret-key-here
DATABASE_URL=postgresql://username:password@localhost:5432/fpk_exam_guard
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ACCESS_TOKEN_EXPIRES=3600  # 1 hour in seconds
```

---

## Usage

### Accessing the Application

1. Start the backend server:
   ```bash
   cd backend
   flask run
   ```
   The backend will run on `http://localhost:5006`

2. Start the frontend server:
   ```bash
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

### Default Credentials

| Username | Password | Role |
|----------|----------|------|
| admin | admin | Admin |
| prof | prof | Professor |

### User Roles

#### Admin
- Full access to all features
- Can manage professors, departments, filieres, modules, salles, exams
- Can view and edit all assignments
- Can access the Assignment Engine
- Can view all incidents and statistics

#### Professor
- Can view their own assignments
- Can mark assignments as completed
- Can report incidents
- Can view their own statistics
- Limited access to exam information

---

## Configuration

### Database Configuration

The system uses PostgreSQL with SQLAlchemy ORM. Configure the connection in `backend/.env`:

```bash
DATABASE_URL=postgresql://username:password@host:port/database_name
```

### JWT Configuration

Configure JWT token settings in `backend/.env`:

```bash
JWT_SECRET_KEY=your-very-secure-random-key
JWT_ACCESS_TOKEN_EXPIRES=3600
JWT_REFRESH_TOKEN_EXPIRES=86400
```

### Quota System Configuration

The default professor quota is 4 exam guards per semester. This can be configured:

- Globally in the backend configuration
- Per professor in the professor profile

---

## Security

### Authentication
- JWT-based authentication
- Secure password hashing with Werkzeug
- Role-based access control
- Token expiration and refresh mechanism

### Data Protection
- All API endpoints protected with JWT
- Sensitive data encrypted
- Input validation on all endpoints
- CSRF protection (via JWT)

### Best Practices
1. Always use HTTPS in production
2. Rotate JWT secrets regularly
3. Use strong database passwords
4. Keep dependencies updated
5. Implement proper backup procedures

---

## Assignment Algorithm

The smart assignment engine uses the following criteria (in order of priority):

1. **Department Alignment**: Prefer professors from the same department as the exam
2. **Quota Availability**: Only assign to professors who haven't reached their quota
3. **No Schedule Conflicts**: Avoid professors already assigned to exams at the same time
4. **Workload Distribution**: Distribute assignments evenly among available professors
5. **Historical Preference**: Consider professors who have previously taught the module

---

## Future Enhancements

### Planned Features

1. **Mobile Application**
   - Native mobile app for professors to view assignments
   - Push notifications for new assignments

2. **Advanced Analytics**
   - Predictive analytics for exam scheduling
   - Machine learning for optimal professor assignment

3. **Integration**
   - Integration with university student information system
   - Calendar synchronization with Google Calendar

4. **Notifications**
   - Email notifications for new assignments
   - SMS alerts for upcoming exams
   - In-app notifications

5. **Reporting**
   - Custom report generation
   - PDF/Excel export capabilities
   - Automated report scheduling

6. **Multi-language Support**
   - Arabic and French language support
   - RTL layout support

### Technical Improvements

1. Implement Redis for caching
2. Add rate limiting
3. Implement API versioning
4. Add comprehensive logging
5. Docker containerization
6. CI/CD pipeline

---

## Project Structure

```
exam-fpk/
├── backend/                          # Backend (Flask)
│   ├── app.py                        # Main application file
│   ├── config.py                     # Configuration
│   ├── models.py                     # Database models
│   ├── routes/                       # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── professors.py
│   │   ├── exams.py
│   │   ├── assignments.py
│   │   └── ...
│   ├── services/                     # Business logic
│   ├── utils/                        # Utility functions
│   ├── migrations/                   # Database migrations
│   ├── requirements.txt              # Python dependencies
│   └── .env.example                 # Environment template
│
├── src/                             # Frontend (React)
│   ├── main.tsx                     # Entry point
│   ├── App.tsx                      # Main app
│   ├── components/                  # React components
│   │   ├── layout/                  # Layout components
│   │   │   ├── Layout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   └── ui/                      # UI components
│   │       ├── DataTable.tsx
│   │       ├── Modal.tsx
│   │       └── ...
│   ├── contexts/                    # React contexts
│   │   └── AuthContext.tsx
│   ├── views/                       # Page views
│   │   ├── AdminDashboard.tsx
│   │   ├── ProfessorPortal.tsx
│   │   ├── AssignmentEngine.tsx
│   │   ├── FilierModuleManagement.tsx
│   │   └── Login.tsx
│   ├── services/                    # API services
│   │   ├── api.ts
│   │   ├── authService.ts
│   │   ├── professorService.ts
│   │   └── ...
│   ├── types/                       # TypeScript types
│   │   └── index.ts
│   ├── hooks/                       # Custom hooks
│   │   └── useApi.ts
│   ├── utils/                       # Utilities
│   │   ├── cn.ts
│   │   └── dataTransformers.ts
│   └── vite.config.ts              # Vite configuration
│
├── public/                         # Static files
│   └── index.html
│
├── .env.example                    # Frontend env template
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## Acknowledgments

This project was developed as part of the Master's thesis in Information Systems and Artificial Intelligence at the Faculty of Sciences and Techniques of Khouribga (FPK - Universite Sultan Moulay Slimane).

**Author:** Yahya Bouchak
**Academic Supervisor:** [To be updated]
**University:** Universite Sultan Moulay Slimane, Faculty of Sciences and Techniques, Khouribga
**Program:** Master SIIA (Systemes d'Information et Intelligence Artificielle)
**Year:** 2025-2026

### Special Thanks

- To the faculty and staff of FPK Khouribga for their support
- To the open-source community for the amazing tools and libraries
- To all contributors who helped in testing and feedback

---

## License

This project is proprietary software developed for academic purposes at FPK Khouribga. Unauthorized distribution or commercial use is prohibited without explicit permission from the author and the university.

---

## Contact

For questions or support, please contact:

**Yahya Bouchak**
- Email: mr.bouchakyahya@gmail.com
- GitHub: [Bouchask](https://github.com/Bouchask)
- LinkedIn: [linkedin.com/in/yahya-bouchak](https://linkedin.com/in/yahya-bouchak) 

---

*Last updated: June 2026*
*Project created: 2025*
