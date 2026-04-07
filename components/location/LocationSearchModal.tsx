import { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { geocodeLocation } from '@/lib/api/geocoding';
import { useLocation } from '@/hooks/useLocation';
import type { LocationSearchResult } from '@/types/location';

interface LocationSearchModalProps {
  visible: boolean;
  onClose: () => void;
}

export function LocationSearchModal({ visible, onClose }: LocationSearchModalProps) {
  const { isUsingCustomLocation, recentLocations, setCustomLocation, clearCustomLocation, addRecentLocation } =
    useLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    resetState();
    onClose();
  }, [resetState, onClose]);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      const found = await geocodeLocation(query.trim());
      setResults(found);
    } catch {
      setError('Something went wrong. Please try again.');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

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

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Pressable style={styles.overlay} onPress={handleClose}>
          <Pressable style={styles.sheet}>
            {/* Handle bar */}
            <View style={styles.handle} />

            <Text style={styles.title}>Search Location</Text>

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
                disabled={isLoading || !query.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={Theme.colors.white} />
                ) : (
                  <Feather name="search" size={18} color={Theme.colors.white} />
                )}
              </TouchableOpacity>
            </View>

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

            {/* Search results */}
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

                {!isLoading && hasSearched && results.length === 0 && !error && (
                  <Text style={styles.emptyText}>No results found for "{query}"</Text>
                )}

                {!isLoading && results.length > 0 && (
                  <FlatList
                    data={results}
                    keyExtractor={(_, i) => String(i)}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.resultRow}
                        onPress={() => handleSelect(item)}
                      >
                        <View style={styles.resultIconContainer}>
                          <Feather name="map-pin" size={16} color={Theme.colors.textMuted} />
                        </View>
                        <View style={styles.resultText}>
                          <Text style={styles.resultName}>{item.name}</Text>
                          <Text style={styles.resultAddress} numberOfLines={1}>
                            {item.address}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    scrollEnabled={false}
                  />
                )}
              </>
            )}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Theme.colors.white,
    borderTopLeftRadius: Theme.borderRadius.xl,
    borderTopRightRadius: Theme.borderRadius.xl,
    padding: Theme.spacing.lg,
    paddingBottom: Theme.spacing.xxl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.colors.border,
    alignSelf: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.md,
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
