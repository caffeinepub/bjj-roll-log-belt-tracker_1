# Specification

## Summary
**Goal:** Add a reusable, animated Google Lens-style multicolor gradient glow highlight and apply it only to specific header, dashboard tab, and welcome/login page elements, working well in both light and dark themes.

**Planned changes:**
- Implement an animated multicolor gradient glow style (blue → green → yellow → red) as reusable utilities/classes (e.g., Tailwind utilities and/or CSS utility classes) suitable for light and dark themes.
- Apply the animated glow styling in the header only to: (a) the “Jiu-Jitsu Journey” title text, and (b) the desktop Profile button; keep other header controls unchanged.
- Update dashboard tab navigation so only the currently selected tab uses the animated multicolor gradient as the full button background; non-selected tabs retain existing styling.
- Update the welcome/login page to apply the animated glow styling only to: (a) the BJJ icon, (b) the “Login with Internet Identity” button, and (c) exactly four rounded areas (the rounded info panel and the three feature tiles), while maintaining readability/accessibility in both themes.

**User-visible outcome:** Users see a subtle animated multicolor gradient glow on the specified elements (header title + Profile button, selected dashboard tab backgrounds, and specific welcome/login elements) in both light and dark mode, with all other UI styling unchanged.
