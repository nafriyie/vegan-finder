import { Platform } from 'react-native';

/**
 * Makes a picked image safe to persist.
 *
 * On web, expo-image-picker returns a `blob:` URL (URL.createObjectURL). Those
 * are scoped to the page session, so persisting one to localStorage produces a
 * photo that renders fine until the next reload and is permanently broken after
 * it. Downscaling and re-encoding to a `data:` URI makes it survive.
 *
 * Native file URIs persist on their own, so this is a no-op there.
 */

const MAX_EDGE = 1024;
const JPEG_QUALITY = 0.7;

/** Max photos per menu item — localStorage is ~5MB and shared with other stores. */
export const MAX_PHOTOS_PER_ITEM = 3;

export async function toStorableImageUri(uri: string): Promise<string> {
  if (Platform.OS !== 'web') return uri;
  // Already a data URI (e.g. re-editing a previously saved item).
  if (uri.startsWith('data:')) return uri;

  const image = await loadImage(uri);

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get a 2D canvas context to resize the image');
  ctx.drawImage(image, 0, 0, width, height);

  const dataUri = canvas.toDataURL('image/jpeg', JPEG_QUALITY);

  // Free the blob immediately — we no longer need it.
  if (uri.startsWith('blob:')) URL.revokeObjectURL(uri);

  return dataUri;
}

function loadImage(uri: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read the selected image'));
    image.src = uri;
  });
}

/** True when a persist write failed because browser storage is full. */
export function isQuotaExceeded(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      // Firefox
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  );
}
