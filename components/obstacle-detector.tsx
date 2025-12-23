import { EyewayColors } from '@/constants/theme';
import { Obstacle, useObstacleDetection } from '@/hooks/useObstacleDetection';
import { Ionicons } from '@expo/vector-icons';
import { CameraView } from 'expo-camera';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface ObstacleDetectorProps {
    enabled?: boolean;
    showCamera?: boolean;
    onObstacleDetected?: (obstacles: Obstacle[]) => void;
}

export function ObstacleDetector({
    enabled = true,
    showCamera = false,
    onObstacleDetected,
}: ObstacleDetectorProps) {
    const { obstacles, isDetecting, hasPermission, error, cameraRef } = useObstacleDetection({
        enabled,
        onObstacleDetected,
        announceObstacles: true,
    });

    // Cleanup on unmount
    React.useEffect(() => {
        return () => {
            // Clear camera ref on unmount to prevent errors
            if (cameraRef.current) {
                cameraRef.current = null;
            }
        };
    }, []);

    // Don't render if no permission (silently disabled)
    if (!hasPermission) {
        return null;
    }

    // Get critical obstacles (front, high confidence)
    const criticalObstacles = obstacles.filter(
        (obs) => obs.position === 'FRONT' && obs.confidence >= 0.7
    );

    return (
        <View style={styles.container}>
            {/* Hidden camera for frame capture */}
            <CameraView
                ref={cameraRef}
                style={showCamera ? styles.cameraVisible : styles.cameraHidden}
                facing="back"
            />

            {/* Obstacle Alert Overlay */}
            {criticalObstacles.length > 0 && (
                <View style={styles.alertOverlay}>
                    {criticalObstacles.map((obstacle, index) => (
                        <View key={index} style={styles.alertBanner}>
                            <Ionicons
                                name="warning"
                                size={24}
                                color={EyewayColors.textPrimary}
                            />
                            <View style={styles.alertContent}>
                                <Text style={styles.alertText}>{obstacle.description}</Text>
                                <Text style={styles.confidenceText}>
                                    {(obstacle.confidence * 100).toFixed(0)}% confident
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>
            )}

            {/* Detection Indicator (Optional) */}
            {isDetecting && (
                <View style={styles.detectingIndicator}>
                    <View style={styles.detectingDot} />
                    <Text style={styles.detectingText}>Scanning</Text>
                </View>
            )}

            {/* Error Indicator (Silent - only visible in debug) */}
            {__DEV__ && error && (
                <View style={styles.errorIndicator}>
                    <Text style={styles.errorText}>⚠️ {error}</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 150, // Small area for camera
    },
    cameraHidden: {
        width: 1,
        height: 1,
        opacity: 0,
    },
    cameraVisible: {
        flex: 1,
        opacity: 0.3, // Semi-transparent
    },
    alertOverlay: {
        position: 'absolute',
        top: -200, // Position above camera area
        left: 0,
        right: 0,
        padding: 16,
        gap: 12,
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 59, 48, 0.95)', // Red alert
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    alertContent: {
        flex: 1,
    },
    alertText: {
        color: EyewayColors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 2,
    },
    confidenceText: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 12,
    },
    detectingIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 122, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        gap: 6,
    },
    detectingDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: EyewayColors.textPrimary,
    },
    detectingText: {
        color: EyewayColors.textPrimary,
        fontSize: 12,
        fontWeight: '600',
    },
    errorIndicator: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        right: 8,
        backgroundColor: 'rgba(255, 149, 0, 0.9)',
        padding: 8,
        borderRadius: 8,
    },
    errorText: {
        color: EyewayColors.textPrimary,
        fontSize: 10,
        textAlign: 'center',
    },
});
