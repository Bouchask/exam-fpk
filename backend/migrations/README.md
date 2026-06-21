# Database Migrations

This directory contains database migration scripts for the FPK Exam Guard Backend.

## Problem

If you're seeing the error:
```
(psycopg2.errors.UndefinedColumn) column modules.professor_id does not exist
```

This means your database schema is out of sync with the application models. The `Module` model was updated to include a `professor_id` field, but your existing database table doesn't have this column.

## Solution

You have two options:

### Option 1: Reinitialize Database (Recommended for Development)

This is the simplest solution for development environments:

```bash
cd backend

# Delete existing database (SQLite)
rm -f instance/*.db

# Recreate database with latest schema
python init_db.py

# Restart the backend
python run.py
```

**Note:** This will delete all existing data. Only use this in development.

### Option 2: Run Migration (For Production)

If you need to preserve existing data, run the migration script:

```bash
cd backend
python migrations/add_professor_id_to_modules.py
```

This will add the `professor_id` column to the `modules` table without deleting existing data.

## What Changed

The `Module` model in `backend/models.py` now includes:

```python
professor_id = db.Column(db.Integer, db.ForeignKey('professors.id'))
professor = db.relationship('Professor', back_populates='modules')
```

This creates a many-to-one relationship between modules and professors, allowing each module to be associated with a specific professor.

## Manual Migration (PostgreSQL)

If the migration script doesn't work, you can manually run these SQL commands:

```sql
-- Add the column (nullable initially)
ALTER TABLE modules ADD COLUMN professor_id INTEGER;

-- Add foreign key constraint
ALTER TABLE modules ADD CONSTRAINT fk_modules_professor 
    FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL;

-- Optionally set a default value for existing rows
UPDATE modules SET professor_id = NULL WHERE professor_id IS NULL;
```

## Backward Compatibility

The application code has been updated to handle databases that don't yet have the `professor_id` column:

- `Module.to_dict()` uses `getattr(self, 'professor_id', None)` to safely access the field
- `Filier.to_dict()` wraps module counting in try-except to avoid errors

However, for full functionality (creating/updating modules with professors), you need to add the column.

## After Migration

After running the migration or reinitializing the database:

1. Restart your backend server
2. The error should be resolved
3. You can now:
   - Create modules and assign them to professors
   - Update modules to change their professor assignment
   - Delete modules
   - All existing functionality will work

## Creating New Migrations

For future schema changes, follow this pattern:

1. Create a new Python file in the `migrations/` directory
2. Use SQLAlchemy's `db.session.execute()` for schema changes
3. Wrap operations in try-except with rollback on error
4. Add a `main()` function that can be run directly
5. Include clear console output about what the migration does

Example structure:

```python
#!/usr/bin/env python3
from app import create_app
from models import db

def main():
    app = create_app()
    with app.app_context():
        # Check if migration is needed
        # Execute migration
        # Commit or rollback

if __name__ == '__main__':
    main()
```
