import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { formatPriceLevel, formatRating } from '@/lib/utils/formatting';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantMarkerProps {
  restaurant: Restaurant;
}

export function RestaurantMarker({ restaurant }: RestaurantMarkerProps) {
  const router = useRouter();

  return (
    <Marker
      coordinate={{
        latitude: restaurant.location.lat,
        longitude: restaurant.location.lng,
      }}
      tracksViewChanges={false}
    >
      {/* Custom marker pin */}
      <View style={styles.marker}>
        <Text style={styles.markerText}>
          {formatRating(restaurant.rating)}
        </Text>
      </View>
      <View style={styles.markerArrow} />

      {/* Callout on tap */}
      <Callout
        tooltip
        onPress={() => router.push(`/restaurant/${restaurant.id}`)}
      >
        <View style={styles.callout}>
          <Text style={styles.calloutName} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <Text style={styles.calloutMeta}>
            {[
              formatPriceLevel(restaurant.priceLevel),
              restaurant.cuisineTypes[0],
            ]
              .filter(Boolean)
              .join(' \u00B7 ')}
          </Text>
          <Text style={styles.calloutAction}>Tap for details</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  markerText: {
    color: Theme.colors.white,
    fontSize: 12,
    fontWeight: Theme.fontWeight.bold,
  },
  markerArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: Theme.colors.primary,
    alignSelf: 'center',
  },
  callout: {
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    width: 200,
    ...Theme.shadow.md,
  },
  calloutName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
  },
  calloutMeta: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  calloutAction: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.accent,
    marginTop: Theme.spacing.xs,
    fontWeight: Theme.fontWeight.medium,
  },
});
