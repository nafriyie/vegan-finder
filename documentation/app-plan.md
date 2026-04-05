# Vegan Finder App - Implementation Plan

## Context

Building a cross-platform mobile application (iOS, Android, Web) using Expo to help users discover vegan restaurants and non-vegan restaurants with vegan menu options. The app will provide location-based search with map and list views, detailed restaurant information, and the ability to track menu items with vegan indicators and prices.

**Why this approach:** Since neither Google Places API nor Yelp provide individual menu item data, we'll use a hybrid strategy: leverage APIs for restaurant discovery and basic info, then enable manual menu entry stored locally (extensible to cloud backend later).

## Technical Stack

- **Framework:** Expo SDK 52+ (React Native) with TypeScript
- **Navigation:** Expo Router (file-based routing) with tab navigation
- **Maps:** react-native-maps with Google Maps Platform
- **Location:** expo-location for GPS and permissions
- **Data Sources:**
  - Google Places API (New) for restaurant discovery, ratings, photos
  - Yelp Fusion API as supplementary source
- **Data Fetching:** TanStack Query (React Query) with native fetch
- **State Management:**
  - Zustand for filters, sorting, location state
  - React Query for server data caching
  - AsyncStorage for persisting menu items locally
- **UI:** React Native core components with @expo/vector-icons, styled after Uber Eats

## UI/Design Theme

The app uses a **modern, clean visual theme inspired by Uber Eats** while keeping the original layout and feature set unchanged. The goal is a polished, professional aesthetic.

### Visual Style
- **Color palette:** Primarily black and white with green accents for vegan indicators; minimal use of color to keep the interface clean and modern
- **Typography:** Bold, large headings (e.g., restaurant names); medium weight for metadata (ratings, price, distance); regular/light for descriptions and secondary text
- **Cards:** Large, high-quality food photos as the dominant visual element; rounded corners; subtle shadows for depth/elevation
- **Icons:** Simple, outlined icon style (Feather or MaterialCommunityIcons from @expo/vector-icons); filled/bold when active
- **Spacing:** Generous padding and margins between elements for a spacious, uncluttered feel
- **Backgrounds:** Clean white/light gray backgrounds; no heavy gradients or textures
- **Interactive elements:** Minimal, flat buttons and toggles; subtle press/highlight states
- **Photos:** Rounded corner image cards with consistent aspect ratios; placeholder skeletons while loading

## Project Structure

```
vegan-finder/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab navigator config
│   │   ├── index.tsx            # Map view (default)
│   │   └── list.tsx             # List view
│   ├── restaurant/[id].tsx      # Restaurant detail screen
│   └── _layout.tsx              # Root layout with providers
├── components/                   # Reusable UI components
│   ├── map/                     # MapView, markers
│   ├── restaurant/              # Cards, headers, menu items
│   ├── filters/                 # Filter bar, sort controls
│   └── common/                  # Loading, errors, empty states
├── lib/                         # Core business logic
│   ├── api/
│   │   ├── google-places.ts    # Google Places API client
│   │   └── yelp.ts             # Yelp API client
│   └── utils/
│       ├── distance.ts          # Distance calculations
│       ├── formatting.ts        # Price/address formatting
│       └── filtering.ts         # Filter/sort logic
├── hooks/                       # Custom React hooks
│   ├── useLocation.ts           # Location management
│   ├── useRestaurants.ts        # Fetch restaurants (React Query)
│   └── useRestaurantDetail.ts   # Fetch restaurant details
├── stores/                      # Zustand stores
│   ├── filterStore.ts           # Filters/sorting state (persisted)
│   ├── locationStore.ts         # User/custom location
│   └── menuStore.ts             # Menu items (AsyncStorage)
├── types/                       # TypeScript definitions
│   ├── restaurant.ts            # Restaurant, VeganStatus, PriceLevel
│   ├── menu.ts                  # MenuItem, MenuCategory
│   ├── filters.ts               # FilterState, SortOption
│   └── location.ts              # UserLocation, LocationSearchResult
├── constants/
│   ├── Config.ts                # API keys, env vars
│   └── Cuisines.ts              # Cuisine types list
├── .env.local                   # Environment variables (gitignored)
└── app.json                     # Expo configuration
```

