import { CUISINE_COLORS, DEFAULT_CUISINE_COLOR } from '@/constants/Cuisines';
import type { CuisineType } from '@/constants/Cuisines';
import type { Restaurant } from '@/types/restaurant';

/**
 * Primary cuisine for a restaurant — the first entry, which mapCuisineTypes
 * orders so regional cuisines outrank format labels like "Cafe".
 */
export function getPrimaryCuisine(restaurant: Restaurant): string {
  return restaurant.cuisineTypes[0] ?? 'Other';
}

/** Marker colour for a restaurant. Shared by the web and native maps. */
export function getCuisineColor(restaurant: Restaurant): string {
  return getCuisineColorByName(getPrimaryCuisine(restaurant));
}

export function getCuisineColorByName(cuisine: string): string {
  return CUISINE_COLORS[cuisine as CuisineType] ?? DEFAULT_CUISINE_COLOR;
}
