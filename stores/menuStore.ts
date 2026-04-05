import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import type { MenuItem, MenuCategory } from '@/types/menu';

interface MenuStore {
  items: Record<string, MenuItem[]>; // keyed by restaurantId

  getItemsForRestaurant: (restaurantId: string) => MenuItem[];
  addItem: (
    restaurantId: string,
    item: Omit<MenuItem, 'id' | 'restaurantId' | 'createdAt' | 'updatedAt'>
  ) => MenuItem;
  updateItem: (
    restaurantId: string,
    itemId: string,
    updates: Partial<Pick<MenuItem, 'name' | 'description' | 'price' | 'currency' | 'category' | 'photos'>>
  ) => void;
  deleteItem: (restaurantId: string, itemId: string) => void;
}

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      items: {},

      getItemsForRestaurant: (restaurantId) => {
        return get().items[restaurantId] ?? [];
      },

      addItem: (restaurantId, item) => {
        const now = new Date().toISOString();
        const newItem: MenuItem = {
          ...item,
          id: uuidv4(),
          restaurantId,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: {
            ...state.items,
            [restaurantId]: [
              ...(state.items[restaurantId] ?? []),
              newItem,
            ],
          },
        }));
        return newItem;
      },

      updateItem: (restaurantId, itemId, updates) => {
        set((state) => {
          const restaurantItems = state.items[restaurantId] ?? [];
          return {
            items: {
              ...state.items,
              [restaurantId]: restaurantItems.map((item) =>
                item.id === itemId
                  ? { ...item, ...updates, updatedAt: new Date().toISOString() }
                  : item
              ),
            },
          };
        });
      },

      deleteItem: (restaurantId, itemId) => {
        set((state) => {
          const restaurantItems = state.items[restaurantId] ?? [];
          return {
            items: {
              ...state.items,
              [restaurantId]: restaurantItems.filter(
                (item) => item.id !== itemId
              ),
            },
          };
        });
      },
    }),
    {
      name: 'vegan-finder-menu',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
