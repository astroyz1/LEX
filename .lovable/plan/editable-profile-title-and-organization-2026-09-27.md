# Editable profile title and organization

## What will change
- Add a professional title field to each profile.
- Add an Edit profile action on the Profile page.
- Let members update their name, title, organization, bio, and interests with clear validation.
- Keep professional type and verification status read-only.
- Show the title and organization beneath the member's name.

## Technical details
- Add a nullable, length-limited `professional_title` column to profiles.
- Continue saving through the signed-in member's existing ownership policy.
- Validate and trim every editable value before saving.
- Refresh the current profile immediately after a successful update.
- Verify the saved state in the signed-in preview on desktop and mobile.
