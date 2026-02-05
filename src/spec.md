# Specification

## Summary
**Goal:** Create a new Caffeine draft and redeploy the exact same currently deployed application version (Version 125) with no code or migration changes.

**Planned changes:**
- Create a new draft and deploy using the same code as Version 125 (no backend/frontend source changes; no state/schema migrations).
- Add redeploy documentation by creating Draft 125 versions of existing templates:
  - frontend/REBUILD_DEPLOY_DRAFT_125.md
  - frontend/REDEPLOY_NOTE_DRAFT_125.md
  - frontend/SMOKE_CHECK_DRAFT_125.md
  Each should explicitly state there were no functional/UI/schema/state changes.

**User-visible outcome:** The app is redeployed as the same Version 125 build and remains usable (app loads, Internet Identity login works, and the dashboard renders after the profile is available).
