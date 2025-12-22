import { EyewayColors } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

export default function LocationScreen() {
    const router = useRouter();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [address, setAddress] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

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
        <LinearGradient
            colors={[EyewayColors.backgroundStart, EyewayColors.backgroundEnd]}
            style={styles.container}
        >
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
    },
    repeatText: {
        color: EyewayColors.textPrimary,
        fontSize: 18,
        fontWeight: '600',
    },
});
