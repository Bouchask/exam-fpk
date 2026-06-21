#!/usr/bin/env python3
"""
FPK Exam Guard - Clear Database Script
This script removes all data from the database but keeps the schema intact.
Usage: python clear_database.py
"""

import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import db
from app import create_app

def clear_all_data():
    """Clear all data from all tables while preserving schema"""
    print("=" * 80)
    print("FPK Exam Guard - Clearing Database")
    print("=" * 80)
    print()
    
    # Create app context
    app = create_app()
    
    with app.app_context():
        print("Clearing all database tables...")
        print()
        
        # Define the order for deletion to respect foreign key constraints
        # Tables are deleted in reverse order of their dependencies
        table_order = [
            'AssignmentHistory',
            'Incident',
            'Assignment',
            'ProfessorFilier',
            'Exam',
            'Module',
            'Professor',
            'Filier',
            'Salle',
            'Department',
            'User'
        ]
        
        # Get all table models from db
        from models import (
            AssignmentHistory, Incident, Assignment, ProfessorFilier,
            Exam, Module, Professor, Filier, Salle, Department, User
        )
        
        tables = {
            'AssignmentHistory': AssignmentHistory,
            'Incident': Incident,
            'Assignment': Assignment,
            'ProfessorFilier': ProfessorFilier,
            'Exam': Exam,
            'Module': Module,
            'Professor': Professor,
            'Filier': Filier,
            'Salle': Salle,
            'Department': Department,
            'User': User
        }
        
        # Clear each table
        for table_name in table_order:
            if table_name in tables:
                model = tables[table_name]
                count = model.query.count()
                model.query.delete()
                print(f"  ✓ Cleared {count} rows from {table_name}")
        
        db.session.commit()
        print()
        print("✅ All data cleared successfully!")
        print("   Schema and table structure remain intact.")
        print()
        print("You can now run the seeder to populate with fresh data:")
        print("  python seed_test_data.py")
        print()
        print("=" * 80)

if __name__ == '__main__':
    try:
        clear_all_data()
    except Exception as e:
        print(f"❌ Error clearing database: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
