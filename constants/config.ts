import { Platform } from 'react-native';

// API Configuration
const getApiUrl = () => {
    let url = '';

    if (Platform.OS === 'android') {
        // IMPORTANT: Choose the right URL for your setup:
        // Option 1: For physical Android device (RECOMMENDED if emulator doesn't work)
        url = 'http://192.168.1.8:8001';

        // Option 2: For Android Emulator (uncomment if using emulator)
        // url = 'http://10.0.2.2:8001';

        console.log('🔧 Using Android URL:', url);
    } else if (Platform.OS === 'ios') {
        // For iOS Simulator, localhost works fine
        url = 'http://localhost:8001';
        console.log('🔧 Using iOS URL:', url);
    } else {
        // For web
        url = 'http://localhost:8001';
        console.log('🔧 Using Web URL:', url);
    }

    return url;
};

export const API_BASE_URL = getApiUrl();
export const NAVIGATION_ENDPOINT = `${API_BASE_URL}/navigate`;

console.log('📡 API Configuration loaded:', {
    platform: Platform.OS,
    baseUrl: API_BASE_URL,
    navigationEndpoint: NAVIGATION_ENDPOINT,
});
