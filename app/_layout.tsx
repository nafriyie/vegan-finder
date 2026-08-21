import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as SplashScreen from 'expo-splash-screen';
import { DialogProvider, useDialog } from '@/components/common/DialogProvider';
import { setQuotaExceededHandler } from '@/lib/utils/storage';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Surfaces a full browser storage quota as a real dialog. Must live inside
 * DialogProvider to reach useDialog.
 */
function StorageErrorBridge() {
  const { alert } = useDialog();

  useEffect(() => {
    setQuotaExceededHandler(() => {
      alert({
        title: 'Storage full',
        message:
          'There is no room left to save. Delete some saved menu items or photos and try again.',
      });
    });
    return () => setQuotaExceededHandler(null);
  }, [alert]);

  return null;
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <DialogProvider>
        <StorageErrorBridge />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="restaurant/[id]"
            options={{ presentation: 'card' }}
          />
        </Stack>
        <StatusBar style="dark" />
      </DialogProvider>
    </QueryClientProvider>
  );
}
