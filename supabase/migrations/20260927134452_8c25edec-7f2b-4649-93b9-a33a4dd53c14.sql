CREATE TABLE public.post_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  uploader_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path text NOT NULL UNIQUE,
  media_type text NOT NULL CHECK (media_type IN ('image', 'video')),
  mime_type text NOT NULL,
  alt_text text,
  sort_order smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0 AND sort_order < 4),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (post_id, sort_order)
);

GRANT SELECT, INSERT, DELETE ON public.post_media TO authenticated;
GRANT ALL ON public.post_media TO service_role;

ALTER TABLE public.post_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post media readable by members"
ON public.post_media
FOR SELECT
TO authenticated
USING (private.is_onboarded_member());

CREATE POLICY "post media insert own"
ON public.post_media
FOR INSERT
TO authenticated
WITH CHECK (
  uploader_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.posts
    WHERE posts.id = post_media.post_id
      AND posts.author_id = auth.uid()
  )
);

CREATE POLICY "post media delete own"
ON public.post_media
FOR DELETE
TO authenticated
USING (uploader_id = auth.uid());

CREATE POLICY "post media objects read by members"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'post-media'
  AND private.is_onboarded_member()
);

CREATE POLICY "post media objects upload own"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
  AND lower(storage.extension(name)) = ANY (ARRAY['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'])
);

CREATE POLICY "post media objects delete own"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-media'
  AND (storage.foldername(name))[1] = auth.uid()::text
);