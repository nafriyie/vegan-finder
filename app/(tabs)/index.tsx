import { useState, useRef, useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Platform, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { Config } from '@/constants/Config';
import { useLocation } from '@/hooks/useLocation';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useSearchArea } from '@/hooks/useSearchArea';
import { useLocationStore } from '@/stores/locationStore';
import { RestaurantMarker } from '@/components/map/RestaurantMarker';
import { FilterBar } from '@/components/filters/FilterBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorView } from '@/components/common/ErrorView';
import { LocationSearchModal } from '@/components/location/LocationSearchModal';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const { activeLocation, permissionStatus, isUsingCustomLocation, customLocationName, clearCustomLocation } =
    useLocation();
  const { restaurants, isLoading } = useRestaurants();
  const setViewport = useLocationStore((s) => s.setViewport);
  const { canSearchHere, searchHere } = useSearchArea(activeLocation);
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      const { latitude, longitude, latitudeDelta, longitudeDelta } = region;
      const bounds = {
        north: latitude + latitudeDelta / 2,
        south: latitude - latitudeDelta / 2,
        east: longitude + longitudeDelta / 2,
        west: longitude - longitudeDelta / 2,
      };
      const latMeters = latitudeDelta * 111320;
      const lngMeters = longitudeDelta * 111320 * Math.cos((latitude * Math.PI) / 180);
      const radius = Math.min(
        Math.hypot(latMeters, lngMeters) / 2,
        Config.MAX_SEARCH_RADIUS
      );
      // Records where the user is looking. Deliberately does not fetch — see
      // useRestaurants and the "Search this area" button below.
      setViewport({ lat: latitude, lng: longitude }, radius, bounds);
    },
    [setViewport]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Vegan Finder</Text>
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
          activeLocation && (
            <Text style={styles.headerSubtitle}>
              {restaurants.length} restaurants nearby
            </Text>
          )
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
            onRegionChangeComplete={handleRegionChangeComplete}
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

        {/* Spend an API call on the area the user is actually looking at */}
        {canSearchHere && (
          <TouchableOpacity
            style={styles.searchAreaButton}
            onPress={searchHere}
            accessibilityLabel="Search this area for vegan restaurants"
          >
            <Feather name="search" size={14} color={Theme.colors.white} />
            <Text style={styles.searchAreaText}>Search this area</Text>
          </TouchableOpacity>
        )}

        {isLoading && (
          <View style={styles.loadingOverlay}>
            <LoadingSpinner message="Finding vegan spots..." />
          </View>
        )}
      </View>

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
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchAreaButton: {
    position: 'absolute',
    top: Theme.spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.xs,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.primary,
    ...Theme.shadow.md,
  },
  searchAreaText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
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