## Data Models

### Core Types

**Restaurant:**
```typescript
enum VeganStatus {
  FULLY_VEGAN = 'fully_vegan',
  VEGAN_OPTIONS = 'vegan_options',
  UNKNOWN = 'unknown'
}

enum PriceLevel {
  BUDGET = 1,        // $
  MODERATE = 2,      // $$
  EXPENSIVE = 3,     // $$$
  VERY_EXPENSIVE = 4 // $$$$
}

interface Restaurant {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  totalRatings: number;
  priceLevel?: PriceLevel;
  cuisineTypes: string[];
  veganStatus: VeganStatus;
  phone?: string;
  website?: string;
  hours?: OpeningHours;
  photos: Photo[];
  distance?: number; // meters from user
  source: 'google' | 'yelp';
  googlePlaceId?: string;
  yelpId?: string;
}
```

**MenuItem:**
```typescript
interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  category: string;
  isVegan: boolean;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Filters:**
```typescript
enum SortOption {
  DISTANCE = 'distance',
  RATING = 'rating',
  PRICE_LOW_TO_HIGH = 'price_asc',
  PRICE_HIGH_TO_LOW = 'price_desc',
  CUISINE = 'cuisine'
}

interface FilterState {
  veganStatus: VeganStatus[];
  cuisineTypes: string[];
  priceRange: [PriceLevel, PriceLevel];
  minRating: number;
  maxDistance?: number;
  sortBy: SortOption;
}
```

## Implementation Phases

### Phase 1: Project Setup (Week 1)

**Goal:** Get basic app structure running

**Tasks:**
1. Initialize Expo project: `npx create-expo-app@latest vegan-finder --template tabs`
2. Install dependencies:
   ```bash
   npx expo install expo-router expo-location react-native-maps
   npm install @tanstack/react-query zustand axios
   ```
3. Set up folder structure (create all directories above)
4. Configure TypeScript types in `/types` directory
5. Set up environment variables (`.env.local`, `.env.example`)
6. Configure `app.json` with location permissions and Google Maps keys
7. Create basic screen layouts (Map, List, Detail) with placeholder content
8. Test app runs on iOS simulator, Android emulator, and web

**Critical Files:**
- `types/restaurant.ts` - Core type definitions
- `app/_layout.tsx` - Root layout with React Query provider
- `app/(tabs)/_layout.tsx` - Tab navigator
- `.env.example` - Environment variable template

### Phase 2: Google Maps API Setup & Location (Week 2)

**Goal:** Display user location on map

**Google Maps Platform Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project or select existing
3. **Enable billing** (required for Places API)
4. Navigate to "APIs & Services" → "Library"
5. Enable these APIs:
   - **Places API (New)**
   - **Maps SDK for Android**
   - **Maps SDK for iOS**
6. Go to "Credentials" → "Create credentials" → "API key"
7. **Restrict the API key:**
   - For development: Add IP restrictions
   - For production: Use app signing certificates
   - Limit to only enabled APIs above
8. Set daily quota limits to prevent overages (e.g., 1,000 requests/day for dev)
9. Copy API keys to `.env.local`:
   ```
   EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_key_here
   GOOGLE_MAPS_ANDROID_API_KEY=your_android_key
   GOOGLE_MAPS_IOS_API_KEY=your_ios_key
   ```

**Implementation Tasks:**
1. Create `stores/locationStore.ts` - Manage user/custom location state
2. Create `hooks/useLocation.ts` - Handle permissions and GPS tracking
3. Implement map view in `app/(tabs)/index.tsx` with react-native-maps
4. Configure Google Maps in `app.json` (iOS infoPlist, Android config)
5. Display user location marker on map
6. Add custom location search component
7. Test location permissions on iOS and Android

**Critical Files:**
- `stores/locationStore.ts` - Location state management
- `hooks/useLocation.ts` - Location permission handling
- `app/(tabs)/index.tsx` - Map view screen
- `app.json` - Google Maps API key configuration

### Phase 3: API Integration (Week 3-4)

**Goal:** Fetch and display real restaurant data

**Google Places API Strategy:**
- Use **Nearby Search (New)** endpoint: `POST https://places.googleapis.com/v1/places:searchNearby`
- Use **Place Details (New)** endpoint: `GET https://places.googleapis.com/v1/places/{PLACE_ID}`
- Implement **field masking** to reduce costs (only request needed fields)
- Make two parallel searches:
  1. Fully vegan restaurants (keyword: "vegan restaurant")
  2. Restaurants with vegan options (keyword: "vegan options")

