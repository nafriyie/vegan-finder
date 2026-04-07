import { useEffect, useCallback } from 'react';
import * as Location from 'expo-location';
import { useLocationStore } from '@/stores/locationStore';

export function useLocation() {
  const {
    userLocation,
    customLocation,
    customLocationName,
    recentLocations,
    isUsingCustomLocation,
    permissionStatus,
    setUserLocation,
    setPermissionStatus,
    setCustomLocation,
    clearCustomLocation,
    addRecentLocation,
    getActiveLocation,
  } = useLocationStore();

  const requestPermission = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      setPermissionStatus('denied');
      return false;
    }
  }, [setPermissionStatus]);

  const getCurrentLocation = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const userLoc = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        accuracy: location.coords.accuracy ?? undefined,
        timestamp: location.timestamp,
      };
      setUserLocation(userLoc);
      return userLoc;
    } catch (error) {
      console.error('Get location error:', error);
      return null;
    }
  }, [setUserLocation]);

  // Request permission and get location on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      const granted = await requestPermission();
      if (granted && mounted) {
        await getCurrentLocation();
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, [requestPermission, getCurrentLocation]);

  return {
    userLocation,
    customLocation,
    customLocationName,
    recentLocations,
    activeLocation: getActiveLocation(),
    isUsingCustomLocation,
    permissionStatus,
    requestPermission,
    getCurrentLocation,
    setCustomLocation,
    clearCustomLocation,
    addRecentLocation,
  };
}
