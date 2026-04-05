import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { formatPriceLevel, formatRating } from '@/lib/utils/formatting';
import type { Restaurant } from '@/types/restaurant';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PHOTO_HEIGHT = 260;

interface RestaurantHeaderProps {
  restaurant: Restaurant;
}

export function RestaurantHeader({ restaurant }: RestaurantHeaderProps) {
  const priceText = formatPriceLevel(restaurant.priceLevel);
  const cuisineText = restaurant.cuisineTypes.join(' \u00B7 ');

  const handleCall = () => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`);
    }
  };

  const handleWebsite = () => {
    if (restaurant.website) {
      Linking.openURL(restaurant.website);
    }
  };

  const handleDirections = () => {
    const { lat, lng } = restaurant.location;
    const label = encodeURIComponent(restaurant.name);

    if (Platform.OS === 'ios') {
      const appleMapsUrl = `maps:0,0?q=${label}@${lat},${lng}`;
      const googleMapsUrl = restaurant.googlePlaceId
        ? `https://www.google.com/maps/search/?api=1&query=${label}&query_place_id=${restaurant.googlePlaceId}`
        : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

      Alert.alert('Open Directions', 'Choose a maps app', [
        {
          text: 'Google Maps',
          onPress: () => Linking.openURL(googleMapsUrl),
        },
        {
          text: 'Apple Maps',
          onPress: () => Linking.openURL(appleMapsUrl),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } else if (Platform.OS === 'android') {
      Linking.openURL(`geo:${lat},${lng}?q=${lat},${lng}(${label})`);
    } else {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    }
  };

  return (
    <View>
      {/* Photo carousel */}
      {restaurant.photos.length > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.photoCarousel}
        >
          {restaurant.photos.map((photo, index) => (
            <Image
              key={index}
              source={{ uri: photo.url }}
              style={styles.photo}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.photo, styles.placeholder]}>
          <Feather name="image" size={48} color={Theme.colors.textMuted} />
        </View>
      )}

      {/* Restaurant info */}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{restaurant.name}</Text>

        <View style={styles.metaRow}>
          <Feather name="star" size={16} color={Theme.colors.star} />
          <Text style={styles.rating}>
            {formatRating(restaurant.rating)}
          </Text>
          <Text style={styles.ratingCount}>
            ({restaurant.totalRatings})
          </Text>
          {priceText ? (
            <>
              <Text style={styles.dot}> \u00B7 </Text>
              <Text style={styles.metaText}>{priceText}</Text>
            </>
          ) : null}
          {cuisineText ? (
            <>
              <Text style={styles.dot}> \u00B7 </Text>
              <Text style={styles.metaText} numberOfLines={1}>
                {cuisineText}
              </Text>
            </>
          ) : null}
        </View>

        {/* Hours status */}
        {restaurant.hours?.openNow !== undefined && (
          <Text
            style={[
              styles.openStatus,
              restaurant.hours.openNow
                ? styles.openNow
                : styles.closedNow,
            ]}
          >
            {restaurant.hours.openNow ? 'Open Now' : 'Closed'}
          </Text>
        )}

        <Text style={styles.address}>{restaurant.address}</Text>

        {/* Action buttons */}
        <View style={styles.actions}>
          {restaurant.phone && (
            <TouchableOpacity style={styles.actionBtn} onPress={handleCall}>
              <Feather name="phone" size={18} color={Theme.colors.primary} />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
          {restaurant.website && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleWebsite}
            >
              <Feather name="globe" size={18} color={Theme.colors.primary} />
              <Text style={styles.actionText}>Website</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleDirections}
          >
            <Feather
              name="navigation"
              size={18}
              color={Theme.colors.primary}
            />
            <Text style={styles.actionText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  photoCarousel: {
    height: PHOTO_HEIGHT,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    padding: Theme.spacing.md,
  },
  name: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    flexWrap: 'wrap',
  },
  rating: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
    marginLeft: 4,
  },
  ratingCount: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginLeft: 2,
  },
  dot: {
    color: Theme.colors.textMuted,
    fontSize: Theme.fontSize.sm,
  },
  metaText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  openStatus: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    marginTop: Theme.spacing.sm,
  },
  openNow: {
    color: Theme.colors.success,
  },
  closedNow: {
    color: Theme.colors.error,
  },
  address: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Theme.spacing.xs,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  actionText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textPrimary,
  },
});
