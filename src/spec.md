# Specification

## Summary
**Goal:** Promote the currently deployed draft build (Draft Version 137) to the live (production) canister without introducing any code or schema changes, then verify production stability via a smoke check.

**Planned changes:**
- Promote Draft Version 137 to the live (production) canister.
- Run a post-promotion smoke check on production: initial app load, Internet Identity login/logout, actor initialization (no trap), profile gating (setup vs dashboard), and submission proficiency tooltips rendering (including Purple belt).

**User-visible outcome:** The production app matches Draft Version 137, and users can load the app, authenticate, be routed correctly based on profile existence, and view submission proficiency tooltips without crashes or console errors.
