# Knowledge Base — Conversation History & Decisions

This document captures key decisions, context, and rationale from the initial development conversation so future work can build on them without re-deriving context.

---

## Project Origin

The Vegan Finder app was planned and implemented from scratch in a single conversation. The user provided reference images of Uber Eats as design inspiration and a detailed implementation plan (`documentation/app-plan.md`).

## Key Decisions

### 1. Uber Eats Theme — Styling Only, Not Layout
**Decision:** Adopt the Uber Eats visual aesthetic (colors, typography, card styling, spacing) but keep the original app layout and feature set unchanged.

**Context:** The user initially shared Uber Eats screenshots and asked for the UI to be "styled like Uber Eats." When a detailed UI section was proposed that replicated Uber Eats layout patterns (bottom tabs, horizontal scroll cards, pickup/delivery toggle, etc.), the user rejected it — they only wanted the visual theme carried over, not the layout. The app's screens, navigation, and features remain as originally planned.

**Result:** `constants/Theme.ts` contains all design tokens. Black/white palette, green (#2E8B57) accents, bold typography, rounded cards with shadows, Feather icons.

### 2. Everything Is Vegan — No Vegan Status Indicators
**Decision:** Remove all `VeganStatus` enums, `isVegan` boolean fields, and vegan badge UI components. Do not show vegan indicators next to restaurants or menu items.

**Context:** The user stated: "Everything in the app will be vegan, so it is redundant to show a vegan status next to each meal." This means:
- The `VeganStatus` enum was removed from `types/restaurant.ts`
- The `isVegan` field was removed from `types/menu.ts`
- No `VeganBadge` component was created
- Filter options for vegan status were removed from `types/filters.ts` and the filter UI
- The API still searches for "vegan restaurant" — the vegan focus is in the search query, not in per-item labeling

### 3. Yelp API Removed
**Decision:** Remove all Yelp Fusion API integration. Use Google Places API as the sole data source.

**Context:** The user said Yelp "requires a paid subscription after a free trial" which they aren't interested in. All Yelp references were removed:
- Deleted `lib/api/yelp.ts`
- Removed `YELP_API_KEY` from `constants/Config.ts`
- Removed `yelpId` and `'yelp'` source type from `types/restaurant.ts`
- Simplified `hooks/useRestaurants.ts` to only call Google Places (no more parallel fetching or deduplication between sources)
- Updated `.env.example` to only list the Google Places key

### 4. Google Places API — Text Search, Not Nearby Search
**Decision:** Use the `places:searchText` endpoint instead of `places:searchNearby`.

**Context:** The initial implementation used `searchNearby` with a `textQuery` field, which produced a 400 error: "Unknown name 'textQuery': Cannot find field." The Nearby Search endpoint doesn't support `textQuery` — that's a Text Search-only field. The fix:
- Switched from `places:searchNearby` to `places:searchText`
- Changed `locationRestriction` to `locationBias` (preference vs hard boundary — slightly better UX as highly-rated spots just outside the radius can still appear)
- Capped `maxResultCount` at 20 (Text Search limit)

### 5. Web Map Support via Platform-Specific Files
**Decision:** Create `app/(tabs)/index.web.tsx` using `@react-google-maps/api` for web, while native uses `react-native-maps` in `app/(tabs)/index.tsx`.

**Context:** The user is on Ubuntu (no Xcode) and wanted the app to work on web with the same map interface as mobile. `react-native-maps` doesn't support web — it crashes with "Importing react-native internals is not supported on web." The user explicitly rejected a web fallback that showed a list instead of a map: "How can we also get the map interface on the website? Ideally I want the iOS and web implementation to be the same."

**Result:** Both files render the same UX — header, filter bar, interactive map with markers, tap-to-open callouts. The web version uses `@react-google-maps/api` (installed as a dependency) with custom styled markers and InfoWindow components.

### 6. Development Environment — Ubuntu, No Xcode
**Context:** The user runs Ubuntu Linux, not macOS. They cannot use Xcode or iOS Simulator. They develop using:
- `npx expo start` (not `npm run ios`)
- Web browser (press `w`) for quick iteration
- Expo Go app on a physical device (scan QR)
- They have another Expo project (`~/Projects/habitual`) that works this way

### 7. API Key in .env.local
**Context:** The user added their unrestricted Google Places API key to `.env.local`. This file is gitignored (`.env*.local` pattern in `.gitignore`). The key is loaded via `process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` in `constants/Config.ts`.

## Implementation Notes

### Project was built from the `tabs` template
The Expo project was initialized with `npx create-expo-app --template tabs`, then all template boilerplate (EditScreenInfo, Themed components, Colors.ts, modal.tsx, two.tsx, etc.) was removed and replaced with the app's own code.

### Data flow
1. `useLocation` hook requests GPS permission and gets coordinates on mount
2. `useRestaurants` hook fires a React Query fetch when location is available
3. Google Places Text Search returns up to 20 vegan restaurants near the user
4. Client-side: distances are calculated (Haversine), filters applied, results sorted
5. Results render as map markers (native/web) and list cards

### Menu items are local-only
Users can add menu items (name, description, price, category, photos) to any restaurant. These persist in AsyncStorage via Zustand's persist middleware. There's no backend — this is the MVP approach. The plan notes a future Firebase/Supabase backend for syncing.

### 8. Custom Location Search Feature
**Decision:** Allow users to search for any city/address and see vegan restaurants near that location instead of (or instead of waiting for) their GPS location.

**Implementation:**
- `lib/api/geocoding.ts` — new Google Geocoding REST API client (`maps.googleapis.com/maps/api/geocode/json`). Uses the same `GOOGLE_PLACES_API_KEY` as the Places client. Returns up to 5 `LocationSearchResult` objects. Extracts `locality` or `administrative_area_level_1` from address components for a short display name.
- `stores/locationStore.ts` — extended with `customLocationName: string | null`, `recentLocations: LocationSearchResult[]`, and `addRecentLocation()`. Wrapped with Zustand `persist` middleware (key: `vegan-finder-location`, storage: AsyncStorage) so recent locations survive app restarts. `setCustomLocation` now accepts an optional second `name` argument.
- `hooks/useLocation.ts` — exposes `customLocationName`, `recentLocations`, and `addRecentLocation` from the store.
- `components/location/LocationSearchModal.tsx` — bottom-sheet modal (same pattern as `SortSelector`). Default list shows "Current Location" (GPS, always first) + up to 5 persisted recent locations. Once the user types and searches, geocoded results replace the default list. Selecting a new (non-recent) result saves it to recents via `addRecentLocation`.
- `app/(tabs)/index.tsx`, `index.web.tsx`, `list.tsx` — each header gained a `map-pin` button that opens the modal, plus a pill badge showing the active custom location name with an `x` to clear it. The Account screen was intentionally left out.

**Why no changes to `useRestaurants`:** The hook already includes `activeLocation.lat/lng` in its React Query key, so changing the active location via `setCustomLocation` or `clearCustomLocation` automatically triggers a refetch. No additional wiring was needed.

**Scope:** The feature appears on the Map tab (native and web) and the List tab only — not the Account tab.

---

*Last updated: April 2026 — Custom location search feature added*
