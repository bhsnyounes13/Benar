
-- Drop the restrictive SELECT policy on user_roles
DROP POLICY "Users can view own roles" ON public.user_roles;

-- Create a new policy that allows viewing own roles OR any non-admin roles (for freelancer discovery)
CREATE POLICY "Users can view roles"
ON public.user_roles
FOR SELECT
USING (
  (auth.uid() = user_id) 
  OR (role <> 'admin'::app_role)
  OR is_admin(auth.uid())
);
