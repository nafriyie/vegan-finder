import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local tally of Google Text Search calls, so you can see where you stand
 * against the free monthly allowance.
 *
 * This is an estimate, not the truth. It only counts searches made by this app
 * in this browser/device — it cannot read Google's actual quota usage. Using
 * the app elsewhere, or clearing site data, makes it drift. Google remains the
 * thing that actually enforces the limit.
 */

/**
 * Google's free tier is a *monthly* allowance that rolls over on the 1st at
 * midnight Pacific, so the period has to be computed in that zone. An earlier
 * version tracked a daily window, which reported "6/30 today" while the real
 * monthly budget was already spent.
 */
export function pacificMonthKey(date: Date = new Date()): string {
  // en-CA formats as YYYY-MM-DD; the first 7 chars are the month.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .slice(0, 7);
}

interface UsageStore {
  periodKey: string;
  searchCount: number;
  /** False until AsyncStorage has been read back. See pendingSearches. */
  hydrated: boolean;
  recordSearch: () => void;
  /** Count for the current month, accounting for an unwritten rollover. */
  getPeriodCount: () => number;
}

/**
 * Searches recorded before AsyncStorage finishes hydrating.
 *
 * Hydration is async, but the first restaurant fetch fires on mount and can
 * beat it. Writing that search straight to the store persisted a count of 1
 * over the real running total, so every reload looked like a fresh month.
 * Buffer instead, and fold the buffer in once the stored value is back.
 */
let pendingSearches = 0;

function withSearches(
  state: Pick<UsageStore, 'periodKey' | 'searchCount'>,
  n: number
): Pick<UsageStore, 'periodKey' | 'searchCount'> {
  const now = pacificMonthKey();
  return state.periodKey === now
    ? { periodKey: now, searchCount: state.searchCount + n }
    : { periodKey: now, searchCount: n };
}

export const useUsageStore = create<UsageStore>()(
  persist(
    (set, get) => ({
      periodKey: pacificMonthKey(),
      searchCount: 0,
      hydrated: false,

      recordSearch: () => {
        if (!get().hydrated) {
          pendingSearches += 1;
          return;
        }
        set(withSearches(get(), 1));
      },

      getPeriodCount: () => {
        const { periodKey, searchCount } = get();
        return periodKey === pacificMonthKey() ? searchCount : 0;
      },
    }),
    {
      name: 'vegan-finder-usage',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // `hydrated` is runtime-only; persisting it would rehydrate as true and
      // defeat the buffer above on the next load.
      partialize: (s) => ({ periodKey: s.periodKey, searchCount: s.searchCount }),
      // v1 stored a daily count under different keys. A day's tally says
      // nothing about the month, so start the monthly window clean.
      migrate: () => ({ periodKey: pacificMonthKey(), searchCount: 0 }),
      onRehydrateStorage: () => () => {
        const buffered = pendingSearches;
        pendingSearches = 0;
        useUsageStore.setState((s) => ({
          ...withSearches(s, buffered),
          hydrated: true,
        }));
      },
    }
  )
);
