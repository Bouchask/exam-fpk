# Aiven.io Deployment Guide

This guide will help you deploy the FPK Exam Guard application with Aiven.io PostgreSQL database.

## Prerequisites

1. An Aiven.io account with a PostgreSQL service created
2. Python 3.8+ installed
3. Node.js 18+ installed
4. npm or yarn installed

## Database Configuration

### Connection Details

Your Aiven.io PostgreSQL connection string:
```
postgres://avnadmin:[REDACTED]@exam-fpk-yahyabouaachak-c539.b.aivencloud.com:21532/defaultdb?sslmode=require
```

## Setup Instructions

### Option 1: Manual Setup (Recommended for Development)

#### 1. Create and Activate Virtual Environment

```bash
cd /Users/ggffghg/Desktop/exam-fpk

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

#### 2. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

#### 3. Install Frontend Dependencies

```bash
npm install
```

#### 4. Initialize Aiven.io Database

```bash
# Method 1: Using the initialization script
python init_aiven_db.py

# Method 2: With custom DATABASE_URL
python init_aiven_db.py "your-aiven-db-url"

# Method 3: Manually load .env.aiven file and run
cp .env.aiven .env
source .env  # On Windows: use `set` or a tool like `dotenv`
python init_aiven_db.py
```

The script will:
- Connect to your Aiven.io PostgreSQL database
- Create all required tables
- Insert default data (admin/prof users, departments, modules, exams, etc.)
- Create indexes for performance

#### 5. Start the Backend Server

```bash
cd backend
cp ../.env.aiven .env
python app.py
```

Or with production config:
```bash
cp ../.env.aiven .env
python -c "from config_prod import config; from app import create_app; app = create_app('production'); app.run(host='0.0.0.0', port=5006, debug=False)"
```

#### 6. Start the Frontend

In a separate terminal:
```bash
# Set the API URL to point to your backend
cp .env.aiven .env
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Option 2: Using Docker Compose

#### 1. Build and Start Containers

```bash
# Copy the Aiven configuration
docker-compose -f docker-compose.yml up --build
```

#### 2. Initialize Database

```bash
# Run the initialization script in the backend container
docker-compose exec backend python init_aiven_db.py
```

#### 3. Access the Application

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5006/api`

### Option 3: Production Deployment

For production, you should:

1. Set up proper environment variables on your server
2. Use a production WSGI server like Gunicorn
3. Use HTTPS with a proper certificate
4. Set up a reverse proxy (Nginx, Apache, or Caddy)

#### Example with Gunicorn

```bash
# Install gunicorn
pip install gunicorn

# Start with gunicorn
gunicorn -w 4 -b 0.0.0.0:5006 app:app
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:5173;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    location /api {
        proxy_pass http://localhost:5006;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

## Environment Variables

### Backend (backend/.env)

```bash
# Database
DATABASE_URL=postgres://avnadmin:[REDACTED]@exam-fpk-yahyabouaachak-c539.b.aivencloud.com:21532/defaultdb?sslmode=require

# Application
SECRET_KEY=your-secret-key-change-in-production
JWT_SECRET_KEY=jwt-secret-key-change-in-production
PORT=5006
```

### Frontend (.env)

```bash
VITE_API_URL=http://localhost:5006/api
```

## Default Credentials

After running the initialization script, you can log in with:

- **Admin**: `admin` / `admin`
- **Professor**: `prof` / `prof`

## Troubleshooting

### Connection Issues

1. **SSL Mode**: Aiven.io requires SSL. Make sure your connection string includes `?sslmode=require`
2. **Firewall**: Ensure your server can connect to Aiven.io on port 21532
3. **Credentials**: Double-check your username and password

### Database Already Exists

If tables already exist, the script will skip them (using `IF NOT EXISTS`). To force a clean setup:

```bash
# Drop all tables first (BE CAREFUL!)
psql -h exam-fpk-yahyabouaachak-c539.b.aivencloud.com -U avnadmin -d defaultdb -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Then run the initialization script
python init_aiven_db.py
```

### Password Hash

The default password hash in the script is for the password `admin` and `prof`. If you need to change passwords:

```python
from werkzeug.security import generate_password_hash
print(generate_password_hash('your-new-password'))
```

## Database Schema

The database schema includes the following tables:

- `users` - User accounts (admin, professor)
- `professors` - Professor profiles
- `departments` - Academic departments
- `filieres` - Fields of study
- `professor_filier` - Association between professors and filieres
- `modules` - Courses
- `salles` - Rooms/Classrooms
- `exams` - Examinations
- `assignments` - Guard assignments for professors
- `incidents` - Incident reports
- `assignment_history` - Historical record of assignments

## API Endpoints

Base URL: `/api`

### Authentication
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh token
- `POST /auth/logout` - Logout

### Users
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/<id>` - Get user by ID
- `PUT /users/<id>` - Update user
- `DELETE /users/<id>` - Delete user

### Professors
- `GET /professors` - List professors
- `GET /professors/<id>` - Get professor by ID
- `POST /professors` - Create professor
- `PUT /professors/<id>` - Update professor
- `DELETE /professors/<id>` - Delete professor

### Departments
- `GET /departments` - List departments
- `POST /departments` - Create department
- `GET /departments/<id>` - Get department by ID
- `PUT /departments/<id>` - Update department
- `DELETE /departments/<id>` - Delete department

### Filieres
- `GET /filieres` - List filieres
- `POST /filieres` - Create filier
- `GET /filieres/<id>` - Get filier by ID
- `PUT /filieres/<id>` - Update filier
- `DELETE /filieres/<id>` - Delete filier

### Modules
- `GET /modules` - List modules
- `POST /modules` - Create module
- `GET /modules/<id>` - Get module by ID
- `PUT /modules/<id>` - Update module
- `DELETE /modules/<id>` - Delete module
- `GET /modules/filier/<filier_id>` - Get modules by filier
- `GET /modules/professor/<professor_id>` - Get modules by professor

### Salles
- `GET /salles` - List salles
- `POST /salles` - Create salle
- `GET /salles/<id>` - Get salle by ID
- `PUT /salles/<id>` - Update salle
- `DELETE /salles/<id>` - Delete salle

### Exams
- `GET /exams` - List exams
- `POST /exams` - Create exam
- `GET /exams/<id>` - Get exam by ID
- `PUT /exams/<id>` - Update exam
- `DELETE /exams/<id>` - Delete exam
- `GET /exams/module/<module_id>` - Get exams by module

### Assignments
- `GET /assignments` - List assignments
- `POST /assignments` - Create assignment
- `GET /assignments/<id>` - Get assignment by ID
- `PUT /assignments/<id>` - Update assignment
- `DELETE /assignments/<id>` - Delete assignment
- `GET /assignments/professor/<professor_id>` - Get assignments by professor

## Security Notes

1. **Change Default Credentials**: Always change the default admin and professor passwords after deployment
2. **Use HTTPS**: In production, always use HTTPS to protect credentials
3. **Rotate Secrets**: Regularly rotate your SECRET_KEY and JWT_SECRET_KEY
4. **Database Backups**: Set up regular backups for your Aiven.io database
5. **Network Restrictions**: Configure Aiven.io to allow connections only from your server IP

## Monitoring

Aiven.io provides built-in monitoring for your PostgreSQL service. You can:

1. View database metrics in the Aiven.io console
2. Set up alerts for performance issues
3. Monitor query performance
4. Track connection counts

## Scaling

For production deployments with high traffic:

1. Use multiple backend instances behind a load balancer
2. Consider using a connection pooler like PgBouncer
3. Implement caching for frequently accessed data
4. Use a CDN for static frontend assets
