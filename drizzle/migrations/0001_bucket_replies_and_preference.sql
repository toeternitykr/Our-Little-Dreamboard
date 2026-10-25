ALTER TABLE public.bucket_items ADD COLUMN preference integer NOT NULL DEFAULT 0;
ALTER TABLE public.bucket_items ADD CONSTRAINT bucket_preference_range CHECK (preference BETWEEN 0 AND 5);
CREATE TABLE public.bucket_replies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 item_id uuid NOT NULL REFERENCES public.bucket_items(id) ON DELETE CASCADE,
 user_id uuid NOT NULL DEFAULT auth.uid(),
 body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.bucket_replies TO authenticated;
GRANT ALL ON public.bucket_replies TO service_role;
ALTER TABLE public.bucket_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read replies to own items" ON public.bucket_replies FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.bucket_items b WHERE b.id = item_id AND b.user_id = auth.uid()));
CREATE POLICY "Reply to own items" ON public.bucket_replies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.bucket_items b WHERE b.id = item_id AND b.user_id = auth.uid()));
CREATE POLICY "Delete own replies" ON public.bucket_replies FOR DELETE TO authenticated USING (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.bucket_items b WHERE b.id = item_id AND b.user_id = auth.uid()));
CREATE INDEX bucket_replies_item_created_idx ON public.bucket_replies(item_id, created_at);