import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useFilterStore } from '@/stores/filterStore';
import { SortOption } from '@/types/filters';
import { PriceLevel } from '@/types/restaurant';
import { CUISINE_TYPES } from '@/constants/Cuisines';
import { SortSelector } from './SortSelector';
import { CuisineFilter } from './CuisineFilter';
import { PriceFilter } from './PriceFilter';
import { useState } from 'react';

export function FilterBar() {
  const filters = useFilterStore();
  const [showSortModal, setShowSortModal] = useState(false);
  const [showCuisineModal, setShowCuisineModal] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);

  const hasFilters = filters.hasActiveFilters();

  return (
    <>
      <View style={styles.container}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Sort */}
          <TouchableOpacity
            style={styles.chip}
            onPress={() => setShowSortModal(true)}
          >
            <Feather name="sliders" size={14} color={Theme.colors.textPrimary} />
            <Text style={styles.chipText}>Sort</Text>
          </TouchableOpacity>

          {/* Cuisine */}
          <TouchableOpacity
            style={[
              styles.chip,
              filters.cuisineTypes.length > 0 && styles.chipActive,
            ]}
            onPress={() => setShowCuisineModal(true)}
          >
            <Text
              style={[
                styles.chipText,
                filters.cuisineTypes.length > 0 && styles.chipTextActive,
              ]}
            >
              Cuisine
              {filters.cuisineTypes.length > 0
                ? ` (${filters.cuisineTypes.length})`
                : ''}
            </Text>
          </TouchableOpacity>

          {/* Price */}
          <TouchableOpacity
            style={[
              styles.chip,
              (filters.priceRange[0] !== PriceLevel.BUDGET ||
                filters.priceRange[1] !== PriceLevel.VERY_EXPENSIVE) &&
                styles.chipActive,
            ]}
            onPress={() => setShowPriceModal(true)}
          >
            <Text
              style={[
                styles.chipText,
                (filters.priceRange[0] !== PriceLevel.BUDGET ||
                  filters.priceRange[1] !== PriceLevel.VERY_EXPENSIVE) &&
                  styles.chipTextActive,
              ]}
            >
              Price
            </Text>
          </TouchableOpacity>

          {/* Rating chips */}
          {[4, 3].map((rating) => (
            <TouchableOpacity
              key={rating}
              style={[
                styles.chip,
                filters.minRating === rating && styles.chipActive,
              ]}
              onPress={() =>
                filters.setMinRating(
                  filters.minRating === rating ? 0 : rating
                )
              }
            >
              <Feather
                name="star"
                size={12}
                color={
                  filters.minRating === rating
                    ? Theme.colors.white
                    : Theme.colors.star
                }
              />
              <Text
                style={[
                  styles.chipText,
                  filters.minRating === rating && styles.chipTextActive,
                ]}
              >
                {rating}+
              </Text>
            </TouchableOpacity>
          ))}

          {/* Reset */}
          {hasFilters && (
            <TouchableOpacity
              style={styles.resetChip}
              onPress={filters.resetFilters}
            >
              <Feather name="x" size={14} color={Theme.colors.error} />
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Modals */}
      <SortSelector
        visible={showSortModal}
        current={filters.sortBy}
        onSelect={(sort) => {
          filters.setSortBy(sort);
          setShowSortModal(false);
        }}
        onClose={() => setShowSortModal(false)}
      />
      <CuisineFilter
        visible={showCuisineModal}
        selected={filters.cuisineTypes}
        onToggle={filters.toggleCuisine}
        onClose={() => setShowCuisineModal(false)}
      />
      <PriceFilter
        visible={showPriceModal}
        range={filters.priceRange}
        onSelect={filters.setPriceRange}
        onClose={() => setShowPriceModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  scrollContent: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.white,
  },
  chipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  chipText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textPrimary,
    fontWeight: Theme.fontWeight.medium,
  },
  chipTextActive: {
    color: Theme.colors.white,
  },
  resetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
  },
  resetText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.error,
    fontWeight: Theme.fontWeight.medium,
  },
});
