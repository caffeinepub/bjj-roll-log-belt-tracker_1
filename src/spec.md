# Specification

## Summary
**Goal:** Place the existing Training Heat Map inside the “Training Statistics” card and remove user-facing debug/bug UI elements.

**Planned changes:**
- Move the current Training Heat Map rendering in `frontend/src/components/ProfileAnalytics.tsx` into the “Training Statistics” card, positioned directly under the 6 metric tiles, keeping all existing functionality and sizing/scroll behavior unchanged.
- Remove the standalone “Training Heat Map” section that currently renders below/outside the profile/statistics cards.
- Remove the debug toggle (Bug icon) from `frontend/src/components/Header.tsx` and stop rendering the debug overlay from `frontend/src/App.tsx` across all app states.

**User-visible outcome:** On the Profile Analytics tab, the heat map appears within the Training Statistics card beneath the metrics, and all debug/bug UI controls/overlays are no longer visible anywhere in the app.
