<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep bucket-item replies in a child table with parent-owner access policies; the shared account is the ownership boundary.
- Store one shared preference on each bucket item and isolate reply/rating interactions in BucketFeedback so they do not trigger card editing.
- Store photo metadata in bucket_photos and files in an owner-scoped private Storage bucket; use renewed signed URLs so shared-account photos are not publicly exposed.
- Keep target_date optional alongside the legacy target_year and select author labels explicitly because both people use one account.
- Keep Seoul calendar-day countdown helpers separate from UI and photo controls isolated from card-edit clicks.
- Organize domain code under src/features/{dreams,photos,bucket,auth}; routes compose feature entry points and shared primitives remain in src/components/ui to keep feature dependencies explicit.
- Enforce shared-account ownership through restrictive RLS guards and explicit operation grants; child rows also require an owned parent, and replies/photo metadata are insert/delete only.
- Theme colors, gradients, glass borders, and shadows live in src/styles.css; Button variants consume them and the root content follows the device color-scheme preference for consistent light/dark surfaces.
- Keep shared typography and intrinsic dream-grid sizing in global CSS utilities; feature views use those utilities so sparse and dense boards retain consistent readable columns.
- Keep interaction timing and custom fade/scale entrances in global motion utilities, consumed by feature views and shared controls, with a reduced-motion fallback to avoid inconsistent movement.
