#!/usr/bin/env python3
"""
Database migration script to add professor_id column to modules table
This fixes the issue: column modules.professor_id does not exist
"""

import os
import sys

# Add the parent directory to the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app
from models import db, Module

def main():
    """Main migration function"""
    print("=" * 60)
    print("FPK Exam Guard - Adding professor_id to modules table")
    print("=" * 60)

    # Create the app
    app = create_app()

    with app.app_context():
        # Check if the column already exists
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('modules')]
        
        if 'professor_id' in columns:
            print("✅ professor_id column already exists in modules table")
            print("Migration not needed")
            return
        
        print("⚠️  professor_id column not found in modules table")
        print("Adding column...")
        
        # Add the professor_id column using raw SQL to avoid ORM issues
        try:
            # For PostgreSQL
            from sqlalchemy import text
            db.session.execute(
                text("ALTER TABLE modules ADD COLUMN IF NOT EXISTS professor_id INTEGER")
            )
            
            # Add foreign key constraint
            db.session.execute(
                text("ALTER TABLE modules ADD CONSTRAINT fk_modules_professor "
                     "FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL")
            )
            
            db.session.commit()
            print("✅ professor_id column added successfully")
            print("✅ Foreign key constraint added")
            
            # Update existing modules to set default professor_id to NULL
            # This is safe as the column allows NULL initially
            print("\n✅ Migration completed successfully!")
            print("\nThe modules table now has the professor_id column.")
            
        except Exception as e:
            db.session.rollback()
            print(f"❌ Error during migration: {e}")
            print("\nPlease check your database connection and try again.")
            sys.exit(1)

if __name__ == '__main__':
    main()
