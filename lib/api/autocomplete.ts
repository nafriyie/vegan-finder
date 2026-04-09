import { Config } from '@/constants/Config';
import type { AutocompletePrediction } from '@/types/location';

interface AutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text: { text: string };
      structuredFormat?: {
        mainText: { text: string };
        secondaryText?: { text: string };
      };
    };
  }>;
}

export async function autocompleteLocation(
  input: string
): Promise<AutocompletePrediction[]> {
  if (!input.trim()) return [];

  if (!Config.GOOGLE_PLACES_API_KEY) {
    console.warn('autocompleteLocation: no API key configured');
    return [];
  }

  try {
    const response = await fetch(
      'https://places.googleapis.com/v1/places:autocomplete',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': Config.GOOGLE_PLACES_API_KEY,
        },
        body: JSON.stringify({
          input: input.trim(),
        }),
      }
    );

    if (!response.ok) {
      console.error('autocompleteLocation: HTTP error', response.status);
      return [];
    }

    const data: AutocompleteResponse = await response.json();

    if (!data.suggestions) return [];

    return data.suggestions
      .filter((s) => s.placePrediction != null)
      .map((s) => {
        const p = s.placePrediction!;
        return {
          placeId: p.placeId,
          mainText: p.structuredFormat?.mainText.text ?? p.text.text,
          secondaryText: p.structuredFormat?.secondaryText?.text ?? '',
          fullText: p.text.text,
        };
      });
  } catch (error) {
    console.error('autocompleteLocation: unexpected error', error);
    return [];
  }
}
