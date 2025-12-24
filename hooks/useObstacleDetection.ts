import { VISION_ENDPOINT } from '@/constants/config';
import { useCameraPermissions } from 'expo-camera';
import * as Speech from 'expo-speech';
import { useCallback, useEffect, useRef, useState } from 'react';

// Configuration
const OBSTACLE_CHECK_INTERVAL = 5000; // Check every 5 seconds
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
    const [error, setError] = useState<string | null>(null);
    const [isCameraReady, setIsCameraReady] = useState(false);

    // Use the new camera permissions hook
    const [permission, requestPermission] = useCameraPermissions();

    const cameraRef = useRef<any>(null);
    const lastAnnouncementRef = useRef<string>('');
    const lastAnnouncementTimeRef = useRef<number>(0);
    const detectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Request camera permission
    useEffect(() => {
        (async () => {
            try {
                if (!permission) {
                    // Permission not yet determined
                    return;
                }

                if (!permission.granted) {
                    console.log('📷 Requesting camera permission for obstacle detection...');
                    const result = await requestPermission();

                    if (!result.granted) {
                        console.warn('📷 Camera permission denied - obstacle detection disabled');
                        setError('Camera permission denied');
                    }
                }
            } catch (err) {
                console.error('📷 Camera permission error:', err);
                setError('Failed to request camera permission');
            }
        })();
    }, [permission]);

    // Camera ready callback
    const handleCameraReady = useCallback(() => {
        console.log('📷 [ObstacleDetection] Camera is ready');
        setIsCameraReady(true);
    }, []);

    // Capture and analyze frame
    const captureAndAnalyze = useCallback(async () => {
        // Skip if not enabled, no permission, already detecting, camera not ready, or camera not initialized
        if (!enabled || !permission?.granted || isDetecting || !cameraRef.current || !isCameraReady) {
            if (!isCameraReady && enabled && permission?.granted) {
                console.log('📷 [ObstacleDetection] Waiting for camera to be ready...');
            }
            return;
        }

        try {
            setIsDetecting(true);
            setError(null);

            console.log('📷 [ObstacleDetection] Capturing frame...');

            // Capture frame from camera using CameraView API
            if (!cameraRef.current || !cameraRef.current.takePictureAsync) {
                console.warn('📷 [ObstacleDetection] Camera not ready or takePictureAsync not available');
                console.warn('📷 [ObstacleDetection] Camera state - Ready:', isCameraReady, 'Ref exists:', !!cameraRef.current);
                return;
            }

            const photo = await cameraRef.current.takePictureAsync({
                quality: IMAGE_QUALITY,
                base64: false,
            });

            console.log('📷 [ObstacleDetection] Photo captured:', photo.uri);

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
                console.log('🔍 [ObstacleDetection] Obstacles found:', data.obstacles.length);
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
            console.error('🔍 Camera state - Ready:', isCameraReady, 'Ref:', !!cameraRef.current, 'Permission:', permission?.granted);
            setError(err instanceof Error ? err.message : 'Detection failed');

            // Clear obstacles on error
            setObstacles([]);
        } finally {
            setIsDetecting(false);
        }
    }, [enabled, permission, isDetecting, isCameraReady, onObstacleDetected, announceObstacles]);

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
        if (!enabled || !permission?.granted) {
            // Clear interval if disabled or no permission
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
            return;
        }

        console.log('📷 [ObstacleDetection] Starting periodic detection every', OBSTACLE_CHECK_INTERVAL / 1000, 'seconds');

        // Start periodic detection
        detectionIntervalRef.current = setInterval(() => {
            captureAndAnalyze();
        }, OBSTACLE_CHECK_INTERVAL);

        // Cleanup on unmount
        return () => {
            console.log('📷 [ObstacleDetection] Stopping periodic detection');
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
        };
    }, [enabled, permission, captureAndAnalyze]);

    return {
        obstacles,
        isDetecting,
        hasPermission: permission?.granted ?? false,
        isCameraReady,
        error,
        cameraRef,
        onCameraReady: handleCameraReady,
        captureAndAnalyze, // Manual trigger if needed
    };
}
