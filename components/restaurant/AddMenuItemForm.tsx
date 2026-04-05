import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Theme } from '@/constants/Theme';
import { MENU_CATEGORIES, type MenuCategory } from '@/types/menu';
import type { MenuItem } from '@/types/menu';

interface AddMenuItemFormProps {
  restaurantId: string;
  editItem?: MenuItem | null;
  onSubmit: (item: {
    name: string;
    description?: string;
    price?: number;
    currency: string;
    category: MenuCategory;
    photos: string[];
  }) => void;
  onCancel: () => void;
}

export function AddMenuItemForm({
  editItem,
  onSubmit,
  onCancel,
}: AddMenuItemFormProps) {
  const [name, setName] = useState(editItem?.name ?? '');
  const [description, setDescription] = useState(editItem?.description ?? '');
  const [priceText, setPriceText] = useState(
    editItem?.price !== undefined ? editItem.price.toString() : ''
  );
  const [category, setCategory] = useState<MenuCategory>(
    editItem?.category ?? 'Mains'
  );
  const [photos, setPhotos] = useState<string[]>(editItem?.photos ?? []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos((prev) => [...prev, result.assets[0].uri]);
    }
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a name for the menu item.');
      return;
    }

    const price = priceText ? parseFloat(priceText) : undefined;
    if (priceText && (isNaN(price!) || price! < 0)) {
      Alert.alert('Error', 'Please enter a valid price.');
      return;
    }

    onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      price,
      currency: 'USD',
      category,
      photos,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editItem ? 'Edit Menu Item' : 'Add Menu Item'}
          </Text>
          <TouchableOpacity onPress={onCancel}>
            <Feather name="x" size={24} color={Theme.colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Name *</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g., Beyond Burger"
            placeholderTextColor={Theme.colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Brief description of the dish"
            placeholderTextColor={Theme.colors.textMuted}
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={priceText}
            onChangeText={setPriceText}
            placeholder="0.00"
            placeholderTextColor={Theme.colors.textMuted}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {MENU_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.categoryChipActive,
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    category === cat && styles.categoryChipTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Photos</Text>
          <View style={styles.photosRow}>
            {photos.map((uri, index) => (
              <View key={index} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => handleRemovePhoto(index)}
                >
                  <Feather name="x" size={12} color={Theme.colors.white} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addPhotoBtn}
              onPress={handlePickImage}
            >
              <Feather name="camera" size={20} color={Theme.colors.textMuted} />
              <Text style={styles.addPhotoText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>
            {editItem ? 'Update' : 'Add Item'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Theme.spacing.md,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
  },
  field: {
    marginBottom: Theme.spacing.lg,
  },
  label: {
    fontSize: Theme.fontSize.sm,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: Theme.borderRadius.sm,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textPrimary,
    backgroundColor: Theme.colors.white,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  categoryChip: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    backgroundColor: Theme.colors.white,
  },
  categoryChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  categoryChipText: {
    fontSize: Theme.fontSize.sm,
    color: Theme.colors.textSecondary,
  },
  categoryChipTextActive: {
    color: Theme.colors.white,
    fontWeight: Theme.fontWeight.medium,
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.sm,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 72,
    height: 72,
    borderRadius: Theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addPhotoText: {
    fontSize: Theme.fontSize.xs,
    color: Theme.colors.textMuted,
  },
  submitBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    alignItems: 'center',
    marginTop: Theme.spacing.md,
  },
  submitText: {
    color: Theme.colors.white,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
  },
});
