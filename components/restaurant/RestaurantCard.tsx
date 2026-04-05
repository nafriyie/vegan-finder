import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { formatPriceLevel, formatRating } from '@/lib/utils/formatting';
import { formatDistance } from '@/lib/utils/distance';
import type { Restaurant } from '@/types/restaurant';

const CARD_WIDTH = Dimensions.get('window').width - Theme.spacing.md * 2;

interface RestaurantCardProps {
  restaurant: Restaurant;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/restaurant/${restaurant.id}`);
  };

  const photoUrl = restaurant.photos[0]?.url;
  const cuisineText = restaurant.cuisineTypes.slice(0, 2).join(' \u00B7 ');
  const priceText = formatPriceLevel(restaurant.priceLevel);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Feather name="image" size={32} color={Theme.colors.textMuted} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>
            {restaurant.name}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
              {formatRating(restaurant.rating)}
            </Text>
          </View>
        </View>

        <Text style={styles.meta} numberOfLines={1}>
          {[priceText, cuisineText].filter(Boolean).join(' \u00B7 ')}
        </Text>

        <View style={styles.bottomRow}>
          {restaurant.distance !== undefined && (
            <View style={styles.detailItem}>
              <Feather
                name="map-pin"
                size={12}
                color={Theme.colors.textSecondary}
              />
              <Text style={styles.detailText}>
                {formatDistance(restaurant.distance)}
              </Text>
            </View>
          )}
          {restaurant.totalRatings > 0 && (
            <Text style={styles.detailText}>
              {restaurant.totalRatings} reviews
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    marginBottom: Theme.spacing.md,
    ...Theme.shadow.md,
  },
  imageContainer: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: Theme.borderRadius.lg,
    borderTopRightRadius: Theme.borderRadius.lg,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    padding: Theme.spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
    flex: 1,
    marginRight: Theme.spacing.sm,
  },
  ratingBadge: {
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
  },
  ratingText: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
  },
  meta: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
});
