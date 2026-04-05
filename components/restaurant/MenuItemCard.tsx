import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { formatPrice } from '@/lib/utils/formatting';
import type { MenuItem } from '@/types/menu';

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
}

export function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Menu Item',
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete?.(item),
        },
      ]
    );
  };

  const photoUrl = item.photos[0];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.textContent}>
          <Text style={styles.name}>{item.name}</Text>
          {item.description && (
            <Text style={styles.description} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          {item.price !== undefined && (
            <Text style={styles.price}>
              {formatPrice(item.price, item.currency)}
            </Text>
          )}
          <Text style={styles.category}>{item.category}</Text>
        </View>

        {photoUrl && (
          <Image source={{ uri: photoUrl }} style={styles.photo} />
        )}
      </View>

      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity
              onPress={() => onEdit(item)}
              style={styles.actionBtn}
            >
              <Feather name="edit-2" size={14} color={Theme.colors.textSecondary} />
              <Text style={styles.actionText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionBtn}
            >
              <Feather name="trash-2" size={14} color={Theme.colors.error} />
              <Text style={[styles.actionText, { color: Theme.colors.error }]}>
                Delete
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  content: {
    flexDirection: 'row',
  },
  textContent: {
    flex: 1,
    marginRight: Theme.spacing.md,
  },
  name: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
  },
  description: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    lineHeight: 18,
  },
  price: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.xs,
  },
  category: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
    marginTop: Theme.spacing.xs,
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: Theme.borderRadius.sm,
  },
  actions: {
    flexDirection: 'row',
    marginTop: Theme.spacing.sm,
    gap: Theme.spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: Theme.spacing.xs,
  },
  actionText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textSecondary,
  },
});
