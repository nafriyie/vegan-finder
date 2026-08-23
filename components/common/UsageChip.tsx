import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { Config } from '@/constants/Config';
import { useUsageStore, pacificMonthKey } from '@/stores/usageStore';

/**
 * Shows how many map searches have been made this month against the free
 * monthly allowance.
 *
 * The count is local to this device — see stores/usageStore.ts. It reports
 * only; it never blocks a search, because blocking on an estimate would break
 * the app whenever the estimate is wrong.
 */
export function UsageChip() {
  const periodKey = useUsageStore((s) => s.periodKey);
  const searchCount = useUsageStore((s) => s.searchCount);
  const used = periodKey === pacificMonthKey() ? searchCount : 0;
  const limit = Config.MONTHLY_SEARCH_LIMIT;
  const ratio = used / limit;

  const tone =
    ratio >= 1 ? 'over' : ratio >= 0.8 ? 'near' : 'normal';

  return (
    <View style={[styles.chip, tone === 'near' && styles.chipNear, tone === 'over' && styles.chipOver]}>
      <Feather
        name={tone === 'normal' ? 'activity' : 'alert-triangle'}
        size={11}
        color={tone === 'normal' ? Theme.colors.textSecondary : Theme.colors.white}
      />
      <Text style={[styles.text, tone !== 'normal' && styles.textAlert]}>
        {used}/{limit} searches this month
      </Text>
    </View>
  );
}

/** Longer explanation for the Account screen. */
export function UsageSummary() {
  const periodKey = useUsageStore((s) => s.periodKey);
  const searchCount = useUsageStore((s) => s.searchCount);
  const used = periodKey === pacificMonthKey() ? searchCount : 0;
  const limit = Config.MONTHLY_SEARCH_LIMIT;

  return (
    <Text style={styles.summary}>
      {used} of {limit} map searches used this month. Counted on this device
      only; resets on the 1st at midnight Pacific, when Google&apos;s free
      monthly allowance resets.
      {used >= limit
        ? ' You may have exhausted the free tier — further searches are billed.'
        : ''}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: 3,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Theme.colors.surface,
  },
  chipNear: {
    backgroundColor: '#B26A00',
  },
  chipOver: {
    backgroundColor: Theme.colors.error,
  },
  text: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
    fontWeight: Theme.fontWeight.medium,
  },
  textAlert: {
    color: Theme.colors.white,
  },
  summary: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
});
