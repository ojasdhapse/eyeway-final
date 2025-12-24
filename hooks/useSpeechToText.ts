import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const ASSEMBLYAI_API_KEY = '26422c96915a455183278905acf57267';

let isRecording = false;

export async function recordAndTranscribe(): Promise<string | null> {
    if (isRecording) {
        console.warn('Microphone busy, skipping record request');
        return null;
    }

    let recording: Audio.Recording | null = null;

    try {
        isRecording = true;

        // Request permissions
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status !== 'granted') {
            console.warn('Audio permission not granted');
            isRecording = false;
            return null;
        }

        await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
            shouldDuckAndroid: true, // Lower other audio during recording
            playThroughEarpieceAndroid: false,
        });

        // Step 1: Record audio for 4 seconds
        recording = new Audio.Recording();
        await recording.prepareToRecordAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        await recording.startAsync();
        await new Promise((r) => setTimeout(r, 4000)); // 4 second recording
        await recording.stopAndUnloadAsync();

        isRecording = false; // Release lock immediately after recording stops

        const uri = recording.getURI();
        if (!uri) {
            console.error('Recording failed: No URI');
            return null;
        }
        console.log('Recording finished, URI:', uri);

        // Step 2: Upload audio directly to AssemblyAI using native uploader
        // This uses standard binary upload to AssemblyAI, bypassing JSON/Base64 wrapping
        console.log('Starting upload...');
        const uploadRes = await FileSystem.uploadAsync('https://api.assemblyai.com/v2/upload', uri, {
            httpMethod: 'POST',
            uploadType: 0 as any,
            headers: {
                authorization: ASSEMBLYAI_API_KEY,
            },
        });

        console.log('Upload status:', uploadRes.status);

        if (uploadRes.status !== 200) {
            console.error('AssemblyAI upload failed', uploadRes.body);
            return null;
        }

        const uploadData = JSON.parse(uploadRes.body);
        const upload_url = uploadData.upload_url;
        console.log('Upload URL obtained:', upload_url);

        // Step 3: Request transcription
        const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST',
            headers: {
                authorization: ASSEMBLYAI_API_KEY,
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                audio_url: upload_url,
                language_code: 'en',
            }),
        });

        if (!transcriptRes.ok) {
            console.error('AssemblyAI transcript request failed', await transcriptRes.text());
            return null;
        }

        const transcriptData = await transcriptRes.json();
        const id = transcriptData.id;

        // Step 4: Poll for completion
        while (true) {
            const statusRes = await fetch(
                `https://api.assemblyai.com/v2/transcript/${id}`,
                {
                    headers: {
                        authorization: ASSEMBLYAI_API_KEY,
                    }
                }
            );
            const data = await statusRes.json();

            if (data.status === 'completed') return data.text;
            if (data.status === 'error') return null;

            await new Promise((r) => setTimeout(r, 1000)); // Check every second
        }
    } catch (err) {
        console.error('AssemblyAI STT error:', err);
        // Cleanup recording if active
        if (recording) {
            try {
                await recording.stopAndUnloadAsync();
            } catch (e) {
                // Already unloaded or not started
            }
        }
        isRecording = false; // Release lock on error
        return null;
    }
}