**Implementation Tasks:**
1. Create `lib/api/google-places.ts`:
   - `searchNearbyRestaurants(lat, lng, radius)` - Nearby search
   - `getPlaceDetails(placeId)` - Detailed info
   - `getPhotoUrl(photoReference)` - Photo URLs
   - Implement field masking for cost optimization
2. Create `lib/api/yelp.ts`:
   - `searchYelp(lat, lng, radius)` - Search with vegan/vegetarian categories
3. Create `hooks/useRestaurants.ts`:
   - Use React Query for caching
   - Call both Google and Yelp APIs in parallel
   - Deduplicate results by name/location similarity
   - Calculate distances from user location
   - Apply filters and sorting
4. Create `lib/utils/filtering.ts`:
   - `applyFilters()` - Filter by vegan status, cuisine, price, rating
   - `sortRestaurants()` - Sort by distance, rating, price, cuisine
5. Display restaurant markers on map view
6. Display restaurant cards in list view
7. Handle loading/error states with proper UI feedback

**Deduplication Logic:**
- First check for matching Google Place IDs
- Then check by name similarity (>85%) + proximity (<50m)
- Merge data: prefer Google for coordinates, combine ratings

**Cost Optimization:**
- Field mask for nearby search (only essential fields)
- Cache results for 5 minutes (React Query)
- Limit initial results to 50 restaurants
- Lazy load details only when user clicks

**Critical Files:**
- `lib/api/google-places.ts` - Google Places API client ⭐
- `hooks/useRestaurants.ts` - Main data fetching hook ⭐
- `lib/utils/filtering.ts` - Filter and sort logic
- `components/map/RestaurantMarker.tsx` - Custom map markers
- `components/restaurant/RestaurantCard.tsx` - List item component

### Phase 4: Filtering & Sorting (Week 5)

**Goal:** Allow users to customize restaurant results

**Implementation Tasks:**
1. Create `stores/filterStore.ts`:
   - Store filter state (vegan status, cuisine, price, rating, distance)
   - Store sort preference
   - Persist to AsyncStorage using Zustand persist middleware
2. Create filter UI components:
   - `components/filters/FilterBar.tsx` - Container for all filters
   - `components/filters/SortSelector.tsx` - Dropdown for sort options
   - `components/filters/CuisineFilter.tsx` - Multi-select cuisine chips
   - `components/filters/PriceFilter.tsx` - Price level slider
3. Integrate filters with `useRestaurants` hook
4. Update both map and list views to respect filters
5. Add "Reset Filters" button
6. Test filter persistence across app restarts

**Filter Features:**
- Vegan Status: Fully Vegan, Vegan Options, or both
- Cuisine Types: Multi-select (Italian, Asian, American, etc.)
- Price Range: Slider from $ to $$$$
- Minimum Rating: 0 to 5 stars
- Maximum Distance: 1km to 50km radius
- Sort By: Distance, Rating, Price (low/high), Cuisine

**Critical Files:**
- `stores/filterStore.ts` - Filter state with persistence ⭐
- `components/filters/FilterBar.tsx` - Main filter UI

### Phase 5: Restaurant Details (Week 6)

**Goal:** Show comprehensive restaurant information

