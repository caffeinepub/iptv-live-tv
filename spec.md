# Specification

## Summary
**Goal:** Force the entire app to render in dark mode by default, ensuring all components use the existing dark cinematic CSS variable tokens.

**Planned changes:**
- Apply the `dark` class to the HTML root element on initial load so dark mode is always active.
- Remove or override any light-mode fallback styles causing components (navigation bar, channel grid, channel cards, filter controls, video player, modals) to render with light backgrounds or light text.
- Ensure all backgrounds render as deep dark (#0d0d0d to #1a1a2e) and all text renders in light/white tones.

**User-visible outcome:** The app loads in dark mode by default with a consistent cinematic dark theme across all components — no light backgrounds or light text anywhere.
