import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { searchNearbyRestaurants } from '@/lib/api/google-places';
import { applyFilters, sortRestaurants } from '@/lib/utils/filtering';
import { calculateDistance } from '@/lib/utils/distance';
import { useLocationStore } from '@/stores/locationStore';
import { useFilterStore } from '@/stores/filterStore';
import { Config } from '@/constants/Config';
import type { Restaurant } from '@/types/restaurant';

async function fetchRestaurants(
  lat: number,
  lng: number,
  radius: number
): Promise<Restaurant[]> {
  const results = await searchNearbyRestaurants(lat, lng, radius);

  // Calculate distances
  return results.map((r) => ({
    ...r,
    distance:
      r.distance ??
      calculateDistance(lat, lng, r.location.lat, r.location.lng),
  }));
}

export function useRestaurants() {
  const getActiveLocation = useLocationStore((s) => s.getActiveLocation);
  const activeLocation = getActiveLocation();
  const filters = useFilterStore();

  const query = useQuery({
    queryKey: [
      'restaurants',
      activeLocation?.lat,
      activeLocation?.lng,
      filters.maxDistance ?? Config.DEFAULT_SEARCH_RADIUS,
    ],
    queryFn: () => {
      if (!activeLocation) throw new Error('No location available');
      return fetchRestaurants(
        activeLocation.lat,
        activeLocation.lng,
        filters.maxDistance ?? Config.DEFAULT_SEARCH_RADIUS
      );
    },
    enabled: activeLocation !== null,
    staleTime: Config.CACHE_TIME_NEARBY,
    gcTime: Config.CACHE_TIME_NEARBY * 2,
  });

  // Apply filters and sorting client-side
  const filteredRestaurants = useMemo(() => {
    if (!query.data) return [];
    const filtered = applyFilters(query.data, filters);
    return sortRestaurants(filtered, filters.sortBy);
  }, [query.data, filters]);

  return {
    restaurants: filteredRestaurants,
    allRestaurants: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}
