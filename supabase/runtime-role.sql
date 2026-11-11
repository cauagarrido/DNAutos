-- Run as the project database owner AFTER the migration, once.
-- This group has no login/password. Create a dedicated login privately in SQL Editor,
-- grant this group to it, and use that login in DATABASE_URL.
CREATE ROLE benz_backend NOLOGIN NOINHERIT;
GRANT USAGE ON SCHEMA benz TO benz_backend;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA benz TO benz_backend;
DO $$
DECLARE item record;
BEGIN
  FOR item IN SELECT tablename FROM pg_tables WHERE schemaname='benz' LOOP
    EXECUTE format('CREATE POLICY backend_access ON benz.%I FOR ALL TO benz_backend USING (true) WITH CHECK (true)',item.tablename);
  END LOOP;
END;
$$;
-- Do not grant access to auth.users, auth.sessions, public, Storage or other schemas.
