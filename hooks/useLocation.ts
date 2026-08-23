import { useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Location from 'expo-location';
import { useLocationStore } from '@/stores/locationStore';
import { calculateDistance } from '@/lib/utils/distance';
import type { UserLocation } from '@/types/location';

/**
 * Safari — desktop and iOS — does not support
 * `navigator.permissions.query({ name: 'geolocation' })`. expo-location's web
 * implementation calls it unconditionally and rethrows, so on Safari the
 * permission request fails before the browser is ever asked for a position and
 * the app reports "location denied" without showing a prompt.
 *
 * On web we therefore skip the Permissions API entirely and let
 * `getCurrentPosition` drive the browser's own permission flow, which is
 * supported everywhere. Native still goes through expo-location.
 */
const isWeb = Platform.OS === 'web';

/**
 * Minimum movement before a new GPS fix is written to the store.
 *
 * useRestaurants resets its accumulated results whenever activeLocation changes
 * identity and re-keys its query, so writing every raw fix would refire Google
 * Text Search every few seconds. That SKU has only 1,000 free calls/month, so an
 * unthrottled watch is a real billing risk, not just churn.
 */
const MIN_MOVE_METERS = 50;

function getWebPosition(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Geolocation is not available in this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          timestamp: position.timestamp,
        }),
      reject,
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
    );
  });
}

function isPermissionDenied(error: unknown): boolean {
  return (
    typeof GeolocationPositionError !== 'undefined' &&
    error instanceof GeolocationPositionError &&
    error.code === error.PERMISSION_DENIED
  );
}

export function useLocation() {
  // Field selectors, not `useLocationStore()`. The bare call subscribes to the
  // whole store, and setViewport fires on every map idle — so panning the map
  // re-rendered every screen using this hook, which is what made the map snap
  // back and taps land unreliably.
  const userLocation = useLocationStore((s) => s.userLocation);
  const customLocation = useLocationStore((s) => s.customLocation);
  const customLocationName = useLocationStore((s) => s.customLocationName);
  const recentLocations = useLocationStore((s) => s.recentLocations);
  const isUsingCustomLocation = useLocationStore((s) => s.isUsingCustomLocation);
  const permissionStatus = useLocationStore((s) => s.permissionStatus);

  const setUserLocation = useLocationStore((s) => s.setUserLocation);
  const setPermissionStatus = useLocationStore((s) => s.setPermissionStatus);
  const setCustomLocation = useLocationStore((s) => s.setCustomLocation);
  const clearCustomLocation = useLocationStore((s) => s.clearCustomLocation);
  const addRecentLocation = useLocationStore((s) => s.addRecentLocation);

  const activeLocation =
    isUsingCustomLocation && customLocation ? customLocation : userLocation;

  const getCurrentLocation = useCallback(async () => {
    try {
      let userLoc: UserLocation;

      if (isWeb) {
        userLoc = await getWebPosition();
      } else {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        userLoc = {
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          accuracy: location.coords.accuracy ?? undefined,
          timestamp: location.timestamp,
        };
      }

      setUserLocation(userLoc);
      setPermissionStatus('granted');
      return userLoc;
    } catch (error) {
      console.error('Get location error:', error);
      if (isWeb) {
        setPermissionStatus(isPermissionDenied(error) ? 'denied' : 'undetermined');
      }
      return null;
    }
  }, [setUserLocation, setPermissionStatus]);

  const requestPermission = useCallback(async () => {
    // On web the position request *is* the permission request, so defer to it.
    if (isWeb) {
      return (await getCurrentLocation()) !== null;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setPermissionStatus(status === 'granted' ? 'granted' : 'denied');
      return status === 'granted';
    } catch (error) {
      console.error('Location permission error:', error);
      setPermissionStatus('denied');
      return false;
    }
  }, [setPermissionStatus, getCurrentLocation]);

  // Request permission and get location on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      if (isWeb) {
        // getCurrentLocation already prompts and stores the result.
        await getCurrentLocation();
        return;
      }
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

  // Keep the user's position current while the app is open.
  useEffect(() => {
    if (!isWeb) return;
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy ?? undefined,
          timestamp: position.timestamp,
        };
        const previous = useLocationStore.getState().userLocation;
        if (
          previous &&
          calculateDistance(previous.lat, previous.lng, next.lat, next.lng) <
            MIN_MOVE_METERS
        ) {
          return;
        }
        setUserLocation(next);
      },
      (error) => {
        // A denied watch shouldn't clobber a position we already have.
        console.warn('Location watch error:', error.message);
      },
      { enableHighAccuracy: false, maximumAge: 30000, timeout: 30000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [setUserLocation]);

  return {
    userLocation,
    customLocation,
    customLocationName,
    recentLocations,
    activeLocation,
    isUsingCustomLocation,
    permissionStatus,
    requestPermission,
    getCurrentLocation,
    setCustomLocation,
    clearCustomLocation,
    addRecentLocation,
  };
}
