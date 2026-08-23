import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserLocation, LocationSearchResult, MapBounds } from '@/types/location';

interface LocationState {
  userLocation: UserLocation | null;
  customLocation: UserLocation | null;
  customLocationName: string | null;
  recentLocations: LocationSearchResult[];
  isUsingCustomLocation: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  /** Live viewport, rewritten on every map idle. Never triggers a fetch. */
  viewCenter: UserLocation | null;
  viewRadius: number | null;
  viewBounds: MapBounds | null;
  /** The area the last search actually covered. Only this drives the query. */
  searchCenter: UserLocation | null;
  searchRadius: number | null;
  searchBounds: MapBounds | null;

  setUserLocation: (location: UserLocation) => void;
  setCustomLocation: (location: UserLocation | null, name?: string) => void;
  setPermissionStatus: (status: 'undetermined' | 'granted' | 'denied') => void;
  clearCustomLocation: () => void;
  addRecentLocation: (result: LocationSearchResult) => void;
  setViewport: (center: UserLocation, radius: number, bounds: MapBounds) => void;
  /** Promote the current viewport to the search area — costs one API call. */
  commitSearchArea: () => void;
  /** Record the area the automatic first search already covered. */
  commitInitialArea: (center: UserLocation, radius: number) => void;
  clearMapView: () => void;
}

// ~110m, matching COORD_PRECISION in hooks/useRestaurants.ts
const COORD_PRECISION = 1000;

function roundCoord(value: number): number {
  return Math.round(value * COORD_PRECISION) / COORD_PRECISION;
}

function sameCoord(a: UserLocation | null, b: UserLocation | null): boolean {
  if (!a || !b) return a === b;
  return roundCoord(a.lat) === roundCoord(b.lat) && roundCoord(a.lng) === roundCoord(b.lng);
}

function sameRadius(a: number | null, b: number | null): boolean {
  if (a == null || b == null) return a === b;
  return Math.round(a / 100) === Math.round(b / 100);
}

function sameBounds(a: MapBounds | null, b: MapBounds | null): boolean {
  if (!a || !b) return a === b;
  return (
    roundCoord(a.north) === roundCoord(b.north) &&
    roundCoord(a.south) === roundCoord(b.south) &&
    roundCoord(a.east) === roundCoord(b.east) &&
    roundCoord(a.west) === roundCoord(b.west)
  );
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      userLocation: null,
      customLocation: null,
      customLocationName: null,
      recentLocations: [],
      isUsingCustomLocation: false,
      permissionStatus: 'undetermined',
      viewCenter: null,
      viewRadius: null,
      viewBounds: null,
      searchCenter: null,
      searchRadius: null,
      searchBounds: null,

      setUserLocation: (location) => set({ userLocation: location }),

      setCustomLocation: (location, name) =>
        set({
          customLocation: location,
          isUsingCustomLocation: location !== null,
          customLocationName: name ?? null,
          viewCenter: null,
          viewRadius: null,
          viewBounds: null,
          searchCenter: null,
          searchRadius: null,
          searchBounds: null,
        }),

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      clearCustomLocation: () =>
        set({
          customLocation: null,
          isUsingCustomLocation: false,
          customLocationName: null,
          viewCenter: null,
          viewRadius: null,
          viewBounds: null,
          searchCenter: null,
          searchRadius: null,
          searchBounds: null,
        }),

      addRecentLocation: (result) => {
        const current = get().recentLocations;
        const deduped = current.filter((r) => r.address !== result.address);
        set({ recentLocations: [result, ...deduped].slice(0, 5) });
      },

      setViewport: (center, radius, bounds) => {
        // Google fires `idle` after programmatic pans and sub-metre drifts too.
        // Writing unconditionally notified every subscriber on each one, which
        // re-rendered the map screen constantly. Skip writes that round to the
        // same view — below this precision nothing downstream can change.
        const state = get();
        if (
          sameCoord(state.viewCenter, center) &&
          sameRadius(state.viewRadius, radius) &&
          sameBounds(state.viewBounds, bounds)
        ) {
          return;
        }
        set({ viewCenter: center, viewRadius: radius, viewBounds: bounds });
      },

      commitInitialArea: (center, radius) => {
        // The first search of a session runs off activeLocation, so the query
        // key tracked GPS — and the position watch pushes an update every 50m,
        // re-keying the query into another paid call just for walking around.
        // Pinning what that search covered stops the drift.
        //
        // searchBounds stays null on purpose: that search used a radius circle
        // (locationBias), not a rectangle, and writing a rectangle here would
        // both misreport the covered area and change the query key, costing the
        // exact call this is meant to save.
        if (get().searchCenter) return;
        set({ searchCenter: center, searchRadius: radius });
      },

      commitSearchArea: () => {
        const { viewCenter, viewRadius, viewBounds } = get();
        if (!viewCenter || viewRadius == null || !viewBounds) return;
        set({
          searchCenter: viewCenter,
          searchRadius: viewRadius,
          searchBounds: viewBounds,
        });
      },

      clearMapView: () =>
        set({
          viewCenter: null,
          viewRadius: null,
          viewBounds: null,
          searchCenter: null,
          searchRadius: null,
          searchBounds: null,
        }),

    }),
    {
      name: 'vegan-finder-location',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) =>
        ({
          userLocation: state.userLocation,
          customLocation: state.customLocation,
          customLocationName: state.customLocationName,
          recentLocations: state.recentLocations,
          isUsingCustomLocation: state.isUsingCustomLocation,
        }) as Partial<LocationState>,
    }
  )
);
