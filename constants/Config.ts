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
  /**
   * Free Text Search calls per month before the UI warns.
   *
   * NEARBY_FIELD_MASK asks for rating, userRatingCount and priceLevel, which
   * are Enterprise-tier fields, and Google bills a request at the highest tier
   * any requested field touches. So this app sits on Text Search Enterprise:
   * 1,000 free calls per month, then $35 per 1,000. The allowance resets on the
   * 1st at midnight Pacific. This number does not enforce anything, it only
   * reports — Google is what actually enforces the cap.
   */
  MONTHLY_SEARCH_LIMIT: 1000,
  CACHE_TIME_NEARBY: 5 * 60 * 1000, // 5 minutes
  CACHE_TIME_DETAILS: 60 * 60 * 1000, // 1 hour
} as const;
