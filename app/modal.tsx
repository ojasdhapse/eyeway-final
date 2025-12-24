import AppBackground from '@/components/app-background';
import { EyewayColors } from '@/constants/theme';
import { useVoiceTurnManager } from '@/hooks/useVoiceTurnManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ModalScreen() {
  const router = useRouter();
  const { speakThenListen, speak } = useVoiceTurnManager();
  const hasListened = useRef(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!hasListened.current) {
      hasListened.current = true;

      const announceSettings = async () => {
        await new Promise(r => setTimeout(r, 500));

        const response = await speakThenListen(
          'Settings screen. Say go back to return to home.',
          4000
        );

        if (response && response.toLowerCase().includes('back')) {
          await speak('Going back to home');
          router.push('/(tabs)');
        }
      };

      announceSettings();
    }
  }, []);

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleVoiceCommand = async () => {
    if (isListening) return;

    setIsListening(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await speakThenListen('Listening for your command', 4000);

      if (response) {
        const lowerResponse = response.toLowerCase();

        if (lowerResponse.includes('back') || lowerResponse.includes('return')) {
          await speak('Going back to home');
          router.push('/(tabs)');
        } else {
          await speak('Command not recognized. You can say go back.');
        }
      }
    } finally {
      setIsListening(false);
    }
  };

  return (
    <AppBackground>
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={EyewayColors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.aboutContainer}>
          <Text style={styles.sectionTitle}>About Eyeway</Text>

          <Text style={styles.paragraph}>
            Eyeway is an accessible navigation app designed to help blind and visually impaired people move safely, confidently, and independently.
          </Text>

          <Text style={styles.paragraph}>
            Getting around cities can be challenging when navigation depends heavily on visual maps and screens. Eyeway changes that by focusing on clear guidance, real-time location awareness, and simplicity, helping users understand where they are and where they need to go without relying on visuals.
          </Text>

          <Text style={styles.subheading}>Features</Text>
          <Text style={styles.paragraph}>
            The app provides step-by-step navigation, instant location awareness, and the ability to save frequently used routes for quick access. Whether you are walking through familiar streets or exploring a new area, Eyeway supports you with reliable directions and safety-focused features.
          </Text>

          <Text style={styles.paragraph}>
            Eyeway also offers secure and easy sign-in options, including fingerprint, so your saved routes and preferences are always available when you need them.
          </Text>

          <Text style={styles.subheading}>Our Goal</Text>
          <Text style={styles.paragraph}>
            Our goal is simple: to make everyday navigation easier, safer, and more inclusive, while giving users the confidence to travel independently.
          </Text>
        </View>
      </ScrollView>

      {/* Floating Voice Command Button */}
      <TouchableOpacity
        style={styles.floatingVoiceButton}
        onPress={handleVoiceCommand}
        disabled={isListening}
        accessibilityLabel="Voice command button"
        accessibilityHint="Tap to give a voice command like go back"
      >
        <Ionicons
          name={isListening ? "mic" : "mic-outline"}
          size={28}
          color={EyewayColors.textPrimary}
        />
        {isListening && (
          <View style={styles.listeningIndicator} />
        )}
      </TouchableOpacity>
    </AppBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: EyewayColors.secondaryButton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: EyewayColors.textPrimary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  aboutContainer: {
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: EyewayColors.textPrimary,
    marginBottom: 16,
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    color: EyewayColors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: EyewayColors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  floatingVoiceButton: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: EyewayColors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 180,
    maxWidth: 320,
    alignSelf: 'center',
  },
  listeningIndicator: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: EyewayColors.accentBlue,
    opacity: 0.6,
  },
});
