
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
