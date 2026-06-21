#!/bin/bash

# Script to run the test data seeder for FPK Exam Guard
# Usage: ./run_seeder.sh

echo "=========================================="
echo "FPK Exam Guard - Test Data Seeder"
echo "=========================================="
echo ""

# Check if we're in the backend directory
if [ ! -f "app.py" ]; then
    echo "❌ Error: Please run this script from the backend directory"
    echo "   cd /path/to/exam-fpk/backend"
    echo "   ./run_seeder.sh"
    exit 1
fi

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: Python 3 is not installed"
    exit 1
fi

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "🔍 Found virtual environment, activating..."
    source venv/bin/activate
fi

# Check if Flask is installed
if ! python3 -c "import flask" &> /dev/null; then
    echo "❌ Error: Flask is not installed"
    echo "   Run: pip install flask"
    exit 1
fi

echo "🚀 Starting seeder..."
echo ""

# Run the seeder
python3 seed_test_data.py

echo ""
echo "🎉 Seeder completed!"
echo ""
echo "📋 To start the backend server, run:"
echo "   python3 run.py"
echo ""
echo "🌐 Then visit: http://localhost:5006/api/..."
