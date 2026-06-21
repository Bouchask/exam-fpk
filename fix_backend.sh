#!/bin/bash

# Stop existing services
pkill -f "python.*app.py" 2>/dev/null
pkill -f "python.*run.py" 2>/dev/null

# Start PostgreSQL
brew services start postgresql@14 2>/dev/null || sudo systemctl start postgresql 2>/dev/null
sleep 3

# Setup database
cd /Users/ggffghg/Desktop/exam-fpk/backend

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://ggffghg:ggffghg@localhost:5432/fpk_exam_guard
JWT_SECRET_KEY=super-secret-jwt-key-change-in-production-12345
SECRET_KEY=super-secret-flask-key-change-in-production-67890
FLASK_ENV=development
FLASK_DEBUG=true
FLASK_PORT=5006
EOF

# Create user and database
psql -U postgres -c "DO \$\$ BEGIN IF NOT EXISTS (SELECT FROM pg_catalog.pg_user WHERE usename = 'ggffghg') THEN CREATE USER ggffghg WITH PASSWORD 'ggffghg' SUPERUSER; END IF; END \$\$;" 2>/dev/null
psql -U postgres -c "CREATE DATABASE fpk_exam_guard OWNER ggffghg;" 2>/dev/null || true

# Install dependencies
pip install -r requirements.txt -q

# Initialize database
python init_db.py

# Start server
echo "Starting backend server..."
python run.py