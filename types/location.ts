export interface UserLocation {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

export interface LocationSearchResult {
  name: string;
  address: string;
  location: UserLocation;
}

export interface AutocompletePrediction {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}
