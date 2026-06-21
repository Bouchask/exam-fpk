-- Drop All Data from FPK Exam Guard Database
-- This script removes all data but keeps the schema intact
-- Usage: psql -U your_user -d your_db -f drop_all_data.sql

-- Disable foreign key constraint checks temporarily
SET session_replication_role = 'replica';

-- Truncate all tables in the correct order to avoid constraint violations
-- Order: tables with foreign keys first, then their parents

-- First, truncate tables that reference other tables
TRUNCATE TABLE assignments CASCADE;
TRUNCATE TABLE assignment_history CASCADE;
TRUNCATE TABLE incidents CASCADE;
TRUNCATE TABLE professor_filier CASCADE;

-- Then truncate main entity tables
TRUNCATE TABLE exams CASCADE;
TRUNCATE TABLE professors CASCADE;
TRUNCATE TABLE modules CASCADE;
TRUNCATE TABLE filieres CASCADE;
TRUNCATE TABLE salles CASCADE;
TRUNCATE TABLE departments CASCADE;

-- Finally truncate users (referenced by professors)
TRUNCATE TABLE users CASCADE;

-- Reset all sequences to start from 1
SELECT setval(pg_get_serial_sequence('"users"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"departments"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"filieres"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"modules"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"professors"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"salles"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"exams"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"assignments"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"assignment_history"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"incidents"', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('"professor_filier"', 'id'), 1, false);

-- Re-enable foreign key constraint checks
SET session_replication_role = 'default';

-- Verify tables are empty
SELECT 
    'users' as table_name, 
    (SELECT COUNT(*) FROM users) as row_count
UNION ALL
SELECT 
    'departments' as table_name, 
    (SELECT COUNT(*) FROM departments) as row_count
UNION ALL
SELECT 
    'filieres' as table_name, 
    (SELECT COUNT(*) FROM filieres) as row_count
UNION ALL
SELECT 
    'modules' as table_name, 
    (SELECT COUNT(*) FROM modules) as row_count
UNION ALL
SELECT 
    'professors' as table_name, 
    (SELECT COUNT(*) FROM professors) as row_count
UNION ALL
SELECT 
    'salles' as table_name, 
    (SELECT COUNT(*) FROM salles) as row_count
UNION ALL
SELECT 
    'exams' as table_name, 
    (SELECT COUNT(*) FROM exams) as row_count
UNION ALL
SELECT 
    'assignments' as table_name, 
    (SELECT COUNT(*) FROM assignments) as row_count;
