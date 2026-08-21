import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import { isQuotaExceeded } from './image';

/**
 * Persisted-store storage that reports a full disk instead of failing silently.
 *
 * On web AsyncStorage is localStorage (~5MB, shared across every persisted
 * store). Menu-item photos are by far the largest thing written, so a user can
 * realistically fill it. zustand's persist middleware swallows write errors,
 * which would silently drop saved data — this surfaces it instead.
 */

type QuotaHandler = () => void;

let quotaHandler: QuotaHandler | null = null;

/** Registered once at app root so the failure can reach the UI. */
export function setQuotaExceededHandler(handler: QuotaHandler | null) {
  quotaHandler = handler;
}

export function createSafeJSONStorage<T>() {
  return createJSONStorage<T>(() => ({
    getItem: (key) => AsyncStorage.getItem(key),
    removeItem: (key) => AsyncStorage.removeItem(key),
    setItem: async (key, value) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch (error) {
        if (isQuotaExceeded(error)) {
          console.error('Storage quota exceeded writing', key);
          quotaHandler?.();
          return;
        }
        throw error;
      }
    },
  }));
}
