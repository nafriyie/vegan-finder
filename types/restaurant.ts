export enum PriceLevel {
  BUDGET = 1,
  MODERATE = 2,
  EXPENSIVE = 3,
  VERY_EXPENSIVE = 4,
}

export interface Photo {
  url: string;
  width: number;
  height: number;
  attributions?: string[];
}

export interface OpeningPeriod {
  open: { day: number; hour: number; minute: number };
  close: { day: number; hour: number; minute: number };
}

export interface OpeningHours {
  openNow?: boolean;
  periods: OpeningPeriod[];
  weekdayText: string[];
}

export interface Restaurant {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating: number;
  totalRatings: number;
  priceLevel?: PriceLevel;
  cuisineTypes: string[];
  phone?: string;
  website?: string;
  hours?: OpeningHours;
  photos: Photo[];
  distance?: number; // meters from user
  source: 'google';
  googlePlaceId?: string;
}
