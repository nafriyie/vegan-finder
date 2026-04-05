import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { FilterState } from '@/types/filters';
import { SortOption, DEFAULT_FILTERS } from '@/types/filters';
import { PriceLevel } from '@/types/restaurant';

interface FilterStore extends FilterState {
  setCuisineTypes: (cuisines: string[]) => void;
  toggleCuisine: (cuisine: string) => void;
  setPriceRange: (range: [PriceLevel, PriceLevel]) => void;
  setMinRating: (rating: number) => void;
  setMaxDistance: (distance: number | undefined) => void;
  setSortBy: (sort: SortOption) => void;
  resetFilters: () => void;
  hasActiveFilters: () => boolean;
}

export const useFilterStore = create<FilterStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_FILTERS,

      setCuisineTypes: (cuisines) => set({ cuisineTypes: cuisines }),

      toggleCuisine: (cuisine) => {
        const current = get().cuisineTypes;
        if (current.includes(cuisine)) {
          set({ cuisineTypes: current.filter((c) => c !== cuisine) });
        } else {
          set({ cuisineTypes: [...current, cuisine] });
        }
      },

      setPriceRange: (range) => set({ priceRange: range }),
      setMinRating: (rating) => set({ minRating: rating }),
      setMaxDistance: (distance) => set({ maxDistance: distance }),
      setSortBy: (sort) => set({ sortBy: sort }),

      resetFilters: () => set({ ...DEFAULT_FILTERS }),

      hasActiveFilters: () => {
        const state = get();
        return (
          state.cuisineTypes.length > 0 ||
          state.priceRange[0] !== PriceLevel.BUDGET ||
          state.priceRange[1] !== PriceLevel.VERY_EXPENSIVE ||
          state.minRating > 0 ||
          state.maxDistance !== undefined
        );
      },
    }),
    {
      name: 'vegan-finder-filters',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
