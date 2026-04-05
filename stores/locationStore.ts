import { create } from 'zustand';
import type { UserLocation } from '@/types/location';

interface LocationState {
  userLocation: UserLocation | null;
  customLocation: UserLocation | null;
  isUsingCustomLocation: boolean;
  permissionStatus: 'undetermined' | 'granted' | 'denied';

  setUserLocation: (location: UserLocation) => void;
  setCustomLocation: (location: UserLocation | null) => void;
  setPermissionStatus: (status: 'undetermined' | 'granted' | 'denied') => void;
  clearCustomLocation: () => void;
  getActiveLocation: () => UserLocation | null;
}

export const useLocationStore = create<LocationState>((set, get) => ({
  userLocation: null,
  customLocation: null,
  isUsingCustomLocation: false,
  permissionStatus: 'undetermined',

  setUserLocation: (location) => set({ userLocation: location }),

  setCustomLocation: (location) =>
    set({
      customLocation: location,
      isUsingCustomLocation: location !== null,
    }),

  setPermissionStatus: (status) => set({ permissionStatus: status }),

  clearCustomLocation: () =>
    set({ customLocation: null, isUsingCustomLocation: false }),

  getActiveLocation: () => {
    const state = get();
    if (state.isUsingCustomLocation && state.customLocation) {
      return state.customLocation;
    }
    return state.userLocation;
  },
}));
