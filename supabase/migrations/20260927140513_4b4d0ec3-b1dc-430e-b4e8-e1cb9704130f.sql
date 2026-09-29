ALTER TABLE public.profiles
ADD COLUMN professional_title text;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_professional_title_length
CHECK (professional_title IS NULL OR char_length(professional_title) <= 100);