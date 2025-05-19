
-- Create a simple health check table for anonymous users to query
-- This makes connection status checks more reliable

CREATE TABLE IF NOT EXISTS public._anon_health_check (
  id SERIAL PRIMARY KEY,
  status TEXT DEFAULT 'ok',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert one record if the table is empty
INSERT INTO public._anon_health_check (status)
SELECT 'ok'
WHERE NOT EXISTS (SELECT 1 FROM public._anon_health_check);

-- Allow any authenticated or anonymous user to read this table
-- but not modify it (this is just for health checks)
ALTER TABLE public._anon_health_check ENABLE ROW LEVEL SECURITY;

CREATE POLICY "_anon_health_check_select_policy"
  ON public._anon_health_check
  FOR SELECT
  USING (true);
