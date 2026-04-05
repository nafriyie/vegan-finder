import { PriceLevel } from './restaurant';

export enum SortOption {
  DISTANCE = 'distance',
  RATING = 'rating',
  PRICE_LOW_TO_HIGH = 'price_asc',
  PRICE_HIGH_TO_LOW = 'price_desc',
}

export interface FilterState {
  cuisineTypes: string[];
  priceRange: [PriceLevel, PriceLevel];
  minRating: number;
  maxDistance?: number; // meters
  sortBy: SortOption;
}

export const DEFAULT_FILTERS: FilterState = {
  cuisineTypes: [],
  priceRange: [PriceLevel.BUDGET, PriceLevel.VERY_EXPENSIVE],
  minRating: 0,
  maxDistance: undefined,
  sortBy: SortOption.DISTANCE,
};
