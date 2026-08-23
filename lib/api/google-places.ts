import { Config } from '@/constants/Config';
import { cuisineRank } from '@/constants/Cuisines';
import type { Restaurant, Photo, OpeningHours, PriceLevel } from '@/types/restaurant';

const API_BASE = 'https://places.googleapis.com/v1';

// Field masks to minimize cost
const NEARBY_FIELD_MASK = [
  'places.id',
  'places.displayName',
  'places.formattedAddress',
  'places.location',
  'places.rating',
  'places.userRatingCount',
  'places.priceLevel',
  'places.types',
  'places.photos',
  'places.primaryType',
].join(',');

const DETAIL_FIELD_MASK = [
  'id',
  'displayName',
  'formattedAddress',
  'location',
  'rating',
  'userRatingCount',
  'priceLevel',
  'types',
  'photos',
  'internationalPhoneNumber',
  'websiteUri',
  'regularOpeningHours',
  'currentOpeningHours',
].join(',');

interface GooglePlace {
  id: string;
  displayName?: { text: string; languageCode: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?:
    | 'PRICE_LEVEL_FREE'
    | 'PRICE_LEVEL_INEXPENSIVE'
    | 'PRICE_LEVEL_MODERATE'
    | 'PRICE_LEVEL_EXPENSIVE'
    | 'PRICE_LEVEL_VERY_EXPENSIVE';
  types?: string[];
  primaryType?: string;
  photos?: Array<{ name: string; widthPx: number; heightPx: number; authorAttributions?: Array<{ displayName: string }> }>;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    periods?: Array<{
      open: { day: number; hour: number; minute: number };
      close?: { day: number; hour: number; minute: number };
    }>;
    weekdayDescriptions?: string[];
  };
  currentOpeningHours?: {
    openNow?: boolean;
  };
}

function mapPriceLevel(level?: string): PriceLevel | undefined {
  switch (level) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    default:
      return undefined;
  }
}

/**
 * Google place type -> cuisine group.
 *
 * Google returns ~100 specific food types; these collapse to the coarse groups
 * in constants/Cuisines.ts. `vegan_restaurant` and `vegetarian_restaurant` are
 * deliberately absent — they're on nearly every result here and say nothing
 * about cuisine.
 */
