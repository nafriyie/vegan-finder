import { useState } from 'react';
import { FlatList, View, StyleSheet, Text, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useLocation } from '@/hooks/useLocation';
import { useRestaurants } from '@/hooks/useRestaurants';
import { RestaurantCard } from '@/components/restaurant/RestaurantCard';
import { FilterBar } from '@/components/filters/FilterBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import { LocationSearchModal } from '@/components/location/LocationSearchModal';

export default function ListScreen() {
  const { activeLocation, isUsingCustomLocation, customLocationName, clearCustomLocation } =
    useLocation();
  const { restaurants, isLoading, isError, refetch, isRefetching } =
    useRestaurants();
  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Explore</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Feather name="map-pin" size={20} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {isUsingCustomLocation && customLocationName ? (
          <View style={styles.customLocationBadge}>
            <Feather name="map-pin" size={12} color={Theme.colors.accent} />
            <Text style={styles.customLocationText} numberOfLines={1}>
              {customLocationName}
            </Text>
            <TouchableOpacity onPress={clearCustomLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color={Theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.headerSubtitle}>
            Discover vegan restaurants near you
          </Text>
        )}
      </View>

      {/* Filter bar */}
      <FilterBar />

      {/* Restaurant list */}
      {isError ? (
        <ErrorView
          message="Failed to load restaurants. Check your connection and try again."
          onRetry={refetch}
        />
      ) : isLoading ? (
        <LoadingSpinner fullScreen message="Finding vegan spots..." />
      ) : (
        <FlatList
          data={restaurants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <RestaurantCard restaurant={item} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="map-pin"
              title="No restaurants found"
              message={
                activeLocation
                  ? 'Try adjusting your filters or increasing your search area.'
                  : 'Enable location services to find restaurants near you.'
              }
              actionLabel={activeLocation ? 'Clear Filters' : undefined}
              onAction={activeLocation ? undefined : undefined}
            />
          }
        />
      )}

      <LocationSearchModal
        visible={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.white,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.heavy,
    color: Theme.colors.textPrimary,
  },
  locationButton: {
    padding: Theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  customLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    marginTop: 4,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.borderRadius.full,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  customLocationText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    maxWidth: 200,
  },
  listContent: {
    padding: Theme.spacing.md,
    paddingBottom: Theme.spacing.xxl,
  },
});
