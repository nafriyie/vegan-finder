import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const Config = {
  GOOGLE_PLACES_API_KEY:
    extra.googlePlacesApiKey ??
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ??
    '',
  DEFAULT_SEARCH_RADIUS: 5000, // meters
  MAX_SEARCH_RADIUS: 50000, // meters
  MAX_RESULTS: 50,
  CACHE_TIME_NEARBY: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME_DETAILS: 60 * 60 * 1000, // 1 hour
} as const;
