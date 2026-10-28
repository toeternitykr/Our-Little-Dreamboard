-- Shared partners use the same authenticated account; author_name is a label, never an access grant.
-- drizzle/schema.ts is an intentionally blank placeholder; SQL migrations define these tables.
ALTER TABLE public.bucket_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_items FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_replies FORCE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bucket_photos FORCE ROW LEVEL SECURITY;

REVOKE ALL PRIVILEGES ON TABLE public.bucket_items, public.bucket_replies, public.bucket_photos FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bucket_items TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.bucket_replies, public.bucket_photos TO authenticated;
GRANT ALL ON public.bucket_items, public.bucket_replies, public.bucket_photos TO service_role;

-- Replace all existing policies on application tables, including any accidental permissive policies.
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('bucket_items', 'bucket_replies', 'bucket_photos') LOOP
    EXECUTE format('DROP POLICY %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

CREATE POLICY dream_owner_guard ON public.bucket_items AS RESTRICTIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()))
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()));
CREATE POLICY dream_owner_select ON public.bucket_items FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
CREATE POLICY dream_owner_insert ON public.bucket_items FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY dream_owner_update ON public.bucket_items FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
CREATE POLICY dream_owner_delete ON public.bucket_items FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));

CREATE POLICY reply_owner_parent_guard ON public.bucket_replies AS RESTRICTIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.bucket_items b WHERE b.id = bucket_replies.item_id AND b.user_id = (SELECT auth.uid())))
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid()) AND EXISTS (
    SELECT 1 FROM public.bucket_items b WHERE b.id = bucket_replies.item_id AND b.user_id = (SELECT auth.uid())));
CREATE POLICY reply_owner_select ON public.bucket_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY reply_owner_insert ON public.bucket_replies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY reply_owner_delete ON public.bucket_replies FOR DELETE TO authenticated USING (true);
-- Replies are append/delete only. Never let a future permissive policy enable updates.
CREATE POLICY reply_no_update ON public.bucket_replies AS RESTRICTIVE FOR UPDATE TO PUBLIC USING (false) WITH CHECK (false);

CREATE POLICY photo_owner_parent_guard ON public.bucket_photos AS RESTRICTIVE FOR ALL TO PUBLIC
  USING ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())
    AND split_part(storage_path, '/', 1) = (SELECT auth.uid())::text
    AND ((kind = 'background' AND item_id IS NULL) OR (kind = 'memory' AND EXISTS (
      SELECT 1 FROM public.bucket_items b WHERE b.id = bucket_photos.item_id AND b.user_id = (SELECT auth.uid())))))
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL AND user_id = (SELECT auth.uid())
    AND split_part(storage_path, '/', 1) = (SELECT auth.uid())::text
    AND ((kind = 'background' AND item_id IS NULL) OR (kind = 'memory' AND EXISTS (
      SELECT 1 FROM public.bucket_items b WHERE b.id = bucket_photos.item_id AND b.user_id = (SELECT auth.uid()) AND b.done))));
CREATE POLICY photo_owner_select ON public.bucket_photos FOR SELECT TO authenticated USING (true);
CREATE POLICY photo_owner_insert ON public.bucket_photos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY photo_owner_delete ON public.bucket_photos FOR DELETE TO authenticated USING (true);
CREATE POLICY photo_no_update ON public.bucket_photos AS RESTRICTIVE FOR UPDATE TO PUBLIC USING (false) WITH CHECK (false);

-- Existing storage SELECT/INSERT/DELETE policies remain. This AND guard prevents broader
-- policies added later from exposing dream-photos, without changing unrelated buckets.
DROP POLICY IF EXISTS dream_files_owner_guard ON storage.objects;
CREATE POLICY dream_files_owner_guard ON storage.objects AS RESTRICTIVE FOR ALL TO PUBLIC
  USING (bucket_id <> 'dream-photos' OR ((SELECT auth.uid()) IS NOT NULL AND (storage.foldername(name))[1] = (SELECT auth.uid())::text))
  WITH CHECK (bucket_id <> 'dream-photos' OR ((SELECT auth.uid()) IS NOT NULL AND (storage.foldername(name))[1] = (SELECT auth.uid())::text));
DROP POLICY IF EXISTS dream_files_no_update ON storage.objects;
CREATE POLICY dream_files_no_update ON storage.objects AS RESTRICTIVE FOR UPDATE TO PUBLIC
  USING (bucket_id <> 'dream-photos') WITH CHECK (bucket_id <> 'dream-photos');