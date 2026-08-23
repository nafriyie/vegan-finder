import { memo, useCallback } from 'react';
import { Marker } from '@react-google-maps/api';
import { formatRating } from '@/lib/utils/formatting';
import type { Restaurant } from '@/types/restaurant';

interface RestaurantMapMarkerProps {
  restaurant: Restaurant;
  /** Pre-built per-cuisine symbol. Must be referentially stable — see index.web.tsx. */
  icon: google.maps.Symbol;
  onSelect: (restaurant: Restaurant) => void;
}

/**
 * Memoized so panning the map doesn't rebuild every marker.
 *
 * The map screen re-renders on each idle event; without this, all ~20 markers
 * were re-created and pushed back into the Maps SDK every time, which is what
 * made the map janky and swallowed taps.
 */
function RestaurantMapMarkerImpl({
  restaurant,
  icon,
  onSelect,
}: RestaurantMapMarkerProps) {
  const handleClick = useCallback(
    () => onSelect(restaurant),
    [onSelect, restaurant]
  );

  return (
    <Marker
      position={{ lat: restaurant.location.lat, lng: restaurant.location.lng }}
      label={{
        text: formatRating(restaurant.rating),
        color: '#ffffff',
        fontSize: '12px',
        fontWeight: 'bold',
      }}
      icon={icon}
      onClick={handleClick}
    />
  );
}

export const RestaurantMapMarker = memo(RestaurantMapMarkerImpl);
