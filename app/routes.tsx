import { EyewayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface SavedRoute {
    id: string;
    name: string;
    address: string;
    icon: keyof typeof Ionicons.glyphMap;
}

const SAMPLE_ROUTES: SavedRoute[] = [
    {
        id: '1',
        name: 'Home',
        address: '123 Main Street, City',
        icon: 'home',
    },
    {
        id: '2',
        name: 'Work',
        address: '456 Office Plaza, Downtown',
        icon: 'briefcase',
    },
    {
        id: '3',
        name: 'Grocery Store',
        address: '789 Market Avenue',
        icon: 'cart',
    },
    {
        id: '4',
        name: 'Park',
        address: 'Central Park, North Side',
        icon: 'leaf',
    },
];

export default function RoutesScreen() {
    const router = useRouter();
    const [routes] = useState<SavedRoute[]>(SAMPLE_ROUTES);

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    const handleRoutePress = (route: SavedRoute) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Speech.speak(`Navigate to ${route.name}, ${route.address}`, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });
        // In a real app, this would start navigation
    };

    const handleAddRoute = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Speech.speak('Add new route', {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
        });
        // In a real app, this would open a form to add a new route
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
                {routes.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="bookmark-outline" size={64} color={EyewayColors.textSecondary} />
                        <Text style={styles.emptyText}>No saved routes yet</Text>
                        <Text style={styles.emptySubtext}>
                            Tap the + button to add your first route
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
                                    <Ionicons name={route.icon} size={28} color={EyewayColors.accentBlue} />
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
});
