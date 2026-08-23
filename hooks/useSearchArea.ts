import { useCallback, useMemo } from 'react';
import { useLocationStore } from '@/stores/locationStore';
import { useFilterStore } from '@/stores/filterStore';
import { Config } from '@/constants/Config';
import { radiusToBounds, shouldOfferSearch } from '@/lib/utils/mapArea';
import type { UserLocation } from '@/types/location';

/**
 * Drives the "Search this area" affordance shared by both map screens.
 *
 * Panning updates the viewport but never fetches; this reports when the
 * viewport has drifted far enough off the searched area to be worth a call,
 * and hands back the commit that spends one.
 */
export function useSearchArea(activeLocation: UserLocation | null) {
  const viewBounds = useLocationStore((s) => s.viewBounds);
  const viewRadius = useLocationStore((s) => s.viewRadius);
  const searchCenter = useLocationStore((s) => s.searchCenter);
  const searchBounds = useLocationStore((s) => s.searchBounds);
  const searchRadius = useLocationStore((s) => s.searchRadius);
  const commitSearchArea = useLocationStore((s) => s.commitSearchArea);
  const maxDistance = useFilterStore((s) => s.maxDistance);

  // The first search of a session covers a circle, not a rectangle, so there is
  // no stored bounds to compare against — reconstruct the equivalent box.
  // Anchor on searchCenter once it is pinned so GPS drift can't shift the
  // baseline out from under the comparison.
  const anchor = searchCenter ?? activeLocation;
  const effectiveRadius =
    searchRadius ?? (anchor ? maxDistance ?? Config.DEFAULT_SEARCH_RADIUS : null);
  const effectiveBounds = useMemo(
    () =>
      searchBounds ??
      (anchor && effectiveRadius != null
        ? radiusToBounds(anchor, effectiveRadius)
        : null),
    [searchBounds, anchor, effectiveRadius]
  );

  const canSearchHere = useMemo(
    () => shouldOfferSearch(viewBounds, viewRadius, effectiveBounds, effectiveRadius),
    [viewBounds, viewRadius, effectiveBounds, effectiveRadius]
  );

  const searchHere = useCallback(() => commitSearchArea(), [commitSearchArea]);

  return { canSearchHere, searchHere };
}
