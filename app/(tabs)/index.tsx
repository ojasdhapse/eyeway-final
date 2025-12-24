import { auth } from '@/app/config/firebase.config';
import { StatusIndicator } from '@/components/status-indicator';
import { VoiceButton } from '@/components/voice-button';
import { EyewayColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceTurnManager } from '@/hooks/useVoiceTurnManager';
import { parseVoiceCommand } from '@/hooks/voiceCommands';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { signOut } from 'firebase/auth';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';


export default function HomeScreen() {
  const { token, loading } = useAuth();

  const router = useRouter();
  const [status, setStatus] = useState<'ready' | 'navigating' | 'error'>('ready');
  const { speakThenListen, speak } = useVoiceTurnManager();
  const isActiveRef = useRef(true);

  // Continuous voice command loop - repeats every 20 seconds
  useEffect(() => {
    if (!loading && token) {
      isActiveRef.current = true;

      const runVoiceCycle = async () => {
        // Initial delay to let screen render on first load
        await new Promise(r => setTimeout(r, 500));

        while (isActiveRef.current) {
          try {
            setStatus('ready');
            const response = await speakThenListen(
              'You can speak a command now. Say start navigation, saved routes, where am I, or settings.'
            );

            if (response) {
              console.log('Voice command:', response);
              const command = parseVoiceCommand(response);

              if (command) {
                setStatus('navigating');
                await speak(`Opening ${command.replace(/_/g, ' ').toLowerCase()}`);

                switch (command) {
                  case 'START_NAVIGATION':
                    router.push({ pathname: '/navigation', params: { voiceInitiated: 'true' } });
                    break;
                  case 'WHERE_AM_I':
                    router.push({ pathname: '/location', params: { voiceInitiated: 'true' } });
                    break;
                  case 'SAVED_ROUTES':
                    router.push({ pathname: '/routes', params: { voiceInitiated: 'true' } });
                    break;
                  case 'SETTINGS':
                    router.push('/modal');
                    break;
                }
                // After navigation, exit the loop
                break;
              } else {
                setStatus('error');
                await speak(`Command not recognized. I heard: ${response}. Please try again.`);
                setStatus('ready');
              }
            }

            // Wait 20 seconds before next cycle (only if still active and no navigation happened)
            if (isActiveRef.current) {
              await new Promise(r => setTimeout(r, 20000));
            }
          } catch (error) {
            console.error('Voice cycle error:', error);
            // Wait before retry on error
            if (isActiveRef.current) {
              await new Promise(r => setTimeout(r, 5000));
            }
          }
        }
      };

      runVoiceCycle();

      return () => {
        isActiveRef.current = false;
      };
    }
  }, [loading, token]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // 🚫 If not authenticated, redirect to login
  if (!token) {
    return <Redirect href="/login" />;
  }

  const handleStartNavigation = () => {
    router.push('/navigation');
  };

  const handleWhereAmI = () => {
    router.push('/location');
  };

  const handleSavedRoutes = () => {
    router.push('/routes');
  };

  const handleSettings = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/modal');
  };
  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signOut(auth);
  };

  return (
    <LinearGradient
      colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
      style={styles.container}
    >
      {/* Header with Logo */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>Eyeway</Text>
          <View style={styles.voiceIcon}>
            <Ionicons name="mic" size={24} color={EyewayColors.textPrimary} />
          </View>
        </View>
        <Text style={styles.tagline}>Your voice-guided companion</Text>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        <View style={styles.buttonContainer}>
          <VoiceButton
            title="Start Navigation"
            onPress={handleStartNavigation}
            variant="primary"
            style={styles.button}
          />

          <VoiceButton
            title="Where Am I"
            onPress={handleWhereAmI}
            variant="secondary"
            style={styles.button}
          />

          <VoiceButton
            title="Saved Routes"
            onPress={handleSavedRoutes}
            variant="secondary"
            style={styles.button}
          />
        </View>
      </View>

      {/* Footer with Status and Settings */}
      <View style={styles.footer}>
        <StatusIndicator status={status} />
        <VoiceButton
          title="Logout"
          onPress={handleLogout}
          variant="secondary"
          style={styles.logoutButton}
        />

        <Pressable
          onPress={handleSettings}
          style={({ pressed }) => [
            styles.settingsButton,
            pressed && styles.settingsButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons
            name="settings-outline"
            size={28}
            color={EyewayColors.settingsIcon}
          />
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: EyewayColors.textPrimary,
    letterSpacing: 1,
  },
  voiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: EyewayColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagline: {
    fontSize: 16,
    color: EyewayColors.textSecondary,
    letterSpacing: 0.5,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    gap: 16,
    paddingHorizontal: 8,
  },
  button: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButton: {
    flex: 1,
    marginRight: 12,
  },
  settingsButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: EyewayColors.secondaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonPressed: {
    backgroundColor: EyewayColors.secondaryButtonHover,
  },
});
