/**
 * Cuisine groups.
 *
 * Deliberately coarse. Google Places returns ~100 specific food types
 * (`sushi_restaurant`, `korean_barbecue_restaurant`, `hamburger_restaurant`…)
 * which is far too granular to colour a map or offer as filter chips. These
 * groups follow Google's own umbrella types — `asian_restaurant`,
 * `european_restaurant`, `latin_american_restaurant`, `mediterranean_restaurant`,
 * `middle_eastern_restaurant`, `african_restaurant` — with Italian kept separate
 * because it's common enough to be worth its own colour.
 */
export const CUISINE_TYPES = [
  'American',
  'Asian',
  'South Asian',
  'Latin American',
  'Italian',
  'Mediterranean',
  'Middle Eastern',
  'European',
  'African',
  'Bar & Pub',
  'Cafe & Bakery',
  'Juice & Health',
  'Other',
] as const;

export type CuisineType = (typeof CUISINE_TYPES)[number];

/**
 * How specific a group is; lowest wins when a place matches several.
 *
 * Regional cuisines (rank 0) always beat venue formats, so an Italian place
 * that also has a bar reads as Italian. Among formats, Bar & Pub beats
 * Cafe & Bakery — Google tags many bars with `cafe` too, which was filing pubs
 * under Cafe & Bakery.
 */
export const CUISINE_PRIORITY: Record<string, number> = {
  'Bar & Pub': 1,
  'Cafe & Bakery': 2,
  'Juice & Health': 2,
  Other: 3,
};

export function cuisineRank(cuisine: string): number {
  return CUISINE_PRIORITY[cuisine] ?? 0;
}

/**
 * Marker colour per group.
 *
 * Markers draw a white rating label on top, so every value clears 4.5:1
 * contrast against white (verified — see the palette check in the commit).
 */
export const CUISINE_COLORS: Record<CuisineType, string> = {
  American: '#C62828',
  Asian: '#00695C',
  'South Asian': '#8A6D00',
  'Latin American': '#7B1FA2',
  Italian: '#2E7D32',
  Mediterranean: '#BF5400',
  'Middle Eastern': '#455A64',
  European: '#1565C0',
  African: '#7A4E2D',
  'Bar & Pub': '#283593',
  'Cafe & Bakery': '#C2185B',
  'Juice & Health': '#4E8129',
  Other: '#616161',
};

export const DEFAULT_CUISINE_COLOR = CUISINE_COLORS.Other;
