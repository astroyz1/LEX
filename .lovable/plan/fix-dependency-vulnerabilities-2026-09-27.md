# Fix dependency vulnerabilities

## Changes
- Refresh the existing dependency lockfile without adding a forced `js-yaml` override to `package.json`.
- Confirm the lockfile resolves transitive `js-yaml` to version 4.3.2 or later.
- Run the dependency security scan and confirm both listed advisories are cleared.
- Confirm the application still builds successfully.

## Scope
Only dependency resolution files will change; application behavior and features remain unchanged.
