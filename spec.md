# Specification

## Summary
**Goal:** Build a live IPTV TV streaming app called StreamVault TV where users can browse, filter, and watch live TV channels, with per-user favourites persistence on a Motoko backend.

**Planned changes:**

**Backend:**
- Motoko canister storing channel records with fields: id, name, streamUrl, language, country, logoUrl
- CRUD operations: addChannel, getChannels, updateChannel, deleteChannel
- Pre-populate at least 10 sample channels across diverse languages and countries
- Per-user favourites stored by caller principal with addFavourite, removeFavourite, getFavourites

**Frontend:**
- Main channel browser page with a grid layout; each card shows logo, name, language, and country
- Clicking a card loads that channel's stream in an embedded HLS video player (via hls.js)
- Player shows channel name and country as an overlay, with standard controls (play/pause, volume, fullscreen)
- Filter controls above the grid: language dropdown and country dropdown, dynamically populated and combinable
- Favourites heart/star icon on each card that calls addFavourite/removeFavourite on toggle
- "Favourites" filter tab to show only the user's favourited channels; favourite state loaded on page load
- Dark cinematic theme: deep dark backgrounds (#0d0d0d–#1a1a2e), red/amber accents for active states and favourite icons, bold sans-serif typography, glowing card hover effects
- Top navigation bar with app logo (streamvault-logo.png) and filter tabs
- Channels without a logo URL display channel-placeholder.png

**User-visible outcome:** Users can browse a grid of live IPTV channels, filter by language and country, mark favourites, and watch HLS streams directly in the browser within a sleek dark-themed TV app interface.