**Implementation Tasks:**
1. Create `hooks/useRestaurantDetail.ts`:
   - Fetch full place details from Google Places API
   - Cache for 1 hour (longer than nearby search)
2. Implement `app/restaurant/[id].tsx` screen:
   - Restaurant header with name, rating, price
   - Photo gallery (swipeable)
   - Address with map snippet
   - Opening hours with current status (open/closed)
   - Phone number (tappable to call)
   - Website link (opens in browser)
   - Directions button (opens in maps app)
3. Create detail components:
   - `components/restaurant/RestaurantHeader.tsx`
   - `components/restaurant/VeganBadge.tsx`
4. Handle photo loading with placeholders
5. Add error handling for missing data

**Critical Files:**
- `app/restaurant/[id].tsx` - Detail screen ⭐
- `hooks/useRestaurantDetail.ts` - Detail fetching hook
- `components/restaurant/RestaurantHeader.tsx`

### Phase 6: Menu Management (Week 7)

**Goal:** Enable users to add and view menu items locally

**Implementation Tasks:**
1. Create `stores/menuStore.ts`:
   - Store menu items keyed by restaurant ID
   - Persist to AsyncStorage
   - CRUD operations: add, update, delete menu items
2. Create menu UI components:
   - `components/restaurant/MenuItemCard.tsx` - Display menu item
   - Add menu item form (modal or new screen)
   - Category grouping (Appetizers, Mains, Desserts, etc.)
3. Integrate into restaurant detail screen:
   - Show "Menu Items" section
   - Display existing menu items
   - "Add Menu Item" button
   - Filter toggle for "Show only vegan items"
4. Add photo picker for menu items (expo-image-picker)
5. Implement edit/delete actions
6. Show vegan indicator badge on each item

**Menu Item Features:**
- Name, description, price, currency
- Category (Appetizers, Mains, Sides, Desserts, Drinks)
- Vegan indicator (boolean toggle)
- Photos (optional, multiple)
- Created/updated timestamps

**Data Strategy (MVP):**
- Store locally in AsyncStorage only
- No user accounts needed
- Menu data stays on device
- Good for personal use

**Future Extension Path:**
- Add Firebase/Supabase backend
- Sync menu items across devices
- Community contributions
- Photo uploads to CDN
- Moderation/verification system

**Critical Files:**
- `stores/menuStore.ts` - Menu state with AsyncStorage ⭐
- `components/restaurant/MenuItemCard.tsx`
- Menu item form component

### Phase 7: Polish & Optimization (Week 8)

**Goal:** Improve UX and performance for production readiness

**Implementation Tasks:**
1. Add loading skeletons for list items
2. Create error boundaries for graceful error handling
3. Add empty states with helpful messages and actions
4. Implement pull-to-refresh on list view
5. Optimize API field masking (review and minimize fields)
6. Add image caching and lazy loading
7. Implement map clustering for dense restaurant areas
8. Add haptic feedback for interactions (iOS)
9. Accessibility improvements:
   - Add accessible labels
   - Test with screen readers
   - Ensure sufficient color contrast
10. Cross-platform testing:
    - iOS simulator + physical device
    - Android emulator + physical device
    - Web browser (Chrome, Safari, Firefox)
11. Performance profiling:
    - Monitor API response times
    - Check FlatList scroll performance
    - Measure app launch time
    - Monitor memory usage

**Performance Targets:**
- API calls complete in < 2 seconds
- Map renders smoothly at 60 fps
- List scrolls smoothly with 100+ items
- App launches in < 3 seconds
- Memory usage < 150 MB

## Critical Files Summary

These 5 files are the backbone of the application and should be implemented first:

1. **`types/restaurant.ts`** - Complete TypeScript type definitions used throughout the app
2. **`lib/api/google-places.ts`** - Google Places API integration with cost optimization
3. **`hooks/useRestaurants.ts`** - Central React Query hook orchestrating all data fetching
4. **`stores/filterStore.ts`** - Filter/sort state management with persistence
5. **`app/(tabs)/index.tsx`** - Main map view integrating location, data, and UI

