#!/bin/bash

# FPK Exam Guard - Aiven.io Startup Script
# This script automates the setup and launch of the application with Aiven.io

echo "=========================================="
echo "FPK Exam Guard - Aiven.io Setup"
echo "=========================================="
echo ""

# Check if Python is installed
echo "Checking Python..."
if ! command -v python &> /dev/null; then
    echo "❌ Python not found! Please install Python 3.8+"
    exit 1
fi
echo "✓ Python found"

# Check if Node.js is installed
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found! Please install Node.js 18+"
    exit 1
fi
echo "✓ Node.js found"

# Check if npm is installed
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found! Please install npm"
    exit 1
fi
echo "✓ npm found"

echo ""
echo "=========================================="
echo "Setting up Backend..."
echo "=========================================="
echo ""

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python -m venv venv
fi

# Activate virtual environment and install dependencies
echo "Installing backend dependencies..."
source venv/bin/activate
pip install -q -r backend/requirements.txt

echo ""
echo "=========================================="
echo "Setting up Frontend..."
echo "=========================================="
echo ""

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install -q

echo ""
echo "=========================================="
echo "Initializing Database..."
echo "=========================================="
echo ""

# Initialize Aiven.io database
echo "Running database initialization script..."
python init_aiven_db.py

if [ $? -ne 0 ]; then
    echo "❌ Database initialization failed!"
    deactivate
    exit 1
fi

echo ""
echo "=========================================="
echo "Starting Servers..."
echo "=========================================="
echo ""

# Open two terminal windows or use background processes
# For now, we'll provide instructions
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  cp ../.env.aiven .env"
echo "  python app.py"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cp .env.aiven .env"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  - Frontend: http://localhost:5173"
echo "  - Backend API: http://localhost:5006/api"
echo ""
echo "Default credentials:"
echo "  - Admin: admin / admin"
echo "  - Professor: prof / prof"
echo ""

# Deactivate virtual environment
deactivate
