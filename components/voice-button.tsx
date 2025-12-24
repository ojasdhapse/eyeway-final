import { EyewayColors } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle } from 'react-native';

interface VoiceButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary';
    style?: ViewStyle;
    accessibilityLabel?: string;
    disabled?: boolean;
}

export function VoiceButton({
    title,
    onPress,
    variant = 'primary',
    style,
    accessibilityLabel,
    disabled = false,
}: VoiceButtonProps) {
    const handlePress = () => {
        if (disabled) return;

        // Haptic feedback
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Voice feedback
        Speech.speak(title, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });

        onPress();
    };

    const isPrimary = variant === 'primary';

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                styles.button,
                isPrimary ? styles.primaryButton : styles.secondaryButton,
                pressed && !disabled && (isPrimary ? styles.primaryButtonPressed : styles.secondaryButtonPressed),
                disabled && styles.disabledButton,
                style,
            ]}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel || title}
            accessibilityHint={`Tap to ${title.toLowerCase()}`}
            disabled={disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Text style={[styles.buttonText, disabled && styles.disabledText]}>{title}</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: 20,
        paddingHorizontal: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 64,
        width: '100%',
        borderWidth: 2,
        borderColor: EyewayColors.neonBlue,
    },
    primaryButton: {
        backgroundColor: 'rgba(91, 163, 245, 0.15)',
    },
    primaryButtonPressed: {
        backgroundColor: 'rgba(91, 163, 245, 0.3)',
    },
    secondaryButton: {
        backgroundColor: 'rgba(58, 74, 90, 0.25)',
    },
    secondaryButtonPressed: {
        backgroundColor: 'rgba(74, 90, 106, 0.4)',
    },
    buttonText: {
        color: EyewayColors.textPrimary,
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    disabledButton: {
        opacity: 0.5,
    },
    disabledText: {
        color: EyewayColors.textSecondary,
    },
});
