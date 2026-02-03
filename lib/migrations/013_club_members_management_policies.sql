-- Add management policies for club_members
CREATE POLICY "Presidents can manage members of their club"
ON public.club_members FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.club_members AS admin_check
        WHERE admin_check.club_id = public.club_members.club_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'PRESIDENT'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.club_members AS admin_check
        WHERE admin_check.club_id = public.club_members.club_id
        AND admin_check.user_id = auth.uid()
        AND admin_check.role = 'PRESIDENT'
    )
);

-- Note: The president might not be in club_members yet for their own club if it's new.
-- Usually, the owner becomes the first president.
