import { EyewayColors } from '@/constants/theme';
import { useVoiceTurnManager } from '@/hooks/useVoiceTurnManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '@/components/app-background';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LocationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ voiceInitiated?: string }>();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [isListening, setIsListening] = useState(false);
    const { speakThenListen, speak } = useVoiceTurnManager();
    const hasListenedForBack = useRef(false);

    useEffect(() => {
        getCurrentLocation();
    }, []);

    const getCurrentLocation = async () => {
        try {
            setLoading(true);
            setError('');

            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setError('Permission to access location was denied');
                Speech.speak('Permission to access location was denied', {
                    language: 'en',
                    pitch: 1.0,
                    rate: 0.9,
                });
                setLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // Get address from coordinates
            const addressData = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });

            if (addressData.length > 0) {
                const addr = addressData[0];
                const formattedAddress = `${addr.street || ''}, ${addr.city || ''}, ${addr.region || ''} ${addr.postalCode || ''}`.trim();
                setAddress(formattedAddress);

                // Announce location
                Speech.speak(`You are at ${formattedAddress}`, {
                    language: 'en',
                    pitch: 1.0,
                    rate: 0.9,
                });
            }

            setLoading(false);
        } catch (err) {
            setError('Failed to get location');
            Speech.speak('Failed to get your current location', {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
            setLoading(false);
        }
    };

    // Voice-initiated listening for 'go back'
    useEffect(() => {
        if (
            params.voiceInitiated === 'true' &&
            !loading &&
            address &&
            !hasListenedForBack.current
        ) {
            hasListenedForBack.current = true;

            const listenForBack = async () => {
                // Wait for location announcement to complete
                await new Promise(r => setTimeout(r, 2500));

                // Prompt and listen for go back
                const response = await speakThenListen('Say go back to return to home', 4000);
                if (response && response.toLowerCase().includes('back')) {
                    Speech.speak('Going back to home', {
                        language: 'en',
                        pitch: 1.0,
                        rate: 0.9,
                    });
                    router.push('/(tabs)');
                }
            };

            listenForBack();
        }
    }, [params.voiceInitiated, loading, address]);

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
                } else if (lowerResponse.includes('repeat') || lowerResponse.includes('again')) {
                    handleRepeat();
                } else {
                    await speak('Command not recognized. You can say go back or repeat.');
                }
            }
        } finally {
            setIsListening(false);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        getCurrentLocation();
    };

    const handleRepeat = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (address) {
            Speech.speak(`You are at ${address}`, {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
        }
    };

    return (
        <AppBackground contentContainerStyle={{ marginTop: 40, marginLeft: 0, marginRight: 'auto' }}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={EyewayColors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Where Am I</Text>
                <Pressable onPress={handleRefresh} style={styles.refreshButton}>
                    <Ionicons name="refresh" size={24} color={EyewayColors.textPrimary} />
                </Pressable>
            </View>

            {/* Content */}
            <View style={styles.content}>
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={EyewayColors.accentBlue} />
                        <Text style={styles.loadingText}>Getting your location...</Text>
                    </View>
                ) : error ? (
                    <View style={styles.errorContainer}>
                        <Ionicons name="alert-circle" size={64} color={EyewayColors.statusError} />
                        <Text style={styles.errorText}>{error}</Text>
                        <Pressable onPress={handleRefresh} style={styles.retryButton}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </Pressable>
                    </View>
                ) : (
                    <View style={styles.locationContainer}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="location" size={64} color={EyewayColors.accentBlue} />
                        </View>

                        <Text style={styles.label}>Your Current Location</Text>

                        <View style={styles.addressContainer}>
                            <Text style={styles.address}>{address || 'Location found'}</Text>
                        </View>

                        {location && (
                            <View style={styles.coordsContainer}>
                                <Text style={styles.coords}>
                                    Lat: {location.coords.latitude.toFixed(6)}
                                </Text>
                                <Text style={styles.coords}>
                                    Long: {location.coords.longitude.toFixed(6)}
                                </Text>
                            </View>
                        )}

                        <Pressable onPress={handleRepeat} style={styles.repeatButton}>
                            <Ionicons name="volume-high" size={24} color={EyewayColors.textPrimary} />
                            <Text style={styles.repeatText}>Repeat Location</Text>
                        </Pressable>
                    </View>
                )}
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
        </AppBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // padding removed, handled by AppBackground
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: EyewayColors.secondaryButton,
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshButton: {
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
    },
    loadingContainer: {
        alignItems: 'center',
        gap: 20,
    },
    loadingText: {
        fontSize: 18,
        color: EyewayColors.textSecondary,
    },
    errorContainer: {
        alignItems: 'center',
        gap: 20,
    },
    errorText: {
        fontSize: 18,
        color: EyewayColors.textPrimary,
        textAlign: 'center',
    },
    retryButton: {
        backgroundColor: EyewayColors.primaryButton,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 12,
        marginTop: 16,
    },
    retryText: {
        color: EyewayColors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    locationContainer: {
        alignItems: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 18,
        color: EyewayColors.textSecondary,
        marginBottom: 16,
    },
    addressContainer: {
        backgroundColor: EyewayColors.secondaryButton,
        padding: 24,
        borderRadius: 16,
        width: '100%',
        marginBottom: 24,
    },
    address: {
        fontSize: 20,
        color: EyewayColors.textPrimary,
        textAlign: 'center',
        lineHeight: 28,
    },
    coordsContainer: {
        gap: 8,
        marginBottom: 32,
    },
    coords: {
        fontSize: 14,
        color: EyewayColors.textSecondary,
        textAlign: 'center',
    },
    repeatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: EyewayColors.secondaryButton,
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        minWidth: 180,
        maxWidth: 320,
        alignSelf: 'center',
    },
    repeatText: {
        color: EyewayColors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
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
