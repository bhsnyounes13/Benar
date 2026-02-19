-- Update projects SELECT policy to allow freelancers with contracts to see the project
DROP POLICY "Anyone can view open projects" ON public.projects;

CREATE POLICY "Anyone can view open projects or own projects"
ON public.projects
FOR SELECT
USING (
  status = 'open'::project_status
  OR client_id = auth.uid()
  OR is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.contracts c
    WHERE c.project_id = projects.id
    AND c.freelancer_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.proposals p
    WHERE p.project_id = projects.id
    AND p.freelancer_id = auth.uid()
  )
);