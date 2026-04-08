-- 1. Disable triggers to avoid interference during the wipe (Optional)
SET session_replication_role = 'replica';

-- 2. Drop all tables if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Re-enable triggers
SET session_replication_role = 'origin';

-- 4. Re-run the creation logic
-- (Paste the updated schema.sql content below or run them together)