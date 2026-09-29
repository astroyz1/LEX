CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT USAGE ON SCHEMA private TO service_role;

ALTER FUNCTION public.is_onboarded_member() SET SCHEMA private;
REVOKE ALL ON FUNCTION private.is_onboarded_member() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_onboarded_member() FROM anon;
GRANT EXECUTE ON FUNCTION private.is_onboarded_member() TO authenticated;
GRANT EXECUTE ON FUNCTION private.is_onboarded_member() TO service_role;

DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles readable"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR private.is_onboarded_member());

DROP POLICY IF EXISTS "posts readable" ON public.posts;
CREATE POLICY "posts readable"
ON public.posts
FOR SELECT
TO authenticated
USING (private.is_onboarded_member());

DROP POLICY IF EXISTS "likes read" ON public.post_likes;
CREATE POLICY "likes read"
ON public.post_likes
FOR SELECT
TO authenticated
USING (private.is_onboarded_member());

DROP POLICY IF EXISTS "reposts read" ON public.post_reposts;
CREATE POLICY "reposts read"
ON public.post_reposts
FOR SELECT
TO authenticated
USING (private.is_onboarded_member());

DROP POLICY IF EXISTS "comments read" ON public.post_comments;
CREATE POLICY "comments read"
ON public.post_comments
FOR SELECT
TO authenticated
USING (private.is_onboarded_member());

DROP POLICY IF EXISTS "follows read" ON public.follows;
CREATE POLICY "follows read"
ON public.follows
FOR SELECT
TO authenticated
USING (private.is_onboarded_member());