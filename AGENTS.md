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

- Post media uses the private `post-media` bucket with ownership-scoped paths and `post_media` metadata; this keeps community content access-controlled and supports ordered galleries.
- Profile edits go through an authenticated server function that derives the profile ID from the validated session; this prevents editing another member's profile.
- Shared authenticated surfaces use the semantic `glass-surface` and `glass-control` utilities; this keeps the liquid-glass treatment consistent and themeable.
- Account and app emails use the shared LEX email layout and Lovable-managed sending; this keeps branding consistent without app-owned delivery infrastructure.
