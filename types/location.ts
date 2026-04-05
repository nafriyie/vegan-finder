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
