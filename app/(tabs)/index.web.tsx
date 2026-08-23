/**
 * Web map screen using @react-google-maps/api.
 * Native uses react-native-maps (index.tsx).
 * Both render the same UI experience.
 */
import { useEffect, useCallback, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
} from '@react-google-maps/api';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { CUISINE_COLORS } from '@/constants/Cuisines';
import { getPrimaryCuisine } from '@/lib/utils/cuisine';
import { Config } from '@/constants/Config';
import { useLocation } from '@/hooks/useLocation';
import { useRestaurants } from '@/hooks/useRestaurants';
import { useSearchArea } from '@/hooks/useSearchArea';
import { useLocationStore } from '@/stores/locationStore';
import { FilterBar } from '@/components/filters/FilterBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { AppTouchable } from '@/components/common/AppTouchable';
import { UsageChip } from '@/components/common/UsageChip';
import { ErrorView } from '@/components/common/ErrorView';
import { calculateDistance } from '@/lib/utils/distance';
import { LocationSearchModal } from '@/components/location/LocationSearchModal';
import { Feather } from '@expo/vector-icons';
import type { Restaurant } from '@/types/restaurant';
import { RestaurantMapMarker } from '@/components/map/RestaurantMapMarker.web';
import { RestaurantCallout } from '@/components/map/RestaurantCallout.web';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

const DEFAULT_ZOOM = 14;

