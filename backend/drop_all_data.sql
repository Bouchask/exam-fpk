-- FPK Exam Guard - Drop All Data SQL Script
-- This script removes all data from tables while preserving the schema
-- Usage: psql -U username -d database_name -f drop_all_data.sql

-- Enable timing to see how long this takes
\timing on

-- Display banner
\echo '================================================================================'
\echo 'FPK Exam Guard - Clearing All Database Data'
\echo '================================================================================'
\echo ''

-- Start transaction
BEGIN;

-- First, reset all department heads to NULL to break circular dependency
-- (Department.head_id -> User.id, User.department_id -> Department.id)
UPDATE departments SET head_id = NULL;
\echo '  ✓ Reset department heads to NULL (breaking circular dependency)'

-- Now truncate all tables with CASCADE to automatically handle foreign keys
-- Order: most dependent first, then their parents

TRUNCATE TABLE assignment_history CASCADE;
\echo '  ✓ Truncated assignment_history'

TRUNCATE TABLE incidents CASCADE;
\echo '  ✓ Truncated incidents'

TRUNCATE TABLE assignments CASCADE;
\echo '  ✓ Truncated assignments'

TRUNCATE TABLE exams CASCADE;
\echo '  ✓ Truncated exams'

TRUNCATE TABLE professor_filier CASCADE;
\echo '  ✓ Truncated professor_filier'

TRUNCATE TABLE modules CASCADE;
\echo '  ✓ Truncated modules'

TRUNCATE TABLE professors CASCADE;
\echo '  ✓ Truncated professors'

TRUNCATE TABLE filieres CASCADE;
\echo '  ✓ Truncated filieres'

TRUNCATE TABLE salles CASCADE;
\echo '  ✓ Truncated salles'

TRUNCATE TABLE users CASCADE;
\echo '  ✓ Truncated users'

TRUNCATE TABLE departments CASCADE;
\echo '  ✓ Truncated departments'

-- Reset sequences to start from 1
SELECT setval(pg_get_serial_sequence('departments', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('users', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('professors', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('filieres', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('modules', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('salles', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('exams', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('assignments', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('assignment_history', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('incidents', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('professor_filier', 'id'), 1, false);
\echo '  ✓ Reset all sequences to 1'

-- Commit transaction
COMMIT;

-- Display completion message
\echo ''
\echo '✅ All data cleared successfully!'
\echo '   Schema and table structure remain intact.'
\echo ''
\echo 'You can now run the seeder to populate with fresh data:'
\echo '  python seed_test_data.py'
\echo ''
\echo '================================================================================'

-- Disable timing
\timing off
