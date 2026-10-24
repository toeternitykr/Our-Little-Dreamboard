CREATE TABLE public.bucket_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  target_year text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  done_at timestamptz,
  color int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bucket_items TO authenticated;
GRANT ALL ON public.bucket_items TO service_role;
ALTER TABLE public.bucket_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own select" ON public.bucket_items FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own insert" ON public.bucket_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own update" ON public.bucket_items FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own delete" ON public.bucket_items FOR DELETE TO authenticated USING (auth.uid() = user_id);