// Hoisted so they keep a stable identity across renders. Passing fresh object
// literals made @react-google-maps/api re-apply them to the map every render,
// which rebuilt markers and replaced the InfoWindow DOM mid-tap.
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' };

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export default function MapScreenWeb() {
  const router = useRouter();
  const {
    activeLocation,
    permissionStatus,
    getCurrentLocation,
    isUsingCustomLocation,
    customLocationName,
    clearCustomLocation,
  } = useLocation();
  const { restaurants, isLoading } = useRestaurants();
  const setViewport = useLocationStore((s) => s.setViewport);
  const { canSearchHere, searchHere } = useSearchArea(activeLocation);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // Mirrors activeLocation so onLoad can read it without taking it as a dep
  // (a changing onLoad identity would remount the map).
  const activeLocationRef = useRef(activeLocation);
  activeLocationRef.current = activeLocation;

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
  });

  // Centre on the user exactly once, when the first fix arrives. After that the
  // map is left alone: panning must stick, and the location watch must not yank
  // the view every 50m. handleRecenter is the deliberate way back.
  const hasCenteredRef = useRef(false);

  useEffect(() => {
    if (!map || !activeLocation || hasCenteredRef.current) return;
    hasCenteredRef.current = true;
    map.setCenter({ lat: activeLocation.lat, lng: activeLocation.lng });
    map.setZoom(DEFAULT_ZOOM);
  }, [map, activeLocation]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    // Set the initial view imperatively. Passing `center`/`zoom` as props would
    // make the map controlled, so every re-render would snap it back.
    const initial = activeLocationRef.current;
    mapInstance.setCenter(
      initial ? { lat: initial.lat, lng: initial.lng } : DEFAULT_CENTER
    );
    mapInstance.setZoom(DEFAULT_ZOOM);
    if (initial) hasCenteredRef.current = true;
    setMap(mapInstance);
  }, []);

  const handleIdle = useCallback(() => {
    if (!map) return;
    const center = map.getCenter();
    const bounds = map.getBounds();
    if (!center || !bounds) return;
    const ne = bounds.getNorthEast();
    const sw = bounds.getSouthWest();
    const lat = center.lat();
    const lng = center.lng();
    const mapBounds = {
      north: ne.lat(),
      south: sw.lat(),
      east: ne.lng(),
      west: sw.lng(),
    };
    const radius = Math.min(
      calculateDistance(lat, lng, ne.lat(), ne.lng()),
      Config.MAX_SEARCH_RADIUS
    );
    // Records where the user is looking. Deliberately does not fetch — see
    // useRestaurants and the "Search this area" button below.
    setViewport({ lat, lng }, radius, mapBounds);
  }, [map, setViewport]);

  // google.maps.* only exists once the SDK has loaded, so these can't be hoisted
  // to module scope — but they must stay stable or every marker re-renders.
  const icons = useMemo(() => {
    if (!isLoaded) return null;
    return {
      user: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2,
      } as google.maps.Symbol,
      // One symbol per cuisine colour, built once. Building these per marker
      // would give every render a new object identity and defeat the marker
      // memoization.
      byCuisine: Object.fromEntries(
        Object.entries(CUISINE_COLORS).map(([cuisine, color]) => [
          cuisine,
          {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 20,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
          } as google.maps.Symbol,
        ])
      ) as Record<string, google.maps.Symbol>,
    };
  }, [isLoaded]);

  const handleMapClick = useCallback(() => setSelectedRestaurant(null), []);

  const handleOpenDetails = useCallback(
    (restaurant: Restaurant) => router.push(`/restaurant/${restaurant.id}`),
    [router]
  );

  const handleRecenter = useCallback(() => {
    if (!map || !activeLocation) return;
    map.panTo({ lat: activeLocation.lat, lng: activeLocation.lng });
    if ((map.getZoom() ?? 0) < DEFAULT_ZOOM) map.setZoom(DEFAULT_ZOOM);
  }, [map, activeLocation]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Vegan Finder</Text>
          <AppTouchable
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            <Feather name="map-pin" size={20} color={Theme.colors.textPrimary} />
          </AppTouchable>
        </View>

        {isUsingCustomLocation && customLocationName ? (
          <View style={styles.customLocationBadge}>
            <Feather name="map-pin" size={12} color={Theme.colors.accent} />
            <Text style={styles.customLocationText} numberOfLines={1}>
              {customLocationName}
            </Text>
            <AppTouchable onPress={clearCustomLocation} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={14} color={Theme.colors.textSecondary} />
            </AppTouchable>
          </View>
        ) : (
          activeLocation && (
            <>
              <Text style={styles.headerSubtitle}>
                {restaurants.length} restaurants nearby
              </Text>
              <UsageChip />
            </>
          )
        )}
      </View>

      {/* Filter bar */}
      <FilterBar />

      {/* Map */}
      <View style={styles.mapContainer}>
        {permissionStatus === 'denied' && !activeLocation ? (
          <ErrorView
            message="Location access is needed to find restaurants near you. Enable location for this site, then try again."
            onRetry={getCurrentLocation}
          />
        ) : loadError || !API_KEY ? (
          <ErrorView
            message={
              !API_KEY
                ? 'Google Maps API key is missing from this build.'
                : `Google Maps failed to load: ${loadError?.message ?? 'unknown error'}`
            }
          />
        ) : !isLoaded ? (
          <LoadingSpinner message="Loading map..." fullScreen />
        ) : (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER_STYLE}
            onLoad={onLoad}
            onIdle={handleIdle}
            options={MAP_OPTIONS}
            onClick={handleMapClick}
          >
            {/* User location marker */}
            {activeLocation && icons && (
              <Marker
                position={{ lat: activeLocation.lat, lng: activeLocation.lng }}
                icon={icons.user}
              />
            )}

            {/* Restaurant markers */}
            {icons &&
              restaurants.map((restaurant) => (
                <RestaurantMapMarker
                  key={restaurant.id}
                  restaurant={restaurant}
                  icon={
                    icons.byCuisine[getPrimaryCuisine(restaurant)] ??
                    icons.byCuisine.Other
                  }
                  onSelect={setSelectedRestaurant}
                />
              ))}

            {/* Info window on marker tap */}
            {selectedRestaurant && (
              <RestaurantCallout
                restaurant={selectedRestaurant}
                onClose={handleMapClick}
                onOpenDetails={handleOpenDetails}
              />
            )}
          </GoogleMap>
        )}

        {/* Spend an API call on the area the user is actually looking at */}
        {isLoaded && canSearchHere && (
          <AppTouchable
            style={styles.searchAreaButton}
            onPress={searchHere}
            accessibilityLabel="Search this area for vegan restaurants"
          >
            <Feather name="search" size={14} color={Theme.colors.white} />
            <Text style={styles.searchAreaText}>Search this area</Text>
          </AppTouchable>
        )}

        {/* Recenter on the user's position */}
        {isLoaded && activeLocation && (
          <AppTouchable
            style={styles.recenterButton}
            onPress={handleRecenter}
            accessibilityLabel="Recenter map on my location"
          >
            <Feather name="crosshair" size={20} color={Theme.colors.textPrimary} />
          </AppTouchable>
        )}

        {/* Loading overlay while fetching restaurants */}
        {isLoaded && isLoading && (
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
  recenterButton: {
    position: 'absolute',
    right: Theme.spacing.md,
    bottom: Theme.spacing.xl,
    width: 44,
    height: 44,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.md,
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
