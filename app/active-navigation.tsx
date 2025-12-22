import { EyewayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface Step {
    instruction: string;
    distance_meters: number;
    duration_seconds: number;
    maneuver: string;
    start_location: { lat: number; lng: number };
    end_location: { lat: number; lng: number };
}

interface NavigationData {
    route_mode: string;
    total_distance_meters: number;
    estimated_time_minutes: number;
    steps: Step[];
    polyline: string;
}

export default function ActiveNavigationScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [navigationData, setNavigationData] = useState<NavigationData | null>(null);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const lastSpokenStep = useRef<number>(-1);

    // Parse navigation data from params
    useEffect(() => {
        if (params.navigationData) {
            try {
                const data = JSON.parse(params.navigationData as string);
                setNavigationData(data);
                setIsLoading(false);
            } catch (err) {
                setError('Failed to parse navigation data');
                setIsLoading(false);
            }
        }
    }, [params.navigationData]);

    // Start location tracking
    useEffect(() => {
        let mounted = true;

        const startLocationTracking = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    setError('Location permission denied');
                    return;
                }

                // Get initial location
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.BestForNavigation,
                });

                if (mounted) {
                    setCurrentLocation({
                        lat: location.coords.latitude,
                        lng: location.coords.longitude,
                    });
                }

                // Start watching location
                locationSubscription.current = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.BestForNavigation,
                        timeInterval: 2000, // Update every 2 seconds
                        distanceInterval: 5, // Or every 5 meters
                    },
                    (location) => {
                        if (mounted) {
                            setCurrentLocation({
                                lat: location.coords.latitude,
                                lng: location.coords.longitude,
                            });
                        }
                    }
                );
            } catch (err) {
                console.error('Location tracking error:', err);
                if (mounted) {
                    setError('Failed to track location');
                }
            }
        };

        startLocationTracking();

        return () => {
            mounted = false;
            if (locationSubscription.current) {
                locationSubscription.current.remove();
            }
        };
    }, []);

    // Update current step based on location and speak instructions
    useEffect(() => {
        if (!navigationData || !currentLocation) return;

        const currentStep = navigationData.steps[currentStepIndex];
        if (!currentStep) return;

        // Calculate distance to next step
        const distanceToNextStep = calculateDistance(
            currentLocation,
            currentStep.end_location
        );

        // Speak instruction if we haven't spoken it yet or if we're close
        if (lastSpokenStep.current !== currentStepIndex) {
            speakInstruction(currentStep, distanceToNextStep);
            lastSpokenStep.current = currentStepIndex;
        }

        // Move to next step if we're close enough (within 20 meters)
        if (distanceToNextStep < 20 && currentStepIndex < navigationData.steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        }

        // Check if we've reached the destination (last step and close enough)
        if (currentStepIndex === navigationData.steps.length - 1 && distanceToNextStep < 20) {
            handleDestinationReached();
        }
    }, [currentLocation, currentStepIndex, navigationData]);

    const calculateDistance = (
        point1: { lat: number; lng: number },
        point2: { lat: number; lng: number }
    ): number => {
        // Haversine formula to calculate distance between two points
        const R = 6371e3; // Earth's radius in meters
        const φ1 = (point1.lat * Math.PI) / 180;
        const φ2 = (point2.lat * Math.PI) / 180;
        const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
        const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    };

    const speakInstruction = (step: Step, distance: number) => {
        const distanceText = distance > 1000
            ? `In ${(distance / 1000).toFixed(1)} kilometers`
            : `In ${Math.round(distance)} meters`;

        const instruction = `${distanceText}, ${step.instruction}`;

        Speech.speak(instruction, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const handleDestinationReached = () => {
        Speech.speak('You have reached your destination', {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Navigate back after a delay
        setTimeout(() => {
            router.back();
        }, 3000);
    };

    const handleEndNavigation = () => {
        Speech.speak('Navigation ended', {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.back();
    };

    const formatDistance = (meters: number): string => {
        if (meters >= 1000) {
            return `${(meters / 1000).toFixed(1)} km`;
        }
        return `${Math.round(meters)} m`;
    };

    const formatDuration = (seconds: number): string => {
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) {
            return `${minutes} min`;
        }
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    };

    if (isLoading) {
        return (
            <LinearGradient
                colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
                style={styles.container}
            >
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={EyewayColors.accentBlue} />
                    <Text style={styles.loadingText}>Loading navigation...</Text>
                </View>
            </LinearGradient>
        );
    }

    if (error || !navigationData) {
        return (
            <LinearGradient
                colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
                style={styles.container}
            >
                <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={64} color={EyewayColors.error} />
                    <Text style={styles.errorText}>{error || 'No navigation data'}</Text>
                    <Pressable onPress={() => router.back()} style={styles.backButton}>
                        <Text style={styles.backButtonText}>Go Back</Text>
                    </Pressable>
                </View>
            </LinearGradient>
        );
    }

    const currentStep = navigationData.steps[currentStepIndex];
    const remainingSteps = navigationData.steps.slice(currentStepIndex);
    const remainingDistance = remainingSteps.reduce((sum, step) => sum + step.distance_meters, 0);
    const remainingTime = remainingSteps.reduce((sum, step) => sum + step.duration_seconds, 0);
    const distanceToNextStep = currentLocation
        ? calculateDistance(currentLocation, currentStep.end_location)
        : currentStep.distance_meters;

    return (
        <LinearGradient
            colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
            style={styles.container}
        >
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerInfo}>
                    <Text style={styles.headerDistance}>{formatDistance(remainingDistance)}</Text>
                    <Text style={styles.headerTime}>{formatDuration(remainingTime)}</Text>
                </View>
                <Pressable onPress={handleEndNavigation} style={styles.endButton}>
                    <Ionicons name="close" size={28} color={EyewayColors.textPrimary} />
                </Pressable>
            </View>

            {/* Current Instruction */}
            <View style={styles.currentInstructionContainer}>
                <View style={styles.maneuverIcon}>
                    <Ionicons
                        name={getManeuverIcon(currentStep.maneuver)}
                        size={48}
                        color={EyewayColors.accentBlue}
                    />
                </View>
                <View style={styles.instructionContent}>
                    <Text style={styles.distanceText}>
                        {formatDistance(distanceToNextStep)}
                    </Text>
                    <Text style={styles.instructionText}>{currentStep.instruction}</Text>
                </View>
            </View>

            {/* Progress */}
            <View style={styles.progressContainer}>
                <Text style={styles.progressText}>
                    Step {currentStepIndex + 1} of {navigationData.steps.length}
                </Text>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${((currentStepIndex + 1) / navigationData.steps.length) * 100}%` }
                        ]}
                    />
                </View>
            </View>

            {/* Upcoming Steps */}
            <View style={styles.upcomingContainer}>
                <Text style={styles.upcomingTitle}>Upcoming Steps</Text>
                <ScrollView
                    style={styles.stepsList}
                    showsVerticalScrollIndicator={false}
                >
                    {navigationData.steps.slice(currentStepIndex + 1, currentStepIndex + 4).map((step, index) => (
                        <View key={index} style={styles.upcomingStep}>
                            <Ionicons
                                name={getManeuverIcon(step.maneuver)}
                                size={24}
                                color={EyewayColors.textSecondary}
                            />
                            <View style={styles.upcomingStepContent}>
                                <Text style={styles.upcomingStepText}>{step.instruction}</Text>
                                <Text style={styles.upcomingStepDistance}>
                                    {formatDistance(step.distance_meters)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </LinearGradient>
    );
}

const getManeuverIcon = (maneuver: string): keyof typeof Ionicons.glyphMap => {
    const maneuverLower = maneuver.toLowerCase();
    if (maneuverLower.includes('left')) return 'arrow-back';
    if (maneuverLower.includes('right')) return 'arrow-forward';
    if (maneuverLower.includes('straight') || maneuverLower.includes('continue')) return 'arrow-up';
    if (maneuverLower.includes('u-turn')) return 'return-down-back';
    if (maneuverLower.includes('exit')) return 'exit';
    return 'arrow-up';
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingBottom: 20,
        paddingHorizontal: 24,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
    },
    loadingText: {
        fontSize: 16,
        color: EyewayColors.textSecondary,
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        paddingHorizontal: 40,
    },
    errorText: {
        fontSize: 18,
        color: EyewayColors.textPrimary,
        textAlign: 'center',
    },
    backButton: {
        backgroundColor: EyewayColors.primaryButton,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        marginTop: 20,
    },
    backButtonText: {
        color: EyewayColors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    headerInfo: {
        flex: 1,
    },
    headerDistance: {
        fontSize: 32,
        fontWeight: 'bold',
        color: EyewayColors.textPrimary,
    },
    headerTime: {
        fontSize: 18,
        color: EyewayColors.textSecondary,
        marginTop: 4,
    },
    endButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: EyewayColors.error,
        alignItems: 'center',
        justifyContent: 'center',
    },
    currentInstructionContainer: {
        backgroundColor: EyewayColors.secondaryButton,
        borderRadius: 20,
        padding: 24,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    maneuverIcon: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: EyewayColors.backgroundEnd,
        alignItems: 'center',
        justifyContent: 'center',
    },
    instructionContent: {
        flex: 1,
    },
    distanceText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: EyewayColors.accentBlue,
        marginBottom: 8,
    },
    instructionText: {
        fontSize: 18,
        color: EyewayColors.textPrimary,
        lineHeight: 26,
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressText: {
        fontSize: 14,
        color: EyewayColors.textSecondary,
        marginBottom: 8,
    },
    progressBar: {
        height: 8,
        backgroundColor: EyewayColors.backgroundEnd,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: EyewayColors.accentBlue,
    },
    upcomingContainer: {
        flex: 1,
    },
    upcomingTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: EyewayColors.textPrimary,
        marginBottom: 16,
    },
    stepsList: {
        flex: 1,
    },
    upcomingStep: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: EyewayColors.secondaryButton,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        gap: 16,
    },
    upcomingStepContent: {
        flex: 1,
    },
    upcomingStepText: {
        fontSize: 14,
        color: EyewayColors.textPrimary,
        marginBottom: 4,
    },
    upcomingStepDistance: {
        fontSize: 12,
        color: EyewayColors.textSecondary,
    },
});
