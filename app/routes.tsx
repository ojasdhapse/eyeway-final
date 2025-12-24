import { listSavedRoutes, SavedRoute } from '@/app/services/savedRoutes';
import { EyewayColors } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { useVoiceTurnManager } from '@/hooks/useVoiceTurnManager';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import AppBackground from '@/components/app-background';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoutesScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ voiceInitiated?: string }>();
    const { user } = useAuth();
    const [routes, setRoutes] = useState<SavedRoute[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isListening, setIsListening] = useState(false);
    const { speak } = useVoiceTurnManager();
    const hasReadRoutes = useRef(false);
    const { speakThenListen } = useVoiceTurnManager();

    useEffect(() => {
        let mounted = true;
        const load = async () => {
            try {
                const list = await listSavedRoutes(user?.uid);
                if (mounted) setRoutes(list);
            } catch (error) {
                console.error('Failed to load saved routes', error);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, [user]);

    // Voice-initiated route reading
    useEffect(() => {
        if (
            params.voiceInitiated === 'true' &&
            !isLoading &&
            !hasReadRoutes.current
        ) {
            hasReadRoutes.current = true;

            const readRoutesAloud = async () => {
                // Small delay to let screen render
                await new Promise(r => setTimeout(r, 500));

                if (routes.length === 0) {
                    await speak('You have no saved routes yet. You can save routes after starting navigation.');
                } else {
                    await speak(`You have ${routes.length} saved ${routes.length === 1 ? 'route' : 'routes'}.`);

                    // Read each route one by one with pauses
                    for (let i = 0; i < routes.length; i++) {
                        const route = routes[i];
                        await new Promise(r => setTimeout(r, 400)); // Pause between routes
                        await speak(`Route ${i + 1}: ${route.name}. Address: ${route.address}`);
                    }

                    await new Promise(r => setTimeout(r, 600));
                    await speak('Tap any route to start navigation, or say go back to return.');
                }

                // Listen for 'go back' command
                const response = await speakThenListen('', 4000);
                if (response && response.toLowerCase().includes('back')) {
                    await speak('Going back to home');
                    router.push('/(tabs)');
                }
            };

            readRoutesAloud();
        }
    }, [params.voiceInitiated, isLoading, routes]);

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

    const handleRoutePress = (route: SavedRoute) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Speech.speak(`Starting navigation to ${route.name}`, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });
        router.push({
            pathname: '/navigation',
            params: { destination: route.address, autoStart: 'true' },
        });
    };

    const handleAddRoute = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Speech.speak('Add a new route. Opening navigation.', {
            language: 'en',
            rate: 0.9,
        });
        router.push('/navigation');
    };

    return (
        <AppBackground contentContainerStyle={{ marginTop: 40, marginLeft: 0, marginRight: 'auto' }}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={handleBack} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={28} color={EyewayColors.textPrimary} />
                </Pressable>
                <Text style={styles.title}>Saved Routes</Text>
                <Pressable onPress={handleAddRoute} style={styles.addButton}>
                    <Ionicons name="add" size={28} color={EyewayColors.textPrimary} />
                </Pressable>
            </View>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <View style={styles.emptyContainer}>
                        <ActivityIndicator size="large" color={EyewayColors.accentBlue} />
                        <Text style={styles.emptyText}>Loading saved routes...</Text>
                    </View>
                ) : routes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bookmark-outline" size={64} color={EyewayColors.textSecondary} />
                        <Text style={styles.emptyText}>No saved routes yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button or save a route after starting navigation
                        </Text>
                    </View>
                ) : (
                    <View style={styles.routesList}>
                        {routes.map((route) => (
                            <Pressable
                                key={route.id}
                                onPress={() => handleRoutePress(route)}
                                style={({ pressed }) => [
                                    styles.routeCard,
                                    pressed && styles.routeCardPressed,
                                ]}
                                accessibilityRole="button"
                                accessibilityLabel={`Navigate to ${route.name}`}
                                accessibilityHint={`Address: ${route.address}`}
                            >
                                <View style={styles.routeIcon}>
                                    <Ionicons name="location-outline" size={28} color={EyewayColors.accentBlue} />
                                </View>

                                <View style={styles.routeInfo}>
                                    <Text style={styles.routeName}>{route.name}</Text>
                                    <Text style={styles.routeAddress}>{route.address}</Text>
                                </View>

                                <Ionicons
                                    name="chevron-forward"
                                    size={24}
                                    color={EyewayColors.textSecondary}
                                />
                            </Pressable>
                        ))}
                    </View>
                )}
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
        // padding removed, handled by AppBackground
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: EyewayColors.secondaryButton,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: EyewayColors.primaryButton,
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
    scrollContent: {
        paddingBottom: 20,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 20,
        color: EyewayColors.textPrimary,
        marginTop: 20,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 16,
        color: EyewayColors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
    },
    routesList: {
        gap: 12,
    },
    routeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: EyewayColors.secondaryButton,
        padding: 20,
        borderRadius: 16,
        gap: 16,
        minWidth: 220,
        maxWidth: 340,
        alignSelf: 'center',
    },
    routeCardPressed: {
        backgroundColor: EyewayColors.secondaryButtonHover,
    },
    routeIcon: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: EyewayColors.backgroundEnd,
        alignItems: 'center',
        justifyContent: 'center',
    },
    routeInfo: {
        flex: 1,
        gap: 4,
    },
    routeName: {
        fontSize: 18,
        fontWeight: '600',
        color: EyewayColors.textPrimary,
    },
    routeAddress: {
        fontSize: 14,
        color: EyewayColors.textSecondary,
        lineHeight: 20,
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
