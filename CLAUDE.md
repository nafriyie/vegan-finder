# Vegan Finder

A cross-platform mobile app for discovering vegan restaurants, built with Expo (React Native) and TypeScript. Users can browse a map or list of nearby vegan restaurants, filter/sort results, view restaurant details, and save menu items locally.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Google Places API key

# 3. Start the development server
npx expo start
# Press 'w' for web, scan QR with Expo Go for mobile
```

**Requirements:** Node.js 18+, npm. No Xcode or Android Studio needed — use Expo Go on a physical device or the web browser.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Expo SDK 54, React Native 0.81, TypeScript |
| Navigation | Expo Router (file-based routing) |
| Maps (native) | react-native-maps (Google Maps provider) |
| Maps (web) | @react-google-maps/api |
| Location | expo-location |
| Data fetching | TanStack React Query v5 |
| State management | Zustand v5 with AsyncStorage persistence |
| Local storage | @react-native-async-storage/async-storage |
| Icons | @expo/vector-icons (Feather icon set) |
| API | Google Places API (New) — Text Search + Place Details |

## Project Structure

```
app/                        # Expo Router screens
├── _layout.tsx             # Root layout (QueryClientProvider, Stack nav)
├── +not-found.tsx          # 404 screen
├── (tabs)/
│   ├── _layout.tsx         # Tab navigator (Map, Search, Account)
│   ├── index.tsx           # Map view (native — react-native-maps)
│   ├── index.web.tsx       # Map view (web — @react-google-maps/api)
│   ├── list.tsx            # Restaurant list with search/filter
│   └── account.tsx         # Settings and app info
└── restaurant/
    └── [id].tsx            # Restaurant detail (photos, hours, menu)

components/
├── common/                 # LoadingSpinner, EmptyState, ErrorView
├── filters/                # FilterBar, SortSelector, CuisineFilter, PriceFilter
├── map/                    # RestaurantMarker
└── restaurant/             # RestaurantCard, RestaurantHeader, MenuItemCard, AddMenuItemForm

hooks/
├── useLocation.ts          # GPS permissions + location tracking
├── useRestaurants.ts       # Fetch + filter + sort restaurants (React Query)
└── useRestaurantDetail.ts  # Fetch single restaurant details (React Query)

stores/                     # Zustand stores
├── locationStore.ts        # User/custom location state (not persisted)
├── filterStore.ts          # Filter/sort preferences (persisted to AsyncStorage)
└── menuStore.ts            # Saved menu items per restaurant (persisted to AsyncStorage)

lib/
├── api/
│   └── google-places.ts    # Google Places Text Search + Place Details client
└── utils/
    ├── distance.ts         # Haversine distance calculation + formatting
    ├── filtering.ts        # Filter, sort, and deduplicate restaurant lists
    └── formatting.ts       # Price level, rating, address, currency formatting

types/                      # TypeScript interfaces and enums
├── restaurant.ts           # Restaurant, PriceLevel, Photo, OpeningHours
├── menu.ts                 # MenuItem, MenuCategory
├── filters.ts              # FilterState, SortOption, DEFAULT_FILTERS
└── location.ts             # UserLocation, LocationSearchResult

constants/
├── Config.ts               # API keys (from env), search radius, cache times
├── Cuisines.ts             # Cuisine type list (23 cuisines)
└── Theme.ts                # Design tokens: colors, spacing, typography, shadows
```

## Key Architectural Decisions

### Everything is vegan
This app only shows vegan restaurants. There is no `VeganStatus` enum or per-item vegan indicator — it would be redundant. Do not add vegan status fields or badges.

### Google Places API only
Yelp Fusion API was removed because it requires a paid subscription. All restaurant data comes from Google Places API (New). The client uses:
- **Text Search** (`places:searchText`) with `textQuery: "vegan restaurant"` and `locationBias` for nearby results
- **Place Details** (`places/{id}`) for full restaurant info
- **Field masking** via `X-Goog-FieldMask` header to minimize API costs

### Platform-specific map
`react-native-maps` doesn't work on web. Two platform-specific files handle this:
- `app/(tabs)/index.tsx` — native map with react-native-maps
- `app/(tabs)/index.web.tsx` — web map with @react-google-maps/api

Both render the same UI: header, filter bar, map with markers, callout on tap.

### Local-only menu storage
Menu items are stored in AsyncStorage on-device via Zustand persist middleware. No backend, no user accounts. This is the MVP strategy — a cloud backend is planned for post-MVP.

### Uber Eats visual theme
The UI follows Uber Eats styling: clean black/white palette, bold typography, green (#2E8B57) accents, rounded card photos with shadows, generous spacing. All design tokens live in `constants/Theme.ts`. The **layout and features** are original to this app — only the visual theme is inspired by Uber Eats.

## Environment Variables

Only one key is needed for the MVP:

```bash
# .env.local (gitignored)
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
```

This key is used for both the Places API data requests and rendering Google Maps on web. Get it from [Google Cloud Console](https://console.cloud.google.com/) with Places API (New) enabled.

## Conventions

- **Icons:** Feather icon set from `@expo/vector-icons`. Use `<Feather name="..." />`.
- **Path alias:** `@/*` maps to the project root (configured in `tsconfig.json`).
- **Routing:** File-based via Expo Router. Dynamic routes use `[param].tsx`.
- **Styling:** `StyleSheet.create()` with tokens from `Theme.ts`. No external style libraries.
- **State:** Zustand for client state, React Query for server/API state. Don't mix them.
- **Error handling:** API clients return empty arrays/null on failure and log errors. UI shows `ErrorView` or `EmptyState` components.

## Common Tasks

**Add a new screen:** Create a file in `app/` following Expo Router conventions. Add to tab layout if it's a tab.

**Add a new filter:** Update `FilterState` in `types/filters.ts`, add UI in `components/filters/`, update `applyFilters()` in `lib/utils/filtering.ts`.

**Modify restaurant data model:** Update `types/restaurant.ts`, then update the mapping functions in `lib/api/google-places.ts`.

**Type check:** `npx tsc --noEmit`

**Start dev server:** `npx expo start`
