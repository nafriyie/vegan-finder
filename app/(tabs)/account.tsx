import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useFilterStore } from '@/stores/filterStore';
import { useMenuStore } from '@/stores/menuStore';

export default function AccountScreen() {
  const resetFilters = useFilterStore((s) => s.resetFilters);
  const menuItems = useMenuStore((s) => s.items);
  const totalMenuItems = Object.values(menuItems).flat().length;

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset your filters and remove all saved menu items. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            resetFilters();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      <View style={styles.content}>
        {/* App info */}
        <View style={styles.section}>
          <View style={styles.appIcon}>
            <Feather name="heart" size={40} color={Theme.colors.accent} />
          </View>
          <Text style={styles.appName}>Vegan Finder</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Data</Text>
          <View style={styles.statRow}>
            <Feather name="book-open" size={18} color={Theme.colors.textSecondary} />
            <Text style={styles.statText}>
              {totalMenuItems} saved menu items
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.menuItem} onPress={resetFilters}>
            <Feather name="sliders" size={18} color={Theme.colors.textSecondary} />
            <Text style={styles.menuItemText}>Reset Filters</Text>
            <Feather name="chevron-right" size={18} color={Theme.colors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={handleClearData}>
            <Feather name="trash-2" size={18} color={Theme.colors.error} />
            <Text style={[styles.menuItemText, { color: Theme.colors.error }]}>
              Clear All Data
            </Text>
            <Feather name="chevron-right" size={18} color={Theme.colors.textMuted} />
          </TouchableOpacity>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            Vegan Finder helps you discover vegan restaurants near you. Browse
            the map, explore restaurant details, and save menu items for your
            favorite spots.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Theme.colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  headerTitle: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.heavy,
    color: Theme.colors.textPrimary,
  },
  content: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  section: {
    marginBottom: Theme.spacing.xl,
  },
  appIcon: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadius.lg,
    backgroundColor: Theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Theme.spacing.md,
  },
  appName: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
    textAlign: 'center',
  },
  appVersion: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Theme.spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  statText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textPrimary,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    gap: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  menuItemText: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textPrimary,
  },
  aboutText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
  },
});
