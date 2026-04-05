import { PriceLevel } from '@/types/restaurant';

export function formatPriceLevel(level?: PriceLevel): string {
  if (!level) return '';
  return '$'.repeat(level);
}

export function formatRating(rating: number): string {
  return rating.toFixed(1);
}

export function formatPrice(price: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(price);
}

export function formatAddress(address: string): string {
  // Shorten long addresses for card display
  const parts = address.split(',');
  if (parts.length > 2) {
    return parts.slice(0, 2).join(',').trim();
  }
  return address;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
