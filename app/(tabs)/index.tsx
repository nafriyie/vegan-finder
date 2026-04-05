import { useRef, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Theme } from '@/constants/Theme';
import { useLocation } from '@/hooks/useLocation';
import { useRestaurants } from '@/hooks/useRestaurants';
import { RestaurantMarker } from '@/components/map/RestaurantMarker';
import { FilterBar } from '@/components/filters/FilterBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorView } from '@/components/common/ErrorView';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { activeLocation, permissionStatus } = useLocation();
  const { restaurants, isLoading, isError, refetch } = useRestaurants();

  useEffect(() => {
    if (activeLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: activeLocation.lat,
          longitude: activeLocation.lng,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        },
        500
      );
    }
  }, [activeLocation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Vegan Finder</Text>
        {activeLocation && (
          <Text style={styles.headerSubtitle}>
            {restaurants.length} restaurants nearby
          </Text>
        )}
      </View>

      {/* Filter bar */}
      <FilterBar />

      {/* Map */}
      <View style={styles.mapContainer}>
        {permissionStatus === 'denied' && !activeLocation ? (
          <ErrorView
            message="Location access is needed to find restaurants near you. Please enable location in Settings."
          />
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={
              activeLocation
                ? {
                    latitude: activeLocation.lat,
                    longitude: activeLocation.lng,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04,
                  }
                : DEFAULT_REGION
            }
            showsUserLocation
            showsMyLocationButton
          >
            {restaurants.map((restaurant) => (
              <RestaurantMarker
                key={restaurant.id}
                restaurant={restaurant}
              />
            ))}
          </MapView>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner message="Finding vegan spots..." />
          </View>
        )}
      </View>
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
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.heavy,
    color: Theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: Theme.spacing.md,
  },
});