## API Cost Management

**Google Places API Pricing (2025):**
- Pricing is now subscription-based with free monthly limits
- Nearby Search (Essentials): 10,000 free calls/month
- Place Details (Essentials): 10,000 free calls/month
- Set billing alerts in Google Cloud Console
- Monitor usage dashboard weekly

**Cost Optimization Strategies:**
1. **Field Masking:** Only request needed fields (reduces per-call cost)
2. **Caching:** React Query caches for 5-30 minutes
3. **Request Batching:** Combine nearby searches when possible
4. **Local Storage:** Cache restaurant data in AsyncStorage
5. **Quota Limits:** Set daily caps in Google Cloud Console
6. **Progressive Loading:** Load details only when user taps restaurant

**Expected Usage (Personal Use):**
- ~10 searches per day = 300/month (well within free tier)
- ~20 detail views per day = 600/month (within free tier)
- Total cost: $0/month for typical personal use

## Verification & Testing

### Manual Testing Checklist

**Location Features:**
- [ ] Location permission prompt appears on first launch
- [ ] User location displays as blue dot on map
- [ ] Can search custom location (e.g., "San Francisco, CA")
- [ ] Map centers on selected location
- [ ] Distance calculations show accurate km/miles

**Restaurant Discovery:**
- [ ] Restaurants load on both map and list views
- [ ] Both fully vegan and vegan-option restaurants appear
- [ ] No duplicate restaurants between Google/Yelp
- [ ] Restaurant markers are tappable
- [ ] Restaurant cards navigate to detail screen
- [ ] Photos load with placeholders

**Filtering & Sorting:**
- [ ] Can filter by vegan status (fully vegan vs options)
- [ ] Can filter by cuisine types
- [ ] Can filter by price level ($ to $$$$)
- [ ] Can filter by minimum rating
- [ ] Can filter by maximum distance
- [ ] Sort by distance works (closest first)
- [ ] Sort by rating works (highest first)
- [ ] Sort by price works (both directions)
- [ ] Filters persist after app restart

**Restaurant Details:**
- [ ] All restaurant info displays correctly
- [ ] Photo gallery is swipeable
- [ ] Phone number opens dialer
- [ ] Website opens in browser
- [ ] Directions opens maps app
- [ ] Opening hours show correct status

**Menu Management:**
- [ ] Can add new menu item
- [ ] Can edit existing menu item
- [ ] Can delete menu item
- [ ] Can add photo to menu item
- [ ] Menu items persist after app restart
- [ ] Vegan indicator displays correctly
- [ ] Price formatting is correct

**Cross-Platform:**
- [ ] Works on iOS simulator
- [ ] Works on Android emulator
- [ ] Works in web browser
- [ ] Works on physical iOS device
- [ ] Works on physical Android device
- [ ] Location permissions work on all platforms
- [ ] Maps display correctly on all platforms

### Performance Testing

**Metrics to Monitor:**
- Initial app load time: < 3 seconds
- API response time: < 2 seconds
- Map frame rate: 60 fps
- List scroll smoothness: No jank with 100+ items
- Memory usage: < 150 MB
- Image load time: < 1 second per photo

**Tools:**
- React DevTools Profiler
- Expo Performance Monitor
- Chrome DevTools (for web)
- Xcode Instruments (for iOS)
- Android Profiler (for Android)

### API Testing

**Google Places API:**
- [ ] Nearby search returns results
- [ ] Place details load correctly
- [ ] Photo URLs are valid
- [ ] Field masking works (check network requests)
- [ ] Rate limiting handled gracefully
- [ ] Error responses handled properly

**Yelp API:**
- [ ] Search returns vegan restaurants
- [ ] Category filtering works
- [ ] Results merge with Google without duplicates
- [ ] Authentication works correctly

## Future Enhancements (Post-MVP)

### Phase 2 Features (Months 3-6):

1. **User Authentication & Sync**
   - Firebase Auth or Clerk for login
   - Sync menu items across devices
   - Save favorite restaurants
   - Personal collections/lists

