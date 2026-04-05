import { useQuery } from '@tanstack/react-query';
import { getPlaceDetails } from '@/lib/api/google-places';
import { Config } from '@/constants/Config';
import type { Restaurant } from '@/types/restaurant';

export function useRestaurantDetail(restaurantId: string) {
  // Extract the google place ID from the composite ID (e.g., "google_ChIJ...")
  const isGooglePlace = restaurantId.startsWith('google_');
  const placeId = isGooglePlace ? restaurantId.replace('google_', '') : null;

  const query = useQuery<Restaurant | null>({
    queryKey: ['restaurant-detail', restaurantId],
    queryFn: async () => {
      if (!placeId) return null;
      return getPlaceDetails(placeId);
    },
    enabled: placeId !== null,
    staleTime: Config.CACHE_TIME_DETAILS,
    gcTime: Config.CACHE_TIME_DETAILS * 2,
  });

  return {
    restaurant: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  };
}
