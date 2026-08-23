import type { MapBounds } from '@/types/location';

/**
 * Helpers for deciding when the map has drifted far enough off the last
 * searched area to be worth spending another Text Search call on.
 *
 * Text Search Enterprise gives 1,000 free calls a month, so an auto-search on
 * every pan exhausts the allowance in a day or two. The map instead offers an
 * explicit "Search this area" and these decide when to show it.
 */

/** How much of the viewport must already be covered to stay quiet. */
const MIN_COVERAGE = 0.6;
/** Zoom-out that justifies a new search on its own (~2/3 of a zoom level). */
const RADIUS_TOLERANCE = 1.6;

/**
 * Fraction of `view` that falls inside `searched`, 0–1.
 *
 * Treats lat/lng as a flat rectangle. That distorts near the poles, but both
 * rectangles are the same viewport moments apart, so the distortion cancels
 * out of the ratio.
 */
export function boundsCoverage(view: MapBounds, searched: MapBounds): number {
  const viewLat = view.north - view.south;
  const viewLng = view.east - view.west;
  if (viewLat <= 0 || viewLng <= 0) return 1;

  const overlapLat = Math.min(view.north, searched.north) - Math.max(view.south, searched.south);
  const overlapLng = Math.min(view.east, searched.east) - Math.max(view.west, searched.west);
  if (overlapLat <= 0 || overlapLng <= 0) return 0;

  return (overlapLat * overlapLng) / (viewLat * viewLng);
}

/**
 * True when the current viewport shows enough unsearched ground to be worth a
 * fresh call. False for small nudges inside ground already covered.
 */
export function shouldOfferSearch(
  viewBounds: MapBounds | null,
  viewRadius: number | null,
  searchedBounds: MapBounds | null,
  searchedRadius: number | null
): boolean {
  // Nothing on screen yet, or nothing searched yet — the initial fetch around
  // the user's location covers that case, so don't nag.
  if (!viewBounds || viewRadius == null) return false;
  if (!searchedBounds || searchedRadius == null) return false;

  if (boundsCoverage(viewBounds, searchedBounds) < MIN_COVERAGE) return true;

  // Zooming *out* shows ground the tighter search never asked about, even
  // though the old rectangle still sits inside the new one.
  //
  // Zooming in does not: it only narrows onto ground already covered. Testing
  // that direction too made the button appear the moment the map loaded — the
  // first search covers a 5km circle while the viewport is ~1km across, so the
  // ratio sat far below 1 and never recovered. That was the flicker.
  return viewRadius / searchedRadius > RADIUS_TOLERANCE;
}

/**
 * Square bounds enclosing a circle of `radius` metres around `center`.
 *
 * The first fetch of a session searches around the user's location rather than
 * a committed viewport, so there is no stored rectangle to compare against.
 * This reconstructs the equivalent one.
 */
export function radiusToBounds(
  center: { lat: number; lng: number },
  radius: number
): MapBounds {
  const latDelta = radius / 111320;
  const lngDelta = radius / (111320 * Math.cos((center.lat * Math.PI) / 180));
  return {
    north: center.lat + latDelta,
    south: center.lat - latDelta,
    east: center.lng + lngDelta,
    west: center.lng - lngDelta,
  };
}
