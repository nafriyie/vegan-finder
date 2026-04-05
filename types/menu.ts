export type MenuCategory =
  | 'Appetizers'
  | 'Mains'
  | 'Sides'
  | 'Desserts'
  | 'Drinks'
  | 'Other';

export interface MenuItem {
  id: string;
  restaurantId: string;
  name: string;
  description?: string;
  price?: number;
  currency: string;
  category: MenuCategory;
  photos: string[];
  createdAt: string;
  updatedAt: string;
}

export const MENU_CATEGORIES: MenuCategory[] = [
  'Appetizers',
  'Mains',
  'Sides',
  'Desserts',
  'Drinks',
  'Other',
];
