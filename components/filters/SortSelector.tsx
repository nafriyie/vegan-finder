import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { SortOption } from '@/types/filters';

const SORT_OPTIONS: { value: SortOption; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { value: SortOption.DISTANCE, label: 'Distance', icon: 'map-pin' },
  { value: SortOption.RATING, label: 'Rating', icon: 'star' },
  { value: SortOption.PRICE_LOW_TO_HIGH, label: 'Price: Low to High', icon: 'arrow-up' },
  { value: SortOption.PRICE_HIGH_TO_LOW, label: 'Price: High to Low', icon: 'arrow-down' },
];

interface SortSelectorProps {
  visible: boolean;
  current: SortOption;
  onSelect: (sort: SortOption) => void;
  onClose: () => void;
}

export function SortSelector({
  visible,
  current,
  onSelect,
  onClose,
}: SortSelectorProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Sort By</Text>

          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.option,
                current === opt.value && styles.optionActive,
              ]}
              onPress={() => onSelect(opt.value)}
            >
              <Feather
                name={opt.icon}
                size={18}
                color={
                  current === opt.value
                    ? Theme.colors.primary
                    : Theme.colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.optionText,
                  current === opt.value && styles.optionTextActive,
                ]}
              >
                {opt.label}
              </Text>
              {current === opt.value && (
                <Feather
                  name="check"
                  size={18}
                  color={Theme.colors.primary}
                  style={styles.check}
                />
              )}
            </TouchableOpacity>
          ))}
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
    marginBottom: Theme.spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  optionActive: {},
  optionText: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textPrimary,
    flex: 1,
  },
  optionTextActive: {
    fontWeight: Theme.fontWeight.semibold,
  },
  check: {
    marginLeft: 'auto',
  },
});
