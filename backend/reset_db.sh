#!/bin/bash

# FPK Exam Guard - Database Reset Script
# This script drops all data from the database but keeps the schema
# Usage: ./reset_db.sh

set -e

echo "================================================================================"
echo "FPK Exam Guard - Database Reset"
echo "================================================================================"
echo ""

# Check if we're in the backend directory
if [ ! -f "drop_all_data.sql" ]; then
    echo "Error: Please run this script from the backend directory"
    echo "  cd backend"
    echo "  ./reset_db.sh"
    exit 1
fi

# Check for database URL in environment or .env
DB_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/fpk_exam_guard"}

echo "Using database: $DB_URL"
echo ""

# Extract database name from URL
DB_NAME=$(echo "$DB_URL" | grep -oE '/([^/]+)$' | cut -d'/' -f2)

echo "Resetting database: $DB_NAME"
echo ""

# Run the SQL script
if command -v psql &> /dev/null; then
    echo "Running drop_all_data.sql..."
    psql "$DB_URL" -f drop_all_data.sql -v ON_ERROR_STOP=1
    
    echo ""
    echo "✅ Database reset successfully!"
    echo "   All data has been removed but the schema is intact."
    echo ""
    echo "You can now run the seeder to populate with fresh data:"
    echo "  python seed_test_data.py"
else
    echo "Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

echo "================================================================================"
