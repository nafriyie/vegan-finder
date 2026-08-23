import { memo } from 'react';
import { InfoWindow } from '@react-google-maps/api';
import { Theme } from '@/constants/Theme';
import { formatPriceLevel } from '@/lib/utils/formatting';
import { formatDistance } from '@/lib/utils/distance';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantCalloutProps {
  restaurant: Restaurant;
  onClose: () => void;
  onOpenDetails: (restaurant: Restaurant) => void;
}

/**
 * Memoized so the callout's DOM survives the map screen's re-renders.
 *
 * Previously this markup was inline in the map screen, so every parent render
 * replaced the InfoWindow's contents — taps on "Tap for details" or the close X
 * that landed mid-render were dropped.
 */
function RestaurantCalloutImpl({
  restaurant,
  onClose,
  onOpenDetails,
}: RestaurantCalloutProps) {
  const subtitle = [
    formatPriceLevel(restaurant.priceLevel),
    restaurant.cuisineTypes[0],
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <InfoWindow
      position={{ lat: restaurant.location.lat, lng: restaurant.location.lng }}
      onCloseClick={onClose}
    >
      <div
        style={styles.container}
        onClick={() => onOpenDetails(restaurant)}
        role="button"
        tabIndex={0}
      >
        <p style={styles.name}>{restaurant.name}</p>
        <p style={styles.subtitle}>{subtitle}</p>
        {restaurant.distance !== undefined && (
          <p style={styles.distance}>{formatDistance(restaurant.distance)}</p>
        )}
        <p style={styles.cta}>Tap for details →</p>
      </div>
    </InfoWindow>
  );
}

const styles = {
  container: { padding: '4px 0', cursor: 'pointer', maxWidth: 220 },
  name: { margin: 0, fontWeight: 700, fontSize: 15, color: '#000' },
  subtitle: { margin: '4px 0 0', fontSize: 13, color: '#545454' },
  distance: { margin: '4px 0 0', fontSize: 12, color: '#999' },
  cta: {
    margin: '8px 0 0',
    fontSize: 12,
    color: Theme.colors.accent,
    fontWeight: 600,
  },
} satisfies Record<string, React.CSSProperties>;

export const RestaurantCallout = memo(RestaurantCalloutImpl);
