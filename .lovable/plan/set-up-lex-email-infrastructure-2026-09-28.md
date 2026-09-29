# Set up LEX email infrastructure

## Outcome
- Use `legal.lexindia.app` as LEX’s sender domain.
- Enable account emails for sign-up, sign-in, recovery, invitations, email changes, and reauthentication.
- Add a reusable branded email foundation for future LEX notifications.
- Keep delivery managed by Lovable, including retries, suppression, and unsubscribe handling.

## Implementation
- Confirm email/password authentication is enabled.
- Generate the managed account-email templates and delivery hook.
- Generate the transactional template registry and sending helper.
- Apply LEX’s dark, institutional visual identity and sender naming to generated templates.
- Deploy the account-email hook and verify the project still builds.

## External prerequisite
DNS verification for `legal.lexindia.app` is currently pending. Sending from this domain activates automatically after these records propagate:
- TXT `_lovable-email.lexindia.app`
- NS `legal.lexindia.app` → `ns3.lovable.cloud`
- NS `legal.lexindia.app` → `ns4.lovable.cloud`

No email queue or email database tables will be added; delivery remains managed by Lovable.
