import { EyewayColors } from '@/constants/theme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StatusIndicatorProps {
    status: 'ready' | 'navigating' | 'error';
    label?: string;
}

export function StatusIndicator({ status, label }: StatusIndicatorProps) {
    const getStatusColor = () => {
        switch (status) {
            case 'ready':
                return EyewayColors.statusReady;
            case 'navigating':
                return EyewayColors.statusNavigating;
            case 'error':
                return EyewayColors.statusError;
            default:
                return EyewayColors.statusReady;
        }
    };

    const getStatusLabel = () => {
        if (label) return label;
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <View
            style={styles.container}
            accessibilityRole="text"
            accessibilityLabel={`Status: ${getStatusLabel()}`}
        >
            <View style={[styles.dot, { backgroundColor: getStatusColor() }]} />
            <Text style={styles.label}>{getStatusLabel()}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: EyewayColors.secondaryButton,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 24,
        gap: 10,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    label: {
        color: EyewayColors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
});