const CUISINE_GROUPS: Record<string, string> = {
  // American
  american_restaurant: 'American',
  hamburger_restaurant: 'American',
  barbecue_restaurant: 'American',
  steak_house: 'American',
  diner: 'American',
  soul_food_restaurant: 'American',
  sandwich_shop: 'American',
  hawaiian_restaurant: 'American',
  californian_restaurant: 'American',
  fast_food_restaurant: 'American',

  // Asian
  asian_restaurant: 'Asian',
  asian_fusion_restaurant: 'Asian',
  chinese_restaurant: 'Asian',
  cantonese_restaurant: 'Asian',
  dim_sum_restaurant: 'Asian',
  hot_pot_restaurant: 'Asian',
  japanese_restaurant: 'Asian',
  japanese_curry_restaurant: 'Asian',
  japanese_izakaya_restaurant: 'Asian',
  sushi_restaurant: 'Asian',
  ramen_restaurant: 'Asian',
  tonkatsu_restaurant: 'Asian',
  yakitori_restaurant: 'Asian',
  yakiniku_restaurant: 'Asian',
  korean_restaurant: 'Asian',
  korean_barbecue_restaurant: 'Asian',
  thai_restaurant: 'Asian',
  vietnamese_restaurant: 'Asian',
  filipino_restaurant: 'Asian',
  indonesian_restaurant: 'Asian',
  malaysian_restaurant: 'Asian',
  burmese_restaurant: 'Asian',
  cambodian_restaurant: 'Asian',
  taiwanese_restaurant: 'Asian',
  mongolian_barbecue_restaurant: 'Asian',
  tibetan_restaurant: 'Asian',

  // South Asian
  indian_restaurant: 'South Asian',
  north_indian_restaurant: 'South Asian',
  south_indian_restaurant: 'South Asian',
  pakistani_restaurant: 'South Asian',
  bangladeshi_restaurant: 'South Asian',
  sri_lankan_restaurant: 'South Asian',
  afghani_restaurant: 'South Asian',

  // Latin American
  latin_american_restaurant: 'Latin American',
  south_american_restaurant: 'Latin American',
  mexican_restaurant: 'Latin American',
  taco_restaurant: 'Latin American',
  burrito_restaurant: 'Latin American',
  tex_mex_restaurant: 'Latin American',
  brazilian_restaurant: 'Latin American',
  peruvian_restaurant: 'Latin American',
  argentinian_restaurant: 'Latin American',
  colombian_restaurant: 'Latin American',
  chilean_restaurant: 'Latin American',
  cuban_restaurant: 'Latin American',
  caribbean_restaurant: 'Latin American',

  // Italian
  italian_restaurant: 'Italian',
  pizza_restaurant: 'Italian',

  // Mediterranean
  mediterranean_restaurant: 'Mediterranean',
  greek_restaurant: 'Mediterranean',
  gyro_restaurant: 'Mediterranean',
  spanish_restaurant: 'Mediterranean',
  portuguese_restaurant: 'Mediterranean',
  tapas_restaurant: 'Mediterranean',
  basque_restaurant: 'Mediterranean',

  // Middle Eastern
  middle_eastern_restaurant: 'Middle Eastern',
  lebanese_restaurant: 'Middle Eastern',
  israeli_restaurant: 'Middle Eastern',
  turkish_restaurant: 'Middle Eastern',
  halal_restaurant: 'Middle Eastern',
  kebab_restaurant: 'Middle Eastern',
  shawarma_restaurant: 'Middle Eastern',
  falafel_restaurant: 'Middle Eastern',

  // European
  european_restaurant: 'European',
  french_restaurant: 'European',
  german_restaurant: 'European',
  british_restaurant: 'European',
  irish_restaurant: 'European',
  eastern_european_restaurant: 'European',
  scandinavian_restaurant: 'European',
  danish_restaurant: 'European',
  dutch_restaurant: 'European',
  swiss_restaurant: 'European',
  austrian_restaurant: 'European',
  bavarian_restaurant: 'European',
  czech_restaurant: 'European',
  hungarian_restaurant: 'European',
  polish_restaurant: 'European',
  romanian_restaurant: 'European',
  russian_restaurant: 'European',
  ukrainian_restaurant: 'European',
  fondue_restaurant: 'European',
  fish_and_chips_restaurant: 'European',

  // African
  african_restaurant: 'African',
  ethiopian_restaurant: 'African',
  moroccan_restaurant: 'African',

  // Bar & Pub — Google tags a lot of these `cafe` as well, so they need their
  // own group or they get filed under Cafe & Bakery.
  bar: 'Bar & Pub',
  pub: 'Bar & Pub',
  bar_and_grill: 'Bar & Pub',
  cocktail_bar: 'Bar & Pub',
  wine_bar: 'Bar & Pub',
  beer_garden: 'Bar & Pub',
  brewery: 'Bar & Pub',
  gastropub: 'Bar & Pub',
  pub_restaurant: 'Bar & Pub',

  // Cafe & Bakery
  cafe: 'Cafe & Bakery',
  coffee_shop: 'Cafe & Bakery',
  bakery: 'Cafe & Bakery',
  dessert_restaurant: 'Cafe & Bakery',
  dessert_shop: 'Cafe & Bakery',
  ice_cream_shop: 'Cafe & Bakery',
  confectionery: 'Cafe & Bakery',
  donut_shop: 'Cafe & Bakery',
  bagel_shop: 'Cafe & Bakery',
  tea_house: 'Cafe & Bakery',
  breakfast_restaurant: 'Cafe & Bakery',
  brunch_restaurant: 'Cafe & Bakery',

  // Juice & Health
  juice_shop: 'Juice & Health',
  salad_shop: 'Juice & Health',
  acai_shop: 'Juice & Health',
};

function mapCuisineTypes(types?: string[], primaryType?: string): string[] {
  if (!types || types.length === 0) return ['Other'];

  // Google labels almost every result here `vegan_restaurant`, which says
  // nothing about cuisine, so primaryType is only a hint when it actually maps.
  const mapped: string[] = [];
  for (const type of types) {
    const group = CUISINE_GROUPS[type];
    if (group && !mapped.includes(group)) {
      mapped.push(group);
    }
  }

  const primaryGroup = primaryType ? CUISINE_GROUPS[primaryType] : undefined;
  if (primaryGroup && !mapped.includes(primaryGroup)) {
    mapped.push(primaryGroup);
  }

  // `types` arrives in no useful order, so a format label like `cafe` could
  // outrank `american_restaurant` and mislabel the place. Rank decides first;
  // primaryType only breaks ties within the same rank. Letting primaryType win
  // outright filed "UT47 Kitchen & Bar" under Cafe & Bakery.
  mapped.sort((a, b) => {
    const byRank = cuisineRank(a) - cuisineRank(b);
    if (byRank !== 0) return byRank;
    return Number(b === primaryGroup) - Number(a === primaryGroup);
  });

  return mapped.length > 0 ? mapped : ['Other'];
}

