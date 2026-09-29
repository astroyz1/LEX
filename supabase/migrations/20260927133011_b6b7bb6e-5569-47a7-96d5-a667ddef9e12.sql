CREATE OR REPLACE FUNCTION public.is_onboarded_member()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND onboarded = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_onboarded_member() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_onboarded_member() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_onboarded_member() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_onboarded_member() TO service_role;

DROP POLICY IF EXISTS "profiles readable" ON public.profiles;
CREATE POLICY "profiles readable"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_onboarded_member());

DROP POLICY IF EXISTS "posts readable" ON public.posts;
CREATE POLICY "posts readable"
ON public.posts
FOR SELECT
TO authenticated
USING (public.is_onboarded_member());

DROP POLICY IF EXISTS "likes read" ON public.post_likes;
CREATE POLICY "likes read"
ON public.post_likes
FOR SELECT
TO authenticated
USING (public.is_onboarded_member());

DROP POLICY IF EXISTS "reposts read" ON public.post_reposts;
CREATE POLICY "reposts read"
ON public.post_reposts
FOR SELECT
TO authenticated
USING (public.is_onboarded_member());

DROP POLICY IF EXISTS "comments read" ON public.post_comments;
CREATE POLICY "comments read"
ON public.post_comments
FOR SELECT
TO authenticated
USING (public.is_onboarded_member());

DROP POLICY IF EXISTS "follows read" ON public.follows;
CREATE POLICY "follows read"
ON public.follows
FOR SELECT
TO authenticated
USING (public.is_onboarded_member());

DROP POLICY IF EXISTS "avatar read members" ON storage.objects;
CREATE POLICY "avatar read own"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);