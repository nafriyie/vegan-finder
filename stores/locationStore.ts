import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserLocation, LocationSearchResult, MapBounds } from '@/types/location';

interface LocationState {
  userLocation: UserLocation | null;
  customLocation: UserLocation | null;
  customLocationName: string | null;
  recentLocations: LocationSearchResult[];
  isUsingCustomLocation: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';
  mapCenter: UserLocation | null;
  mapRadius: number | null;
  mapBounds: MapBounds | null;

  setUserLocation: (location: UserLocation) => void;
  setCustomLocation: (location: UserLocation | null, name?: string) => void;
  setPermissionStatus: (status: 'undetermined' | 'granted' | 'denied') => void;
  clearCustomLocation: () => void;
  addRecentLocation: (result: LocationSearchResult) => void;
  setMapView: (center: UserLocation, radius: number, bounds: MapBounds) => void;
  clearMapView: () => void;
  getActiveLocation: () => UserLocation | null;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      userLocation: null,
      customLocation: null,
      customLocationName: null,
      recentLocations: [],
      isUsingCustomLocation: false,
      permissionStatus: 'undetermined',
      mapCenter: null,
      mapRadius: null,
      mapBounds: null,

      setUserLocation: (location) => set({ userLocation: location }),

      setCustomLocation: (location, name) =>
        set({
          customLocation: location,
          isUsingCustomLocation: location !== null,
          customLocationName: name ?? null,
          mapCenter: null,
          mapRadius: null,
          mapBounds: null,
        }),

      setPermissionStatus: (status) => set({ permissionStatus: status }),

      clearCustomLocation: () =>
        set({
          customLocation: null,
          isUsingCustomLocation: false,
          customLocationName: null,
          mapCenter: null,
          mapRadius: null,
          mapBounds: null,
        }),

      addRecentLocation: (result) => {
        const current = get().recentLocations;
        const deduped = current.filter((r) => r.address !== result.address);
        set({ recentLocations: [result, ...deduped].slice(0, 5) });
      },

      setMapView: (center, radius, bounds) =>
        set({ mapCenter: center, mapRadius: radius, mapBounds: bounds }),

      clearMapView: () => set({ mapCenter: null, mapRadius: null, mapBounds: null }),

      getActiveLocation: () => {
        const state = get();
        if (state.isUsingCustomLocation && state.customLocation) {
          return state.customLocation;
        }
        return state.userLocation;
      },
    }),
    {
      name: 'vegan-finder-location',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) =>
        ({
          userLocation: state.userLocation,
          customLocation: state.customLocation,
          customLocationName: state.customLocationName,
          recentLocations: state.recentLocations,
          isUsingCustomLocation: state.isUsingCustomLocation,
        }) as Partial<LocationState>,
    }
  )
);
