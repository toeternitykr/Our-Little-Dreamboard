ALTER TABLE public.bucket_items ADD COLUMN target_date date, ADD COLUMN author_name text NOT NULL DEFAULT '';
CREATE TABLE public.bucket_photos (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL DEFAULT auth.uid(),
 item_id uuid REFERENCES public.bucket_items(id) ON DELETE CASCADE,
 kind text NOT NULL CHECK (kind IN ('background', 'memory')),
 storage_path text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT photo_parent CHECK ((kind = 'background' AND item_id IS NULL) OR (kind = 'memory' AND item_id IS NOT NULL))
);
GRANT SELECT, INSERT, DELETE ON public.bucket_photos TO authenticated;
GRANT ALL ON public.bucket_photos TO service_role;
ALTER TABLE public.bucket_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own dream photos" ON public.bucket_photos FOR SELECT TO authenticated USING (user_id = auth.uid() AND (item_id IS NULL OR EXISTS (SELECT 1 FROM public.bucket_items b WHERE b.id = item_id AND b.user_id = auth.uid())));
CREATE POLICY "Add own dream photos" ON public.bucket_photos FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND split_part(storage_path, '/', 1) = auth.uid()::text AND (item_id IS NULL OR EXISTS (SELECT 1 FROM public.bucket_items b WHERE b.id = item_id AND b.user_id = auth.uid() AND b.done)));
CREATE POLICY "Delete own dream photos" ON public.bucket_photos FOR DELETE TO authenticated USING (user_id = auth.uid() AND (item_id IS NULL OR EXISTS (SELECT 1 FROM public.bucket_items b WHERE b.id = item_id AND b.user_id = auth.uid())));
CREATE POLICY "Read private dream files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'dream-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Upload private dream files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'dream-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Delete private dream files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'dream-photos' AND (storage.foldername(name))[1] = auth.uid()::text);