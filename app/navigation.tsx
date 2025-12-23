import { VoiceButton } from '@/components/voice-button';
import { NAVIGATION_ENDPOINT } from '@/constants/config';
import { EyewayColors } from '@/constants/theme';
import { recordAndTranscribe } from '@/hooks/useSpeechToText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function NavigationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ destination?: string; autoStart?: string }>();
    const [destination, setDestination] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const hasAutoStarted = useRef(false);

    useEffect(() => {
        // Get user's current location on mount
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Speech.speak('Location permission denied. Please enable location access.', {
                        language: 'en',
                        pitch: 1.0,
                        rate: 0.9,
                    });
                    return;
                }

                const location = await Location.getCurrentPositionAsync({});
                setCurrentLocation({
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                });
            } catch (error) {
                console.error('Error getting location:', error);
            }
        })();
    }, []);

    useEffect(() => {
        if (params.destination && typeof params.destination === 'string') {
            setDestination(params.destination);
        }
    }, [params.destination]);

    useEffect(() => {
        if (
            params.autoStart === 'true' &&
            params.destination &&
            currentLocation &&
            !hasAutoStarted.current
        ) {
            hasAutoStarted.current = true;
            handleStartNavigation(true);
        }
    }, [params.autoStart, params.destination, currentLocation]);

    const handleStartNavigation = async (isAutoStart = false, overrideDestination?: string) => {
        const targetDestination = overrideDestination || (params.destination && isAutoStart ? params.destination : destination);

        if (!targetDestination?.trim()) {
            Speech.speak('Please enter a destination', {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        if (!currentLocation) {
            Speech.speak('Getting your location. Please wait.', {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
            return;
        }

        setIsLoading(true);
        try {
            Speech.speak(`Starting navigation to ${targetDestination}`, {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Call the backend navigation API
            console.log('🚀 Making navigation request to:', NAVIGATION_ENDPOINT);
            console.log('📍 Request payload:', {
                current_location: currentLocation,
                destination: targetDestination.trim(),
            });

            const response = await fetch(NAVIGATION_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_location: currentLocation,
                    destination: targetDestination.trim(),
                }),
            });

            console.log('📥 Response status:', response.status);
            const data = await response.json();
            console.log('📦 Response data:', data);

            if (response.ok) {
                const distanceKm = (data.total_distance_meters / 1000).toFixed(1);
                Speech.speak(`Route found. Total distance: ${distanceKm} kilometers. Estimated time: ${data.estimated_time_minutes} minutes. Starting navigation.`, {
                    language: 'en',
                    pitch: 1.0,
                    rate: 0.9,
                });

                // Navigate to active navigation screen with route data
                setTimeout(() => {
                    router.push({
                        pathname: '/active-navigation',
                        params: {
                            navigationData: JSON.stringify(data),
                            destination: targetDestination,
                        },
                    });
                }, 2000); // Give time for speech to complete
            } else {
                throw new Error(data.detail || 'Navigation failed');
            }
        } catch (error) {
            console.error('❌ Navigation error:', error);
            console.error('Error details:', {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                endpoint: NAVIGATION_ENDPOINT,
            });
            Speech.speak(`Navigation error: ${error instanceof Error ? error.message : 'Unknown error'}`, {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    const activeRef = useRef(true);

    useEffect(() => {
        let isMounted = true;
        activeRef.current = true;

        const loop = async () => {
            // Initial prompt
            Speech.speak('Where would you like to go?', {
                language: 'en',
                rate: 0.9,
            });
            await new Promise((r) => setTimeout(r, 1500));

            while (activeRef.current && isMounted) {
                // If destination is already set, maybe we listen for "Start" or "Clear"?
                // For now, let's just listen for destination if empty, or new destination if full.

                let text: string | null = null;
                if (Platform.OS === 'web') {
                    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                    if (SpeechRecognition) {
                        try {
                            text = await new Promise((resolve) => {
                                const recog = new SpeechRecognition();
                                recog.lang = 'en-US';
                                recog.onresult = (e: any) => resolve(e.results[0][0].transcript);
                                recog.onerror = () => resolve(null);
                                recog.start();
                            });
                        } catch (e) {
                            text = null;
                        }
                    }
                } else {
                    text = await recordAndTranscribe();
                }

                if (!text) {
                    await new Promise((r) => setTimeout(r, 100)); // Short wait
                    continue;
                }

                const lowerText = text.toLowerCase();

                // Check for commands
                if (lowerText.includes('start navigation') || (lowerText.includes('start') && destination)) {
                    handleStartNavigation();
                    break;
                }

                if (lowerText.includes('go back') || lowerText.includes('back')) {
                    handleBack();
                    break;
                }

                // Treat as destination
                setDestination(text);
                Speech.speak(`Heard ${text}. Starting navigation.`, {
                    language: 'en',
                    rate: 0.9,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                // Set the destination immediately so handleStartNavigation can use it
                // We need to pass it directly because state update might be slow
                setTimeout(() => {
                    handleStartNavigation(false, text); // Pass text directly
                }, 2000);

                break; // Exit loop since we are starting navigation
            }
        };

        const timer = setTimeout(() => {
            loop();
        }, 1000); // Slight delay on mount before starting loop

        return () => {
            isMounted = false;
            activeRef.current = false;
            clearTimeout(timer);
            Speech.stop();
        };
    }, []); // Run on mount

    const handleVoiceInput = () => {
        // Voice input is now automatic, but button can restart it or provide feedback
        Speech.speak('Listening for destination...', {
            language: 'en',
            rate: 0.9,
        });
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    return (
        <LinearGradient
            colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={EyewayColors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Start Navigation</Text>
                <View style={styles.placeholder} />
            </View>

            {/* Content */}
            <View style={styles.content}>
                <Text style={styles.label}>Where would you like to go?</Text>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter destination"
                        placeholderTextColor={EyewayColors.textSecondary}
                        value={destination}
                        onChangeText={setDestination}
                        accessibilityLabel="Destination input"
                    />
                    <Pressable
                        onPress={handleVoiceInput}
                        style={styles.micButton}
                        accessibilityRole="button"
                        accessibilityLabel="Voice input"
                    >
                        <Ionicons name="mic" size={24} color={EyewayColors.textPrimary} />
                    </Pressable>
                </View>

                <VoiceButton
                    title={isLoading ? "Starting..." : "Start"}
                    onPress={handleStartNavigation}
                    variant="primary"
                    style={styles.startButton}
                    disabled={isLoading || !currentLocation}
                />

                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={EyewayColors.accentBlue} />
                        <Text style={styles.loadingText}>Connecting to navigation service...</Text>
                    </View>
                )}

                {!currentLocation && !isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={EyewayColors.accentBlue} />
                        <Text style={styles.loadingText}>Getting your location...</Text>
                    </View>
                )}

                <Text style={styles.hint}>
                    Tap the microphone to use voice input, or type your destination above.
                </Text>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: EyewayColors.textPrimary,
    },
    placeholder: {
        width: 44,
    },
    content: {
        flex: 1,
    },
    label: {
        fontSize: 18,
        color: EyewayColors.textPrimary,
        marginBottom: 16,
        fontWeight: '600',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: EyewayColors.secondaryButton,
        borderRadius: 16,
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    input: {
        flex: 1,
        color: EyewayColors.textPrimary,
        fontSize: 18,
        paddingVertical: 20,
    },
    micButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: EyewayColors.accentBlue,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    startButton: {
        marginBottom: 24,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    loadingText: {
        fontSize: 14,
        color: EyewayColors.textSecondary,
    },
    hint: {
        fontSize: 14,
        color: EyewayColors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
});
