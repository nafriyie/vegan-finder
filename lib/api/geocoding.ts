import { Config } from '@/constants/Config';
import type { LocationSearchResult } from '@/types/location';

interface GeocodeResult {
  formatted_address: string;
  geometry: { location: { lat: number; lng: number } };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

interface GeocodeResponse {
  status: string;
  results: GeocodeResult[];
  error_message?: string;
}

export async function geocodeLocation(
  query: string
): Promise<LocationSearchResult[]> {
  if (!query.trim()) return [];

  if (!Config.GOOGLE_PLACES_API_KEY) {
    console.warn('geocodeLocation: no API key configured');
    return [];
  }

  try {
    const encoded = encodeURIComponent(query.trim());
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encoded}&key=${Config.GOOGLE_PLACES_API_KEY}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error('geocodeLocation: HTTP error', response.status);
      return [];
    }

    const data: GeocodeResponse = await response.json();

    if (data.status !== 'OK') {
      if (data.status !== 'ZERO_RESULTS') {
        console.error('geocodeLocation: API error', data.status, data.error_message);
      }
      return [];
    }

    return data.results.slice(0, 5).map((result) => {
      const localityComponent = result.address_components.find((c) =>
        c.types.includes('locality')
      );
      const regionComponent = result.address_components.find((c) =>
        c.types.includes('administrative_area_level_1')
      );
      const name =
        localityComponent?.long_name ??
        regionComponent?.long_name ??
        result.formatted_address.slice(0, 30);

      return {
        name,
        address: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
      };
    });
  } catch (error) {
    console.error('geocodeLocation: unexpected error', error);
    return [];
  }
}
