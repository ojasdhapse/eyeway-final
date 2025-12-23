import { usePathname } from 'expo-router';
import * as Speech from 'expo-speech';
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { recordAndTranscribe } from './useSpeechToText';
import { parseVoiceCommand, VoiceAction } from './voiceCommands';


export function useHomeVoiceControl(
    onAction: (action: VoiceAction) => void,
    setStatus?: (status: 'ready' | 'navigating' | 'error') => void
) {
    const activeRef = useRef(true);
    const pathname = usePathname();

    useEffect(() => {
        let isMounted = true;
        activeRef.current = true;

        const loop = async () => {
            // Don't start global voice control on navigation input screen
            if (pathname === '/navigation') return;

            // Initial greeting
            Speech.speak('Voice control started. You can speak commands.', {
                language: 'en',
                rate: 0.9,
            });
            setStatus?.('ready');
            await new Promise((r) => setTimeout(r, 1500));

            // Continuous listening loop
            while (activeRef.current && isMounted) {
                // Double check inside loop in case it changes (though useEffect should handle restart)
                if (pathname === '/navigation') break;

                let text: string | null = null;
                setStatus?.('ready');

                // Get speech input (platform-specific)
                if (Platform.OS === 'web') {
                    const SpeechRecognition =
                        (window as any).SpeechRecognition ||
                        (window as any).webkitSpeechRecognition;

                    if (!SpeechRecognition) {
                        // Wait a bit to avoid hot loop if not supported
                        await new Promise((r) => setTimeout(r, 2000));
                        continue;
                    }

                    try {
                        text = await new Promise((resolve) => {
                            const recog = new SpeechRecognition();
                            recog.lang = 'en-US';
                            recog.onresult = (e: any) =>
                                resolve(e.results[0][0].transcript);
                            recog.onerror = () => resolve(null);
                            recog.start();
                        });
                    } catch (e) {
                        text = null;
                    }
                } else {
                    // Mobile
                    text = await recordAndTranscribe();
                }

                // Skip if no speech detected
                if (!text) {
                    await new Promise((r) => setTimeout(r, 100));
                    continue;
                }

                console.log('Recognized text:', text);

                // Parse command
                const action = parseVoiceCommand(text);

                // Execute or reject command
                if (action) {
                    setStatus?.('navigating');
                    Speech.speak(`Opening ${action.replace(/_/g, ' ')}`, {
                        language: 'en',
                        rate: 0.9,
                    });
                    onAction(action);
                } else {
                    setStatus?.('error');
                    Speech.speak(`Command not recognized. I heard ${text}`, {
                        language: 'en',
                        rate: 0.9,
                    });
                }

                // Pause briefly before next listen
                await new Promise((r) => setTimeout(r, 200));
            }
        };

        loop();

        return () => {
            isMounted = false;
            activeRef.current = false;
            Speech.stop();
        };
    }, [pathname]); // Restart loop when pathname changes
}
