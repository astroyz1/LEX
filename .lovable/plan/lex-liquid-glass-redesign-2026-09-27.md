# LEX liquid-glass redesign

## Goal
Match the supplied dark reference across the authenticated workspace: deep navy-black surfaces, cool metallic background lighting, translucent glass panels, restrained blue accents, and sharper professional density. Preserve all current features and content.

## Changes
- Rework the global dark palette and shared surface tokens for translucent glass, subtle edge highlights, soft shadows, and readable contrast.
- Add the reference’s fixed atmospheric background using layered CSS lighting and grain; no uploaded mockup will be embedded.
- Restyle the shared desktop sidebar, top search bar, mobile header, bottom navigation, menus, and controls to use the liquid-glass system.
- Refine the Home composition to mirror the reference more closely: compact spacing, glass quote panel, action controls, tabs, feed cards, and right-side panels.
- Apply the same shared tokens to existing screens so Messages, Workspaces, Network, Opportunities, Library, Profile, onboarding, and dialogs inherit the new visual language without changing behavior.
- Keep dark mode only, Fraunces headings, Inter body type, existing blue accent, and all current navigation and V1 functionality.

## Verification
- Check the authenticated Home screen at desktop and mobile sizes for readability, spacing, background framing, and glass effects.
- Confirm interactive controls still work and the current build finishes without errors.

## Technical details
- Use semantic CSS tokens and reusable glass utilities in the global stylesheet.
- Use standard `backdrop-filter` only; the build will add browser prefixes.
- Respect reduced-motion preferences and avoid effects that obscure content.
