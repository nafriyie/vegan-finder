import { TouchableOpacity } from 'react-native';
import type { ComponentProps } from 'react';

type AppTouchableProps = ComponentProps<typeof TouchableOpacity>;

/**
 * TouchableOpacity with press feedback that fires immediately.
 *
 * react-native-web's PressResponder defaults delayPressIn to 50ms
 * (DEFAULT_PRESS_DELAY_MS), so every tap's visual response lags. Harmless on
 * native, noticeable on web.
 */
export function AppTouchable({ delayPressIn = 0, ...props }: AppTouchableProps) {
  return <TouchableOpacity delayPressIn={delayPressIn} {...props} />;
}