2. **Community Features**
   - Submit menu items to shared database
   - Vote on menu item accuracy
   - Upload photos for verification
   - Report incorrect information
   - User reviews and ratings

3. **Enhanced Search**
   - Search by restaurant name
   - Search by specific menu items
   - Advanced dietary filters (gluten-free, nut-free, soy-free)
   - Allergen warnings
   - Nutritional information

4. **Offline Mode**
   - Cache restaurants for offline viewing
   - Download map tiles for offline use
   - Queue menu submissions for later sync
   - Offline-first architecture

5. **Social Features**
   - Share restaurants via link/QR code
   - Create and share restaurant collections
   - Follow other users
   - Comments and discussions

6. **Backend Infrastructure**
   - Firebase/Supabase for data storage
   - Cloud Functions for data aggregation
   - Image CDN for menu photos
   - Admin panel for moderation
   - Analytics dashboard

7. **AI Enhancements**
   - OCR to scan physical menus
   - Computer vision for vegan dish recognition
   - Natural language search ("spicy vegan pasta near me")
   - Personalized recommendations based on history

8. **Monetization (If App Store)**
   - Premium tier for advanced features
   - Restaurant partnerships (promoted listings)
   - Affiliate links for delivery services
   - Remove ads for premium users

## Dependencies

**Core Dependencies:**
```json
{
  "expo": "~52.0.0",
  "expo-router": "~4.0.0",
  "expo-location": "~18.0.0",
  "react-native-maps": "1.18.0",
  "@tanstack/react-query": "^5.0.0",
  "zustand": "^4.5.0",
  "axios": "^1.7.0",
  "@expo/vector-icons": "^14.0.0",
  "react-native-gesture-handler": "~2.20.0",
  "@react-native-async-storage/async-storage": "2.0.0",
  "expo-constants": "~17.0.0"
}
```

**Dev Dependencies:**
```json
{
  "@types/react": "~18.2.79",
  "typescript": "~5.3.3"
}
```

## Environment Variables

**`.env.local`** (gitignored):
```bash
# Google Places API (for restaurant search)
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your_google_places_key

# Yelp Fusion API (supplementary data)
EXPO_PUBLIC_YELP_API_KEY=your_yelp_api_key

# Google Maps (for react-native-maps display)
GOOGLE_MAPS_ANDROID_API_KEY=your_android_maps_key
GOOGLE_MAPS_IOS_API_KEY=your_ios_maps_key
```

**`.env.example`** (committed to git):
```bash
# Copy this file to .env.local and fill in your API keys

# Google Places API
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=

# Yelp Fusion API
EXPO_PUBLIC_YELP_API_KEY=

# Google Maps
GOOGLE_MAPS_ANDROID_API_KEY=
GOOGLE_MAPS_IOS_API_KEY=
```

## Success Criteria

The MVP is complete when:

1. ✅ App runs on iOS, Android, and Web
2. ✅ Users can see their current location on a map
3. ✅ Users can search for custom locations
4. ✅ Restaurants appear as markers on map
5. ✅ Restaurants display in scrollable list view
6. ✅ Can filter by vegan status, cuisine, price, rating, distance
7. ✅ Can sort by distance, rating, or price
8. ✅ Tapping restaurant shows detailed information
9. ✅ Can add menu items with vegan indicators and prices
10. ✅ Menu items persist locally across app restarts
11. ✅ Photos display for restaurants and menu items
12. ✅ No crashes, smooth performance
13. ✅ API costs stay within free tier for personal use

## Timeline Summary

- **Week 1:** Project setup and basic structure
- **Week 2:** Location services and map display
- **Weeks 3-4:** API integration and restaurant discovery
- **Week 5:** Filtering and sorting
- **Week 6:** Restaurant detail screen
- **Week 7:** Menu management system
- **Week 8:** Polish, optimization, and testing

**Total Time:** 8 weeks for MVP

**Extension to App Store:** +4-6 weeks for backend, auth, community features, and app store submission process
