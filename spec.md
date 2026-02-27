# Specification

## Summary
**Goal:** Add a functional "Favourites" filtered view within the existing StreamVault channel browser, accessible via the Navigation bar's Favourites tab.

**Planned changes:**
- Wire the existing "Favourites" tab in the Navigation bar to filter the channel grid to show only favourited channels.
- For unauthenticated/M3U users, source favourites from the existing `useLocalFavourites` hook (localStorage).
- For authenticated users, source favourites from the existing backend `getFavourites` call.
- Ensure search, language, and country filters continue to work when the Favourites tab is active.
- Show a friendly empty-state message when no favourites exist (e.g., "No favourites yet — star a channel to save it here").
- Immediately remove a channel card from the Favourites view when its favourite star is toggled off.
- Visually highlight the Favourites tab as active when selected, consistent with the existing dark cinematic theme.

**User-visible outcome:** Users can click the Favourites tab to instantly see only their starred channels, further filter them by search/language/country, and see the list update live when favourites are added or removed.
