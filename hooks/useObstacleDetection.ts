import { VISION_ENDPOINT } from '@/constants/config';
import { Camera } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

// Configuration
const OBSTACLE_CHECK_INTERVAL = 1000; // Check every 1 second
const IMAGE_QUALITY = 0.4; // 40% quality for faster upload
const CONFIDENCE_THRESHOLD = 0.7; // Only announce obstacles with 70%+ confidence
const ANNOUNCEMENT_COOLDOWN = 5000; // Don't repeat same announcement within 5 seconds

export interface Obstacle {
    object_type: string;
    confidence: number;
    position: string;
    description: string;
}

interface ObstacleDetectionResponse {
    success: boolean;
    obstacles: Obstacle[];
    message: string;
}

interface UseObstacleDetectionOptions {
    enabled?: boolean;
    onObstacleDetected?: (obstacles: Obstacle[]) => void;
    announceObstacles?: boolean;
}

export function useObstacleDetection(options: UseObstacleDetectionOptions = {}) {
    const {
        enabled = true,
        onObstacleDetected,
        announceObstacles = true,
    } = options;

    const [obstacles, setObstacles] = useState<Obstacle[]>([]);
    const [isDetecting, setIsDetecting] = useState(false);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [error, setError] = useState<string | null>(null);

    const cameraRef = useRef<any>(null);
    const lastAnnouncementRef = useRef<string>('');
    const lastAnnouncementTimeRef = useRef<number>(0);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Request camera permission
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Camera.requestCameraPermissionsAsync();
                setHasPermission(status === 'granted');

                if (status !== 'granted') {
                    console.warn('📷 Camera permission denied - obstacle detection disabled');
                    setError('Camera permission denied');
                }
            } catch (err) {
                console.error('📷 Camera permission error:', err);
                setError('Failed to request camera permission');
                setHasPermission(false);
            }
        })();
    }, []);

    // Capture and analyze frame
    const captureAndAnalyze = useCallback(async () => {
        // Skip if not enabled, no permission, already detecting, or camera not ready
        if (!enabled || !hasPermission || isDetecting || !cameraRef.current) {
            return;
        }

        try {
            setIsDetecting(true);
            setError(null);

            // Capture frame from camera
            if (!cameraRef.current) {
                return;
            }

            const photo = await cameraRef.current.takePictureAsync({
                quality: IMAGE_QUALITY,
                base64: false,
                mute: true, // Disable shutter sound
            });

            // Send to backend for analysis
            const formData = new FormData();
            formData.append('image', {
                uri: photo.uri,
                type: 'image/jpeg',
                name: 'frame.jpg',
            } as any);

            const response = await fetch(VISION_ENDPOINT, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data: ObstacleDetectionResponse = await response.json();

            if (data.success && data.obstacles.length > 0) {
                setObstacles(data.obstacles);

                // Callback for custom handling
                if (onObstacleDetected) {
                    onObstacleDetected(data.obstacles);
                }

                // Announce critical obstacles
                if (announceObstacles) {
                    announceObstaclesIfNeeded(data.obstacles);
                }
            } else {
                // Clear obstacles if none detected
                setObstacles([]);
            }
        } catch (err) {
            // Fail silently - don't disrupt navigation
            console.error('🔍 Obstacle detection error:', err);
            setError(err instanceof Error ? err.message : 'Detection failed');

            // Clear obstacles on error
            setObstacles([]);
        } finally {
            setIsDetecting(false);
        }
    }, [enabled, hasPermission, isDetecting, onObstacleDetected, announceObstacles]);

    // Announce obstacles with cooldown
    const announceObstaclesIfNeeded = useCallback((obstacles: Obstacle[]) => {
        // Filter high-confidence obstacles in front
        const criticalObstacles = obstacles.filter(
            (obs) => obs.confidence >= CONFIDENCE_THRESHOLD && obs.position === 'FRONT'
        );

        if (criticalObstacles.length === 0) return;

        // Create announcement
        const announcement = criticalObstacles
            .map((obs) => obs.description)
            .join('. ');

        const now = Date.now();

        // Avoid repeating same announcement within cooldown period
        if (
            announcement === lastAnnouncementRef.current &&
            now - lastAnnouncementTimeRef.current < ANNOUNCEMENT_COOLDOWN
        ) {
            return;
        }

        lastAnnouncementRef.current = announcement;
        lastAnnouncementTimeRef.current = now;

        // Announce via speech with higher pitch for alerts
        Speech.speak(announcement, {
            language: 'en',
            pitch: 1.2, // Slightly higher pitch for alerts
            rate: 0.95,
        });
    }, []);

    // Start/stop periodic detection
    useEffect(() => {
        if (!enabled || !hasPermission) {
            // Clear interval if disabled or no permission
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
            return;
        }

        // Start periodic detection
        detectionIntervalRef.current = setInterval(() => {
            captureAndAnalyze();
        }, OBSTACLE_CHECK_INTERVAL);

        // Cleanup on unmount
        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
        };
    }, [enabled, hasPermission, captureAndAnalyze]);

    return {
        obstacles,
        isDetecting,
        hasPermission,
        error,
        cameraRef,
        captureAndAnalyze, // Manual trigger if needed
    };
}
