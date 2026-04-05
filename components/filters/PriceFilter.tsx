import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Theme } from '@/constants/Theme';
import { PriceLevel } from '@/types/restaurant';

const PRICE_OPTIONS: { value: PriceLevel; label: string }[] = [
  { value: PriceLevel.BUDGET, label: '$' },
  { value: PriceLevel.MODERATE, label: '$$' },
  { value: PriceLevel.EXPENSIVE, label: '$$$' },
  { value: PriceLevel.VERY_EXPENSIVE, label: '$$$$' },
];

interface PriceFilterProps {
  visible: boolean;
  range: [PriceLevel, PriceLevel];
  onSelect: (range: [PriceLevel, PriceLevel]) => void;
  onClose: () => void;
}

export function PriceFilter({
  visible,
  range,
  onSelect,
  onClose,
}: PriceFilterProps) {
  const togglePrice = (level: PriceLevel) => {
    // Toggle individual price levels by adjusting range
    if (range[0] === level && range[1] === level) {
      // Reset to full range
      onSelect([PriceLevel.BUDGET, PriceLevel.VERY_EXPENSIVE]);
    } else if (level <= range[0]) {
      onSelect([level, range[1]]);
    } else if (level >= range[1]) {
      onSelect([range[0], level]);
    } else {
      // Set exact level
      onSelect([level, level]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Price Range</Text>

          <View style={styles.priceRow}>
            {PRICE_OPTIONS.map((opt) => {
              const isInRange =
                opt.value >= range[0] && opt.value <= range[1];
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priceBtn,
                    isInRange && styles.priceBtnActive,
                  ]}
                  onPress={() => togglePrice(opt.value)}
                >
                  <Text
                    style={[
                      styles.priceText,
                      isInRange && styles.priceTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: Theme.spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
    marginBottom: Theme.spacing.lg,
  },
  priceBtn: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    alignItems: 'center',
  },
  priceBtnActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  priceText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
  },
  priceTextActive: {
    color: Theme.colors.white,
  },
  doneBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
  },
  doneText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
});
