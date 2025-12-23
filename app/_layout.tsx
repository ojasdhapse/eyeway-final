import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
// Initialize Firebase early in the app lifecycle
import '@/app/config/firebase.config';
import { useHomeVoiceControl } from '@/hooks/useHomeVoiceControl';
import { VoiceAction } from '@/hooks/voiceCommands';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
