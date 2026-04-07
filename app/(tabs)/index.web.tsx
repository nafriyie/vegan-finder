/**
 * Web map screen using @react-google-maps/api.
 * Native uses react-native-maps (index.tsx).
 * Both render the same UI experience.
 */
import { useEffect, useCallback, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  InfoWindow,
} from '@react-google-maps/api';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { useLocation } from '@/hooks/useLocation';
import { useRestaurants } from '@/hooks/useRestaurants';
import { FilterBar } from '@/components/filters/FilterBar';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorView } from '@/components/common/ErrorView';
import { formatPriceLevel, formatRating } from '@/lib/utils/formatting';
import { formatDistance } from '@/lib/utils/distance';
import { LocationSearchModal } from '@/components/location/LocationSearchModal';
import { Feather } from '@expo/vector-icons';
import type { Restaurant } from '@/types/restaurant';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };
const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? '';

const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

export default function MapScreenWeb() {
  const router = useRouter();
  const { activeLocation, isUsingCustomLocation, customLocationName, clearCustomLocation } = useLocation();
  const { restaurants, isLoading } = useRestaurants();
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: API_KEY,
  });

  // Pan to user location when it becomes available
  useEffect(() => {
    if (map && activeLocation) {
      map.panTo({ lat: activeLocation.lat, lng: activeLocation.lng });
    }
  }, [map, activeLocation]);

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  }, []);

  const center = activeLocation
    ? { lat: activeLocation.lat, lng: activeLocation.lng }
    : DEFAULT_CENTER;

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
        {!isLoaded ? (
          <LoadingSpinner message="Loading map..." fullScreen />
        ) : (
          <GoogleMap
            mapContainerStyle={{ width: '100%', height: '100%' }}
            center={center}
            zoom={14}
            onLoad={onLoad}
            options={{
              styles: MAP_STYLES,
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
            onClick={() => setSelectedRestaurant(null)}
          >
            {/* User location marker */}
            {activeLocation && (
              <Marker
                position={{ lat: activeLocation.lat, lng: activeLocation.lng }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#4285F4',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
              />
            )}

            {/* Restaurant markers */}
            {restaurants.map((restaurant) => (
              <Marker
                key={restaurant.id}
                position={{
                  lat: restaurant.location.lat,
                  lng: restaurant.location.lng,
                }}
                label={{
                  text: formatRating(restaurant.rating),
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 'bold',
                }}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 20,
                  fillColor: Theme.colors.primary,
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                }}
                onClick={() => setSelectedRestaurant(restaurant)}
              />
            ))}

            {/* Info window on marker tap */}
            {selectedRestaurant && (
              <InfoWindow
                position={{
                  lat: selectedRestaurant.location.lat,
                  lng: selectedRestaurant.location.lng,
                }}
                onCloseClick={() => setSelectedRestaurant(null)}
              >
                <div
                  style={{
                    padding: '4px 0',
                    cursor: 'pointer',
                    maxWidth: 220,
                  }}
                  onClick={() =>
                    router.push(`/restaurant/${selectedRestaurant.id}`)
                  }
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: '700',
                      fontSize: 15,
                      color: '#000',
                    }}
                  >
                    {selectedRestaurant.name}
                  </p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      color: '#545454',
                    }}
                  >
                    {[
                      formatPriceLevel(selectedRestaurant.priceLevel),
                      selectedRestaurant.cuisineTypes[0],
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {selectedRestaurant.distance !== undefined && (
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 12,
                        color: '#999',
                      }}
                    >
                      {formatDistance(selectedRestaurant.distance)}
                    </p>
                  )}
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: 12,
                      color: Theme.colors.accent,
                      fontWeight: '600',
                    }}
                  >
                    Tap for details →
                  </p>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.85)',
    paddingVertical: Theme.spacing.md,
  },
});
