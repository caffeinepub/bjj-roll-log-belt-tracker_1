# Specification

## Summary
**Goal:** Clean up the four belt “Add submission…” controls in the Submission Log by using a dropdown with an integrated search field and real-time filtering.

**Planned changes:**
- Update `frontend/src/components/SubmissionSelectInput.tsx` so each belt add-submission control opens a dropdown that shows the full submission list by default and live-filters as the user types.
- Present the search input as a compact, visually integrated part of the dropdown experience (at/near the top of the opened dropdown), avoiding separation from the trigger.
- Ensure keyboard accessibility is preserved (type to filter, arrow keys to navigate, enter to select) and that the dropdown closes on selection.
- Limit changes strictly to the four selected add-submission controls and the minimal supporting code required.

**User-visible outcome:** In the Submission Log, each belt’s “Add submission…” dropdown feels cleaner and includes an integrated search that filters options instantly while typing, with full keyboard support.