function mapPhotos(photos?: GooglePlace['photos']): Photo[] {
  if (!photos) return [];
  return photos.slice(0, 5).map((photo) => ({
    url: `${API_BASE}/${photo.name}/media?maxWidthPx=800&key=${Config.GOOGLE_PLACES_API_KEY}`,
    width: photo.widthPx,
    height: photo.heightPx,
    attributions: photo.authorAttributions?.map((a) => a.displayName),
  }));
}

function mapOpeningHours(
  regular?: GooglePlace['regularOpeningHours'],
  current?: GooglePlace['currentOpeningHours']
): OpeningHours | undefined {
  if (!regular) return undefined;
  return {
    openNow: current?.openNow ?? regular.openNow,
    periods: (regular.periods ?? []).map((p) => ({
      open: p.open,
      close: p.close ?? { day: p.open.day, hour: 23, minute: 59 },
    })),
    weekdayText: regular.weekdayDescriptions ?? [],
  };
}

function mapGooglePlace(place: GooglePlace): Restaurant {
  return {
    id: `google_${place.id}`,
    name: place.displayName?.text ?? 'Unknown',
    address: place.formattedAddress ?? '',
    location: {
      lat: place.location?.latitude ?? 0,
      lng: place.location?.longitude ?? 0,
    },
    rating: place.rating ?? 0,
    totalRatings: place.userRatingCount ?? 0,
    priceLevel: mapPriceLevel(place.priceLevel),
    cuisineTypes: mapCuisineTypes(place.types, place.primaryType),
    phone: place.internationalPhoneNumber,
    website: place.websiteUri,
    hours: mapOpeningHours(place.regularOpeningHours, place.currentOpeningHours),
    photos: mapPhotos(place.photos),
    source: 'google',
    googlePlaceId: place.id,
  };
}

export interface SearchArea {
  center: { lat: number; lng: number };
  radius?: number;
  bounds?: { north: number; south: number; east: number; west: number };
}

export async function searchNearbyRestaurants(
  area: SearchArea
): Promise<Restaurant[]> {
  const apiKey = Config.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('Google Places API key not configured');
    return [];
  }

  const { center, radius, bounds } = area;
  const locationConstraint = bounds
    ? {
        locationRestriction: {
          rectangle: {
            low: { latitude: bounds.south, longitude: bounds.west },
            high: { latitude: bounds.north, longitude: bounds.east },
          },
        },
      }
    : {
        locationBias: {
          circle: {
            center: { latitude: center.lat, longitude: center.lng },
            radius: Math.min(
              radius ?? Config.DEFAULT_SEARCH_RADIUS,
              Config.MAX_SEARCH_RADIUS
            ),
          },
        },
      };

  try {
    const response = await fetch(`${API_BASE}/places:searchText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': NEARBY_FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: 'vegan restaurant',
        ...locationConstraint,
        maxResultCount: Math.min(Config.MAX_RESULTS, 20),
        languageCode: 'en',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Google Places API error:', response.status, errorBody);
      return [];
    }

    const data = await response.json();
    return (data.places ?? []).map(mapGooglePlace);
  } catch (error) {
    console.error('Google Places search failed:', error);
    return [];
  }
}

export async function getPlaceDetails(
  placeId: string
): Promise<Restaurant | null> {
  const apiKey = Config.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(`${API_BASE}/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': DETAIL_FIELD_MASK,
      },
    });

    if (!response.ok) {
      console.error('Google Places detail error:', response.status);
      return null;
    }

    const place: GooglePlace = await response.json();
    return mapGooglePlace(place);
  } catch (error) {
    console.error('Google Places detail failed:', error);
    return null;
  }
}

export function getPhotoUrl(photoName: string, maxWidth: number = 400): string {
  return `${API_BASE}/${photoName}/media?maxWidthPx=${maxWidth}&key=${Config.GOOGLE_PLACES_API_KEY}`;
}
