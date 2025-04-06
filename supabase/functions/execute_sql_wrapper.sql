
-- Function to execute arbitrary SQL statements (with proper permissions)
CREATE OR REPLACE FUNCTION public.execute_sql_wrapper(sql_statement text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql_statement;
END;
$$;

-- Create or replace the get_clerk_user_id function
CREATE OR REPLACE FUNCTION public.get_clerk_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::text;
$$;
