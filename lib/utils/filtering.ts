import type { Restaurant } from '@/types/restaurant';
import type { FilterState } from '@/types/filters';
import { SortOption } from '@/types/filters';

export function applyFilters(
  restaurants: Restaurant[],
  filters: FilterState
): Restaurant[] {
  return restaurants.filter((r) => {
    // Cuisine filter
    if (
      filters.cuisineTypes.length > 0 &&
      !r.cuisineTypes.some((c) => filters.cuisineTypes.includes(c))
    ) {
      return false;
    }

    // Price range filter
    if (r.priceLevel !== undefined) {
      if (
        r.priceLevel < filters.priceRange[0] ||
        r.priceLevel > filters.priceRange[1]
      ) {
        return false;
      }
    }

    // Minimum rating filter
    if (filters.minRating > 0 && r.rating < filters.minRating) {
      return false;
    }

    // Max distance filter
    if (
      filters.maxDistance !== undefined &&
      r.distance !== undefined &&
      r.distance > filters.maxDistance
    ) {
      return false;
    }

    return true;
  });
}

export function sortRestaurants(
  restaurants: Restaurant[],
  sortBy: SortOption
): Restaurant[] {
  const sorted = [...restaurants];

  switch (sortBy) {
    case SortOption.DISTANCE:
      sorted.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
      break;
    case SortOption.RATING:
      sorted.sort((a, b) => b.rating - a.rating);
      break;
    case SortOption.PRICE_LOW_TO_HIGH:
      sorted.sort(
        (a, b) => (a.priceLevel ?? 99) - (b.priceLevel ?? 99)
      );
      break;
    case SortOption.PRICE_HIGH_TO_LOW:
      sorted.sort(
        (a, b) => (b.priceLevel ?? 0) - (a.priceLevel ?? 0)
      );
      break;
  }

  return sorted;
}

/**
 * Deduplicate restaurants from multiple sources.
 * Matches by name similarity + proximity.
 */
export function deduplicateRestaurants(
  restaurants: Restaurant[]
): Restaurant[] {
  const unique: Restaurant[] = [];

  for (const restaurant of restaurants) {
    const isDuplicate = unique.some((existing) => {
      // Check name similarity (simple lowercase comparison)
      const nameSimilar =
        existing.name.toLowerCase().replace(/[^a-z0-9]/g, '') ===
        restaurant.name.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (!nameSimilar) return false;

      // Check proximity (within 100m)
      const latDiff = Math.abs(existing.location.lat - restaurant.location.lat);
      const lngDiff = Math.abs(existing.location.lng - restaurant.location.lng);
      // ~0.001 degrees ≈ 111m
      return latDiff < 0.001 && lngDiff < 0.001;
    });

    if (!isDuplicate) {
      unique.push(restaurant);
    }
  }

  return unique;
}
