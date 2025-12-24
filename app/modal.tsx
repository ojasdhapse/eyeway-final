import { EyewayColors } from '@/constants/theme';
import { useVoiceTurnManager } from '@/hooks/useVoiceTurnManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
    <LinearGradient
      colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={EyewayColors.textPrimary} />
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <Ionicons name="settings-outline" size={64} color={EyewayColors.textSecondary} />
          <Text style={styles.messageText}>Settings coming soon</Text>
          <Text style={styles.subText}>Additional features will be added here</Text>
        </View>
      </View>

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
    </LinearGradient>
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    alignItems: 'center',
    gap: 16,
  },
  messageText: {
    fontSize: 20,
    fontWeight: '600',
    color: EyewayColors.textPrimary,
  },
  subText: {
    fontSize: 16,
    color: EyewayColors.textSecondary,
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
