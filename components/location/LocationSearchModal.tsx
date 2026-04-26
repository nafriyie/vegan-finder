import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { geocodeLocation } from '@/lib/api/geocoding';
import { autocompleteLocation } from '@/lib/api/autocomplete';
import { useLocation } from '@/hooks/useLocation';
import type { LocationSearchResult, AutocompletePrediction } from '@/types/location';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationSearchModal({ visible, onClose }: LocationSearchModalProps) {
  const { isUsingCustomLocation, recentLocations, setCustomLocation, clearCustomLocation, addRecentLocation } =
    useLocation();

  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryRef = useRef('');

  const resetState = useCallback(() => {
    queryRef.current = '';
    setQuery('');
    setPredictions([]);
    setHasSearched(false);
    setError(null);
    setIsLoading(false);
    setIsResolving(false);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  // Fetch autocomplete predictions as user types
  const runAutocomplete = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setPredictions([]);
      setHasSearched(false);
      return;
    }
    queryRef.current = trimmed;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const found = await autocompleteLocation(trimmed);
      if (queryRef.current !== trimmed) return;
      setPredictions(found);
    } catch {
      if (queryRef.current !== trimmed) return;
      setError('Something went wrong. Please try again.');
      setPredictions([]);
    } finally {
      if (queryRef.current === trimmed) setIsLoading(false);
    }
  }, []);

  // Manual search (button / keyboard submit) — geocode directly
  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    const trimmed = query.trim();
    queryRef.current = trimmed;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setPredictions([]);
    try {
      const found = await geocodeLocation(trimmed);
      if (queryRef.current !== trimmed) return;
      // Convert geocode results to predictions for display
      setPredictions(
        found.map((r) => ({
          placeId: r.address,
          mainText: r.name,
          secondaryText: r.address,
          fullText: r.address,
          resolvedResult: r,
        })) as AutocompletePrediction[]
      );
    } catch {
      if (queryRef.current !== trimmed) return;
      setError('Something went wrong. Please try again.');
    } finally {
      if (queryRef.current === trimmed) setIsLoading(false);
    }
  }, [query]);

  // Debounced autocomplete on keystroke
  useEffect(() => {
    if (query.trim().length < 1) {
      setPredictions([]);
      setHasSearched(false);
      setError(null);
      return;
    }
    const timerId = setTimeout(() => runAutocomplete(query), 300);
    return () => clearTimeout(timerId);
  }, [query, runAutocomplete]);

  // Selecting a prediction: geocode the full text to get coordinates
  const handleSelectPrediction = useCallback(
    async (prediction: AutocompletePrediction) => {
      setIsResolving(true);
      try {
        const results = await geocodeLocation(prediction.fullText);
        const resolved: LocationSearchResult | undefined = results[0];
        if (resolved) {
          setCustomLocation(resolved.location, prediction.mainText);
          addRecentLocation({ ...resolved, name: prediction.mainText });
          resetState();
          onClose();
        } else {
          setError('Could not resolve location. Try a different result.');
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setIsResolving(false);
      }
    },
    [setCustomLocation, addRecentLocation, resetState, onClose]
  );

  const handleSelect = useCallback(
    (result: LocationSearchResult, isFromRecents = false) => {
      setCustomLocation(result.location, result.name);
      if (!isFromRecents) {
        addRecentLocation(result);
      }
      resetState();
      onClose();
    },
    [setCustomLocation, addRecentLocation, resetState, onClose]
  );

  const handleUseGPS = useCallback(() => {
    clearCustomLocation();
    resetState();
    onClose();
  }, [clearCustomLocation, resetState, onClose]);

  const showDefaultList = query === '';
  const isBusy = isLoading || isResolving;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Search Location</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={Theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Search row */}
            <View style={styles.searchRow}>
              <TextInput
                style={styles.input}
                value={query}
                onChangeText={setQuery}
                placeholder="City, address, or place"
                placeholderTextColor={Theme.colors.textMuted}
                returnKeyType="search"
                onSubmitEditing={handleSearch}
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isBusy || !query.trim()}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={Theme.colors.white} />
                ) : (
                  <Feather name="search" size={18} color={Theme.colors.white} />
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              {/* Default list: current location + recents */}
              {showDefaultList && (
                <View>
                  {/* Current location row */}
                  <TouchableOpacity style={styles.resultRow} onPress={handleUseGPS}>
                    <View style={[styles.resultIconContainer, styles.gpsIconContainer]}>
                      <Feather name="crosshair" size={16} color={Theme.colors.accent} />
                    </View>
                    <View style={styles.resultText}>
                      <Text style={styles.resultName}>Current Location</Text>
                      {isUsingCustomLocation && (
                        <Text style={styles.resultAddress}>Switch back to GPS</Text>
                      )}
                    </View>
                    {isUsingCustomLocation && (
                      <Feather name="check" size={16} color={Theme.colors.accent} />
                    )}
                  </TouchableOpacity>

                  {/* Recent locations */}
                  {recentLocations.length > 0 && (
                    <>
                      <Text style={styles.sectionLabel}>Recent</Text>
                      {recentLocations.map((item, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.resultRow}
                          onPress={() => handleSelect(item, true)}
                        >
                          <View style={styles.resultIconContainer}>
                            <Feather name="clock" size={16} color={Theme.colors.textMuted} />
                          </View>
                          <View style={styles.resultText}>
                            <Text style={styles.resultName}>{item.name}</Text>
                            <Text style={styles.resultAddress} numberOfLines={1}>
                              {item.address}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                </View>
              )}

              {/* Autocomplete predictions / search results */}
              {!showDefaultList && (
                <>
                  {isLoading && (
                    <ActivityIndicator
                      style={styles.loader}
                      size="small"
                      color={Theme.colors.textMuted}
                    />
                  )}

                  {!isLoading && error && (
                    <Text style={styles.errorText}>{error}</Text>
                  )}

                  {!isLoading && hasSearched && predictions.length === 0 && !error && (
                    <Text style={styles.emptyText}>No results found for "{query}"</Text>
                  )}

                  {!isLoading && predictions.length > 0 &&
                    predictions.map((item) => (
                      <TouchableOpacity
                        key={item.placeId}
                        style={styles.resultRow}
                        onPress={() => handleSelectPrediction(item)}
                        disabled={isResolving}
                      >
                        <View style={styles.resultIconContainer}>
                          <Feather name="map-pin" size={16} color={Theme.colors.textMuted} />
                        </View>
                        <View style={styles.resultText}>
                          <Text style={styles.resultName}>{item.mainText}</Text>
                          {item.secondaryText ? (
                            <Text style={styles.resultAddress} numberOfLines={1}>
                              {item.secondaryText}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))
                  }
                </>
              )}
            </ScrollView>
        </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.white,
    padding: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
  },
  closeButton: {
    padding: Theme.spacing.xs,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.surface,
  },
  searchButton: {
    backgroundColor: Theme.colors.primary,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: Theme.fontSize.xs,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  resultIconContainer: {
    width: 32,
    height: 32,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsIconContainer: {
    backgroundColor: '#E8F5EE',
  },
  resultText: {
    flex: 1,
  },
  resultName: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textPrimary,
  },
  resultAddress: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  loader: {
    marginTop: Theme.spacing.lg,
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
  },
  errorText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.error,
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
  },
});
