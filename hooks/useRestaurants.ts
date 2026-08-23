import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { searchNearbyRestaurants } from '@/lib/api/google-places';
import { applyFilters, sortRestaurants } from '@/lib/utils/filtering';
import { calculateDistance } from '@/lib/utils/distance';
import { useLocationStore } from '@/stores/locationStore';
import { useFilterStore } from '@/stores/filterStore';
import { useUsageStore } from '@/stores/usageStore';
import { Config } from '@/constants/Config';
import type { Restaurant } from '@/types/restaurant';
import type { MapBounds, UserLocation } from '@/types/location';

const COORD_PRECISION = 1000; // 3 decimals ≈ 110m
const BOUNDS_PADDING_FACTOR = 0.05; // pad cull bounds by 5% so edge markers don't pop

async function fetchRestaurants(
  searchLat: number,
  searchLng: number,
  anchorLat: number,
  anchorLng: number,
  radius: number,
  bounds: MapBounds | null
): Promise<Restaurant[]> {
  // React Query only invokes queryFn on an actual fetch, so cached reads
  // correctly don't count against the daily tally.
  useUsageStore.getState().recordSearch();

  const results = await searchNearbyRestaurants({
    center: { lat: searchLat, lng: searchLng },
    radius,
    bounds: bounds ?? undefined,
  });
  return results.map((r) => ({
    ...r,
    distance: calculateDistance(anchorLat, anchorLng, r.location.lat, r.location.lng),
  }));
}

function padBounds(b: MapBounds): MapBounds {
  const latPad = (b.north - b.south) * BOUNDS_PADDING_FACTOR;
  const lngPad = (b.east - b.west) * BOUNDS_PADDING_FACTOR;
  return {
    north: b.north + latPad,
    south: b.south - latPad,
    east: b.east + lngPad,
    west: b.west - lngPad,
  };
}

function isInBounds(r: Restaurant, b: MapBounds): boolean {
  return (
    r.location.lat <= b.north &&
    r.location.lat >= b.south &&
    r.location.lng <= b.east &&
    r.location.lng >= b.west
  );
}

export function useRestaurants() {
  const userLocation = useLocationStore((s) => s.userLocation);
  const customLocation = useLocationStore((s) => s.customLocation);
  const isUsingCustomLocation = useLocationStore((s) => s.isUsingCustomLocation);
  // The query follows the *committed* search area only. Panning rewrites the
  // viewport, which culls markers but never spends an API call — the user
  // spends one deliberately via "Search this area".
  const searchCenter = useLocationStore((s) => s.searchCenter);
  const searchAreaRadius = useLocationStore((s) => s.searchRadius);
  const searchBounds = useLocationStore((s) => s.searchBounds);
  const viewBounds = useLocationStore((s) => s.viewBounds);
  const commitInitialArea = useLocationStore((s) => s.commitInitialArea);
  const filters = useFilterStore();

  const activeLocation: UserLocation | null =
    isUsingCustomLocation && customLocation ? customLocation : userLocation;
  const searchLocation = searchCenter ?? activeLocation;
  const searchRadius = Math.min(
    searchAreaRadius ?? filters.maxDistance ?? Config.DEFAULT_SEARCH_RADIUS,
    Config.MAX_SEARCH_RADIUS
  );

  const queryKeyLat = searchLocation
    ? Math.round(searchLocation.lat * COORD_PRECISION) / COORD_PRECISION
    : null;
  const queryKeyLng = searchLocation
    ? Math.round(searchLocation.lng * COORD_PRECISION) / COORD_PRECISION
    : null;
  const queryKeyRadius = Math.round(searchRadius / 100) * 100;
  // Round bounds into the query key so distinct rectangles invalidate
  // (sub-110m wiggles still hash to the same key).
  const queryKeyBounds = searchBounds
    ? [
        Math.round(searchBounds.north * COORD_PRECISION) / COORD_PRECISION,
        Math.round(searchBounds.south * COORD_PRECISION) / COORD_PRECISION,
        Math.round(searchBounds.east * COORD_PRECISION) / COORD_PRECISION,
        Math.round(searchBounds.west * COORD_PRECISION) / COORD_PRECISION,
      ]
    : null;

  const lastSearchedRef = useRef<{ center: UserLocation; radius: number } | null>(
    null
  );

  const query = useQuery({
    queryKey: ['restaurants', queryKeyLat, queryKeyLng, queryKeyRadius, queryKeyBounds],
    queryFn: () => {
      if (!searchLocation || !activeLocation) {
        throw new Error('No location available');
      }
      // Captured rather than read from state later: by the time the pinning
      // effect runs, GPS may have moved activeLocation, and pinning a location
      // the search never used would re-key the query into an extra call.
      lastSearchedRef.current = { center: searchLocation, radius: searchRadius };
      return fetchRestaurants(
        searchLocation.lat,
        searchLocation.lng,
        activeLocation.lat,
        activeLocation.lng,
        searchRadius,
        searchBounds
      );
    },
    enabled: searchLocation !== null && activeLocation !== null,
    staleTime: Config.CACHE_TIME_NEARBY,
    gcTime: Config.CACHE_TIME_NEARBY * 2,
    placeholderData: keepPreviousData,
  });

  // Pin the area the automatic first search covered. Until this lands the query
  // key follows activeLocation, so walking ~110m spends a Text Search call.
  useEffect(() => {
    if (!query.data || searchCenter) return;
    const last = lastSearchedRef.current;
    if (!last) return;
    commitInitialArea(last.center, last.radius);
  }, [query.data, searchCenter, commitInitialArea]);

  // Accumulator: keeps every fetched restaurant so previously-visible markers
  // don't flicker between fetches. Reset when the user explicitly switches
  // active location (new GPS reading or custom location swap).
  const [accumulated, setAccumulated] = useState<Map<string, Restaurant>>(
    () => new Map()
  );
  const lastAnchorRef = useRef<string | null>(null);

  useEffect(() => {
    const key = activeLocation
      ? `${activeLocation.lat},${activeLocation.lng}`
      : null;
    if (key !== lastAnchorRef.current) {
      lastAnchorRef.current = key;
      setAccumulated(new Map());
    }
  }, [activeLocation]);

  useEffect(() => {
    if (!query.data) return;
    setAccumulated((prev) => {
      const next = new Map(prev);
      for (const r of query.data) next.set(r.id, r);
      return next;
    });
  }, [query.data]);

  const visibleRestaurants = useMemo(() => {
    const all = Array.from(accumulated.values());
    const cullBounds = viewBounds ? padBounds(viewBounds) : null;
    const culled = cullBounds ? all.filter((r) => isInBounds(r, cullBounds)) : all;
    const filtered = applyFilters(culled, filters);
    return sortRestaurants(filtered, filters.sortBy);
  }, [accumulated, viewBounds, filters]);

  return {
    restaurants: visibleRestaurants,
    allRestaurants: Array.from(accumulated.values()),
    isLoading: query.isLoading && accumulated.size === 0,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isFetching,
  };
}
