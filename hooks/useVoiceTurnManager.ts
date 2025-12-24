import * as Speech from 'expo-speech';
import { Platform } from 'react-native';
import { recordAndTranscribe } from './useSpeechToText';

export interface VoiceTurnManager {
    speak: (text: string, options?: Speech.SpeechOptions) => Promise<void>;
    listen: (duration?: number) => Promise<string | null>;
    speakThenListen: (prompt: string, listenDuration?: number, speakOptions?: Speech.SpeechOptions) => Promise<string | null>;
    isSpeaking: () => boolean;
}

let isSpeakingFlag = false;
const speechQueue: Array<{ text: string; options?: Speech.SpeechOptions; resolve: () => void }> = [];
let isProcessingQueue = false;

/**
 * Process the speech queue to ensure no overlapping speech
 */
async function processSpeechQueue() {
    if (isProcessingQueue || speechQueue.length === 0) return;

    isProcessingQueue = true;

    while (speechQueue.length > 0) {
        const item = speechQueue.shift();
        if (!item) break;

        isSpeakingFlag = true;

        await new Promise<void>((resolve) => {
            Speech.speak(item.text, {
                ...item.options,
                onDone: () => {
                    isSpeakingFlag = false;
                    item.resolve();
                    resolve();
                },
                onStopped: () => {
                    isSpeakingFlag = false;
                    item.resolve();
                    resolve();
                },
                onError: () => {
                    isSpeakingFlag = false;
                    item.resolve();
                    resolve();
                },
            });
        });

        // Add a small pause between queued items
        await new Promise(r => setTimeout(r, 200));
    }

    isProcessingQueue = false;
}

/**
 * Speak text with promise-based completion
 * Queues speech to prevent overlapping
 */
export function speak(text: string, options?: Speech.SpeechOptions): Promise<void> {
    return new Promise((resolve) => {
        const defaultOptions: Speech.SpeechOptions = {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
            ...options,
        };

        speechQueue.push({ text, options: defaultOptions, resolve });
        processSpeechQueue();
    });
}

/**
 * Listen for user voice input
 * Platform-aware: uses browser speech API on web, AssemblyAI on mobile
 */
export async function listen(duration: number = 4000): Promise<string | null> {
    // Wait for any ongoing speech to complete
    while (isSpeakingFlag) {
        await new Promise(r => setTimeout(r, 100));
    }

    // Add a longer delay to ensure speech has fully completed and audio buffer is cleared
    // This prevents the microphone from picking up the tail end of TTS output
    await new Promise(r => setTimeout(r, 1000));

    if (Platform.OS === 'web') {
        // Web: Use browser SpeechRecognition API
        const SpeechRecognition =
            (window as any).SpeechRecognition ||
            (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            console.warn('Speech recognition not supported on this browser');
            return null;
        }

        try {
            const text = await new Promise<string | null>((resolve) => {
                const recognition = new SpeechRecognition();
                recognition.lang = 'en-US';
                recognition.continuous = false;
                recognition.interimResults = false;

                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    resolve(transcript);
                };

                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error:', event.error);
                    resolve(null);
                };

                recognition.onend = () => {
                    // Safety timeout
                    setTimeout(() => resolve(null), 100);
                };

                recognition.start();
            });

            return text;
        } catch (error) {
            console.error('Web speech recognition error:', error);
            return null;
        }
    } else {
        // Mobile: Use AssemblyAI via recordAndTranscribe
        try {
            const text = await recordAndTranscribe();
            return text;
        } catch (error) {
            console.error('Mobile speech recognition error:', error);
            return null;
        }
    }
}

/**
 * Core turn-based interaction: Speak a prompt, then listen for response
 * This ensures proper turn-taking: app speaks first, then listens
 */
export async function speakThenListen(
    prompt: string,
    listenDuration: number = 4000,
    speakOptions?: Speech.SpeechOptions
): Promise<string | null> {
    // Step 1: Speak the prompt
    await speak(prompt, speakOptions);

    // Step 2: Listen for response
    const response = await listen(listenDuration);

    return response;
}

/**
 * Check if the system is currently speaking
 */
export function isSpeaking(): boolean {
    return isSpeakingFlag;
}

/**
 * Stop all speech and clear queue
 */
export function stopSpeaking(): void {
    Speech.stop();
    speechQueue.length = 0;
    isSpeakingFlag = false;
    isProcessingQueue = false;
}

/**
 * Hook to use voice turn manager
 */
export function useVoiceTurnManager(): VoiceTurnManager {
    return {
        speak,
        listen,
        speakThenListen,
        isSpeaking,
    };
}
