import { Config } from '@/constants/Config';
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

function mapCuisineTypes(types?: string[], primaryType?: string): string[] {
  if (!types) return [];
  const cuisineMap: Record<string, string> = {
    italian_restaurant: 'Italian',
    chinese_restaurant: 'Chinese',
    japanese_restaurant: 'Japanese',
    korean_restaurant: 'Korean',
    mexican_restaurant: 'Mexican',
    thai_restaurant: 'Thai',
    indian_restaurant: 'Indian',
    vietnamese_restaurant: 'Vietnamese',
    french_restaurant: 'French',
    greek_restaurant: 'Greek',
    mediterranean_restaurant: 'Mediterranean',
    american_restaurant: 'American',
    middle_eastern_restaurant: 'Middle Eastern',
    ethiopian_restaurant: 'Ethiopian',
    fast_food_restaurant: 'Fast Food',
    cafe: 'Cafe',
    bakery: 'Bakery',
    juice_shop: 'Juice Bar',
  };

  const mapped: string[] = [];
  for (const type of types) {
    if (cuisineMap[type]) {
      mapped.push(cuisineMap[type]);
    }
  }
  if (primaryType && cuisineMap[primaryType] && !mapped.includes(cuisineMap[primaryType])) {
    mapped.unshift(cuisineMap[primaryType]);
  }
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

export async function searchNearbyRestaurants(
  lat: number,
  lng: number,
  radius: number = Config.DEFAULT_SEARCH_RADIUS
): Promise<Restaurant[]> {
  const apiKey = Config.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    console.warn('Google Places API key not configured');
    return [];
  }

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
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: Math.min(radius, Config.MAX_SEARCH_RADIUS),
          },
        },
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
