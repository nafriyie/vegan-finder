import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import {
  Alert,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Theme } from '@/constants/Theme';

/**
 * Cross-platform confirm/alert dialogs.
 *
 * react-native-web ships `Alert` as a no-op (`class Alert { static alert() {} }`),
 * so every Alert.alert call silently does nothing on web — which made deleting a
 * saved menu item impossible and form validation errors invisible.
 *
 * Native keeps the system alerts users expect; web gets an in-app themed modal.
 */

const isWeb = Platform.OS === 'web';

interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface AlertOptions {
  title: string;
  message?: string;
}

interface DialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  alert: (options: AlertOptions) => Promise<void>;
}

const DialogContext = createContext<DialogContextValue | null>(null);

export function useDialog(): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

interface DialogState extends ConfirmOptions {
  kind: 'confirm' | 'alert';
}

export function DialogProvider({ children }: PropsWithChildren) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  // Resolver for the promise handed back to the caller. Kept in a ref so
  // re-renders don't lose it.
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    setDialog(null);
    const resolve = resolveRef.current;
    resolveRef.current = null;
    resolve?.(value);
  }, []);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    if (!isWeb) {
      return new Promise((resolve) => {
        Alert.alert(options.title, options.message, [
          {
            text: options.cancelLabel ?? 'Cancel',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: options.confirmLabel ?? 'OK',
            style: options.destructive ? 'destructive' : 'default',
            onPress: () => resolve(true),
          },
        ]);
      });
    }

    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setDialog({ ...options, kind: 'confirm' });
    });
  }, []);

  const alert = useCallback((options: AlertOptions): Promise<void> => {
    if (!isWeb) {
      return new Promise((resolve) => {
        Alert.alert(options.title, options.message, [
          { text: 'OK', onPress: () => resolve() },
        ]);
      });
    }

    return new Promise<void>((resolve) => {
      resolveRef.current = () => resolve();
      setDialog({ ...options, kind: 'alert' });
    });
  }, []);

  const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal
        visible={dialog !== null}
        transparent
        animationType="fade"
        onRequestClose={() => settle(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.card}>
            <Text style={styles.title}>{dialog?.title}</Text>
            {dialog?.message ? (
              <Text style={styles.message}>{dialog.message}</Text>
            ) : null}

            <View style={styles.actions}>
              {dialog?.kind === 'confirm' && (
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => settle(false)}
                >
                  <Text style={styles.cancelText}>
                    {dialog?.cancelLabel ?? 'Cancel'}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  dialog?.destructive && styles.destructiveButton,
                ]}
                onPress={() => settle(true)}
              >
                <Text style={styles.confirmText}>
                  {dialog?.kind === 'alert'
                    ? 'OK'
                    : (dialog?.confirmLabel ?? 'OK')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Theme.colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    ...Theme.shadow.md,
  },
  title: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Theme.colors.textPrimary,
  },
  message: {
    fontSize: Theme.fontSize.md,
    color: Theme.colors.textSecondary,
    marginTop: Theme.spacing.sm,
    lineHeight: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.lg,
  },
  button: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
  },
  cancelButton: {
    backgroundColor: Theme.colors.surface,
  },
  confirmButton: {
    backgroundColor: Theme.colors.primary,
  },
  cancelText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.textSecondary,
  },
  confirmText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.semibold,
    color: Theme.colors.white,
  },
  destructiveButton: {
    backgroundColor: Theme.colors.error,
  },
});
