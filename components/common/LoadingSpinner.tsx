import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { Theme } from '@/constants/Theme';

interface LoadingSpinnerProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingSpinner({ message, fullScreen }: LoadingSpinnerProps) {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={Theme.colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  message: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
  },
});
