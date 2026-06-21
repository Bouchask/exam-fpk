# 🚨 Database Fix Required

## Error
```
(psycopg2.errors.UndefinedColumn) column modules.professor_id does not exist
```

## Quick Fix

Run this command to reinitialize your database:

```bash
# Stop your backend server if it's running

# Delete existing database and recreate it
cd /Users/ggffghg/Desktop/exam-fpk/backend
rm -f instance/*.db
python init_db.py

# Restart your backend
python run.py
```

## What's Happening

Your database was created before the `Module` model had a `professor_id` field. The error occurs because:

1. The code tries to query the `modules` table
2. SQLAlchemy includes the `professor_id` column in the SELECT statement
3. The column doesn't exist in your database
4. PostgreSQL/SQLite throws an error

## Alternative: Run Migration (Preserves Data)

If you need to keep your existing data:

```bash
cd /Users/ggffghg/Desktop/exam-fpk/backend
python migrations/add_professor_id_to_modules.py
```

## After Fixing

1. The error will be resolved
2. All features will work:
   - ✅ View filieres and modules
   - ✅ Create filieres and modules
   - ✅ **NEW: Edit filieres and modules**
   - ✅ **NEW: Delete filieres and modules**
   - ✅ Assign professors to modules

## Technical Details

**Changed Models:**
- `Module` now has `professor_id` (foreign key to professors table)
- `Module` has relationship to `Professor`
- `Filier` has relationship to `Module`

**New Features Added:**
- Frontend: Edit/delete buttons for filieres and modules
- Frontend: Delete confirmation modals
- Frontend: Edit forms support
- Backend: Module update now handles professor_id
- Backend: Module update validates professor/filier department match

## Need Help?

If you still have issues after running the fix:

1. **Check your database type**: Run `python -c "from backend.app import create_app; from backend.models import db; app = create_app(); print(app.config.get('SQLALCHEMY_DATABASE_URI'))"`

2. **For SQLite**: Make sure you're deleting the right `.db` file

3. **For PostgreSQL**: Run the migration script or manually add the column:
   ```sql
   ALTER TABLE modules ADD COLUMN professor_id INTEGER;
   ALTER TABLE modules ADD CONSTRAINT fk_modules_professor FOREIGN KEY (professor_id) REFERENCES professors(id) ON DELETE SET NULL;
   ```

## Files Modified

- `src/views/FilierModuleManagement.tsx` - Added edit/delete UI
- `backend/routes/modules.py` - Added professor_id update handling
- `backend/models.py` - Added backward compatibility for missing professor_id
- `backend/migrations/add_professor_id_to_modules.py` - Migration script
