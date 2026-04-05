import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  SectionList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { useRestaurantDetail } from '@/hooks/useRestaurantDetail';
import { useMenuStore } from '@/stores/menuStore';
import { RestaurantHeader } from '@/components/restaurant/RestaurantHeader';
import { MenuItemCard } from '@/components/restaurant/MenuItemCard';
import { AddMenuItemForm } from '@/components/restaurant/AddMenuItemForm';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorView } from '@/components/common/ErrorView';
import type { MenuItem, MenuCategory } from '@/types/menu';

export default function RestaurantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { restaurant, isLoading, isError } = useRestaurantDetail(id ?? '');
  const menuStore = useMenuStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const menuItems = menuStore.getItemsForRestaurant(id ?? '');

  // Group menu items by category
  const menuSections = useMemo(() => {
    const grouped: Record<string, MenuItem[]> = {};
    for (const item of menuItems) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    return Object.entries(grouped).map(([title, data]) => ({
      title,
      data,
    }));
  }, [menuItems]);

  const handleAddItem = (itemData: {
    name: string;
    description?: string;
    price?: number;
    currency: string;
    category: MenuCategory;
    photos: string[];
  }) => {
    if (editingItem) {
      menuStore.updateItem(id ?? '', editingItem.id, itemData);
    } else {
      menuStore.addItem(id ?? '', itemData);
    }
    setShowAddForm(false);
    setEditingItem(null);
  };

  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleDeleteItem = (item: MenuItem) => {
    menuStore.deleteItem(id ?? '', item.id);
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="Loading restaurant..." />;
  }

  if (isError || !restaurant) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={Theme.colors.textPrimary} />
        </TouchableOpacity>
        <ErrorView message="Could not load restaurant details." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Feather name="arrow-left" size={24} color={Theme.colors.textPrimary} />
      </TouchableOpacity>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Restaurant header with photos, info, actions */}
        <RestaurantHeader restaurant={restaurant} />

        {/* Opening hours */}
        {restaurant.hours && restaurant.hours.weekdayText.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hours</Text>
            {restaurant.hours.weekdayText.map((line, i) => (
              <Text key={i} style={styles.hoursText}>
                {line}
              </Text>
            ))}
          </View>
        )}

        {/* Menu section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Menu</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => {
                setEditingItem(null);
                setShowAddForm(true);
              }}
            >
              <Feather name="plus" size={16} color={Theme.colors.white} />
              <Text style={styles.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {menuItems.length === 0 ? (
            <View style={styles.emptyMenu}>
              <Feather
                name="book-open"
                size={32}
                color={Theme.colors.textMuted}
              />
              <Text style={styles.emptyMenuText}>No menu items yet</Text>
              <Text style={styles.emptyMenuSubtext}>
                Add items you've tried or seen on the menu.
              </Text>
            </View>
          ) : (
            menuSections.map((section) => (
              <View key={section.title}>
                <Text style={styles.categoryTitle}>{section.title}</Text>
                {section.data.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onEdit={handleEditItem}
                    onDelete={handleDeleteItem}
                  />
                ))}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Add/Edit menu item modal */}
      <Modal
        visible={showAddForm}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={{ flex: 1 }}>
          <AddMenuItemForm
            restaurantId={id ?? ''}
            editItem={editingItem}
            onSubmit={handleAddItem}
            onCancel={() => {
              setShowAddForm(false);
              setEditingItem(null);
            }}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  backBtn: {
    position: 'absolute',
    top: 56,
    left: Theme.spacing.md,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    ...Theme.shadow.md,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: Theme.spacing.md,
    borderTopWidth: 8,
    borderTopColor: Theme.colors.surface,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
  },
  hoursText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    lineHeight: 22,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
  },
  addBtnText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.medium,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyMenuText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.md,
  },
  emptyMenuSubtext: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
  categoryTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.sm,
  },
});
