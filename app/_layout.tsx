import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
// Initialize Firebase early in the app lifecycle
import '@/app/config/firebase.config';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Disabled continuous voice control in favor of session-based prompts
  // Voice interaction now follows turn-based pattern:
  // 1. Initial prompt after sign-in (in home screen)
  // 2. Screen-specific voice flows (navigation destination, route reading)
  // This ensures proper turn-taking: app speaks → mic activates → user speaks → app acts
  /*
  useHomeVoiceControl((action: VoiceAction) => {
    try {
      switch (action) {
        case 'START_NAVIGATION':
          router.push('/navigation');
          break;
        case 'WHERE_AM_I':
          router.push('/location');
          break;
        case 'SAVED_ROUTES':
          router.push('/routes');
          break;
        case 'SETTINGS':
          router.push('/modal');
          break;
        case 'GO_BACK':
          if (router.canGoBack()) {
            router.back();
          }
          break;
      }
    } catch (e) {
      console.error('Navigation failed:', e);
    }
  });
  */

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
