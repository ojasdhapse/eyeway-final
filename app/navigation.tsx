import { VoiceButton } from '@/components/voice-button';
import { NAVIGATION_ENDPOINT } from '@/constants/config';
import { EyewayColors } from '@/constants/theme';
import { recordAndTranscribe } from '@/hooks/useSpeechToText';
import { useVoiceTurnManager } from '@/hooks/useVoiceTurnManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

/**
 * Clean up voice-transcribed destination text
 * Removes common TTS prompts and artifacts
 */
function cleanDestinationText(text: string): string {
    if (!text) return text;

    // Remove common prompt phrases that might have been picked up
    const promptsToRemove = [
        /^where would you like to go\??\s*/i,
    ];

    let cleaned = text.trim();
    for (const pattern of promptsToRemove) {
        cleaned = cleaned.replace(pattern, '');
    }

    return cleaned.trim();
}

export default function NavigationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ destination?: string; autoStart?: string; voiceInitiated?: string }>();
    const [destination, setDestination] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const hasAutoStarted = useRef(false);
    const hasVoicePrompted = useRef(false);
    const { speakThenListen } = useVoiceTurnManager();

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

    // Voice-initiated destination prompt - DISABLED
    // The continuous loop below handles all destination prompting
    /*
    useEffect(() => {
        if (
            params.voiceInitiated === 'true' &&
            currentLocation &&
            !hasVoicePrompted.current
        ) {
            hasVoicePrompted.current = true;

            const promptForDestination = async () => {
                // Small delay to let screen render
                await new Promise(r => setTimeout(r, 500));

                const response = await speakThenListen(
                    'Where would you like to go?',
                    5000, // Give user 5 seconds to say destination
                    { rate: 0.75 } // Slower speech rate for better clarity
                );

                if (response && response.trim()) {
                    // Clean up the response to remove any TTS artifacts
                    const cleanedResponse = cleanDestinationText(response);
                    console.log('🎤 Raw voice response:', response);
                    console.log('✨ Cleaned destination:', cleanedResponse);

                    if (cleanedResponse) {
                        setDestination(cleanedResponse);

                        // Auto-start navigation with the captured destination
                        // Small delay to let state update
                        setTimeout(() => {
                            handleStartNavigation(false, cleanedResponse);
                        }, 300);
                    } else {
                        Speech.speak('Could not understand the destination. Please try again.', {
                            language: 'en',
                            pitch: 1.0,
                            rate: 0.9,
                        });
                    }
                } else {
                    Speech.speak('No destination heard. Please enter one manually or use voice input.', {
                        language: 'en',
                        pitch: 1.0,
                        rate: 0.9,
                    });
                }
            };

            promptForDestination();
        }
    }, [params.voiceInitiated, currentLocation]);
    */

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

        // Wait for location if not available yet
        let locationToUse = currentLocation;
        if (!locationToUse) {
            Speech.speak('Getting your location. Please wait.', {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
            });

            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Speech.speak('Location permission denied. Please enable location access.', {
                        language: 'en',
                        pitch: 1.0,
                        rate: 0.9,
                    });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    return;
                }

                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });
                locationToUse = {
                    lat: location.coords.latitude,
                    lng: location.coords.longitude,
                };
                setCurrentLocation(locationToUse);
            } catch (error) {
                console.error('Error getting location:', error);
                Speech.speak('Could not get your location. Please try again.', {
                    language: 'en',
                    pitch: 1.0,
                    rate: 0.9,
                });
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                return;
            }
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
                current_location: locationToUse,
                destination: targetDestination.trim(),
            });

            const response = await fetch(NAVIGATION_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    current_location: locationToUse,
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
            // Reset voice prompt flag on mount to allow re-prompting
            hasVoicePrompted.current = false;

            // Initial small delay
            await new Promise((r) => setTimeout(r, 500));

            console.log('🔄 [NavLoop] Starting voice loop');

            while (activeRef.current && isMounted) {
                // Skip if navigation is already in progress
                if (isLoading) {
                    console.log('⏸️ [NavLoop] Navigation in progress, waiting...');
                    await new Promise((r) => setTimeout(r, 1000));
                    continue;
                }

                console.log('🎤 [NavLoop] Starting new cycle');

                // Step 1: Ask "Where would you like to go?"
                console.log('🗣️ [NavLoop] Speaking prompt...');
                Speech.speak('Where would you like to go?', {
                    language: 'en',
                    rate: 0.75,
                });
                await new Promise((r) => setTimeout(r, 2000)); // Wait for speech to complete

                // Step 2: Turn on mic and listen
                console.log('👂 [NavLoop] Listening for voice input...');
                let text: string | null = null;
                try {
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
                                console.log('❌ [NavLoop] Web speech recognition error:', e);
                                text = null;
                            }
                        }
                    } else {
                        // Android/iOS
                        text = await recordAndTranscribe();
                        console.log('📝 [NavLoop] Transcription result:', text || 'null/empty');
                    }
                } catch (error) {
                    console.error('❌ [NavLoop] Error during voice input:', error);
                    text = null;
                }

                // Step 3: Process the response
                if (text && text.trim()) {
                    const cleanedText = cleanDestinationText(text);
                    const lowerText = cleanedText.toLowerCase();
                    console.log('✨ [NavLoop] Cleaned text:', cleanedText);

                    // Check for back command - go to home page
                    if (lowerText.includes('go back') || lowerText.includes('back')) {
                        console.log('🔙 [NavLoop] Go back command detected');
                        Speech.speak('Going back to home', {
                            language: 'en',
                            rate: 0.9,
                        });
                        router.push('/(tabs)');
                        break; // Exit loop
                    }

                    // Treat as destination and auto-start navigation
                    if (cleanedText && cleanedText.length > 2) {
                        console.log('🚀 [NavLoop] Valid destination detected, starting navigation');
                        setDestination(cleanedText);
                        Speech.speak(`Starting navigation to ${cleanedText}`, {
                            language: 'en',
                            rate: 0.9,
                        });
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                        // Auto-start navigation
                        setTimeout(() => {
                            handleStartNavigation(false, cleanedText);
                        }, 2000);

                        break; // Exit loop after starting navigation
                    } else {
                        console.log('⚠️ [NavLoop] Text too short or invalid, continuing loop');
                    }
                } else {
                    console.log('🔇 [NavLoop] No voice input detected or recognition failed');
                }

                // Step 4: Wait 20 seconds before next cycle
                console.log('⏰ [NavLoop] Waiting 20 seconds before next cycle...');
                await new Promise((r) => setTimeout(r, 20000));
            }

            console.log('🛑 [NavLoop] Loop ended');
        };

        const timer = setTimeout(() => {
            loop();
        }, 1000); // Slight delay on mount before starting loop

        return () => {
            console.log('🧹 [NavLoop] Cleanup - stopping loop');
            isMounted = false;
            activeRef.current = false;
            clearTimeout(timer);
            Speech.stop();
        };
    }, []); // Run on mount - will restart voice loop on every component mount/refresh

    const handleVoiceInput = () => {
        // Voice input is now automatic, but button can restart it or provide feedback
        Speech.speak('Listening for destination...', {
            language: 'en',
            rate: 0.9,
        });
    };

    const handleBack = () => {
        // Stop any ongoing speech and voice loop
        activeRef.current = false;
        Speech.stop();

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
                <Pressable
                    onPress={handleBack}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
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
