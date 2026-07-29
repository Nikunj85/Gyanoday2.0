DROP FUNCTION IF EXISTS is_admin();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = auth.uid()
      AND role = 'admin'
      AND is_active = true
  );
$$;

CREATE OR REPLACE POLICY "Admin insert classes"
ON classes
FOR INSERT
WITH CHECK (is_admin())

CREATE OR REPLACE POLICY "Admin update classes"
ON public.classes
USING (is_admin())
WITH CHECK (is_admin());

SELECT public.is_admin();