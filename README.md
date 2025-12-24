# Eyeway 🎯👁️

**Your Voice-Guided Navigation Companion**

Eyeway is an AI-powered, voice-first navigation application designed for accessibility. Built with React Native and powered by intelligent voice commands, Eyeway provides turn-by-turn navigation, obstacle detection, and location awareness - all controlled entirely through voice interaction.

---

## 🌟 Features

### 🎤 Voice-First Interface
- **Continuous Voice Control**: Always-on voice command detection with 20-second cycles
- **Natural Language Processing**: Speak naturally - say "start navigation", "where am I", "saved routes", or "settings"
- **Voice Feedback**: Every action is confirmed with spoken responses
- **Hands-Free Operation**: Complete app navigation without touching the screen

### 🧭 Turn-by-Turn Navigation
- **Powered by Google Maps Platform**: Real-time route calculation using Directions API
- **Real-Time Directions**: Step-by-step voice guidance through your route
- **Distance Tracking**: Live updates on remaining distance and time
- **Smart Maneuver Detection**: Automatic instruction updates based on your location
- **Route Saving**: Save frequently used routes for quick access
- **Multi-Modal Routing**: Walking directions with transit fallback

### 📍 Location Services
- **Current Location**: "Where am I" feature provides detailed location information
- **Natural Language Destinations**: Powered by **Google Geocoding API** - search by name or description
- **Destination Search**: Natural language destination queries (e.g., "nearest coffee shop")
- **Saved Routes**: Quick access to frequently used destinations
- **Location Tracking**: Real-time position updates during navigation

### 🚧 Obstacle Detection
- **AI-Powered Detection**: Uses **Google Cloud Vision API** for intelligent obstacle identification
- **Camera-Based Detection**: Uses device camera to identify obstacles with object localization
- **Real-Time Alerts**: Voice warnings for detected obstacles
- **Configurable Intervals**: Adjustable detection frequency (default: 5 seconds)
- **Visual Feedback**: On-screen indicators with haptic feedback
- **Smart Classification**: Detects walls, people, vehicles, furniture, and general obstacles

### 🔐 Authentication
- **Firebase Integration**: Secure user authentication
- **Session Management**: Persistent login with token-based auth
- **Privacy-First**: Your data is protected and encrypted

---

## 🤖 Google AI Tools Integrated

Eyeway leverages powerful **Google Cloud AI and Maps Platform APIs** to deliver intelligent navigation and obstacle detection:

### 📍 Google Maps Platform - Directions API
- **Navigation Routes**: Real-time route calculation with turn-by-turn directions
- **Geocoding**: Natural language destination resolution (e.g., "nearest coffee shop")
- **Multi-Modal Support**: Walking and transit directions with automatic fallback
- **Distance & Time Estimates**: Accurate ETA calculations
- **Polyline Encoding**: Efficient route visualization
- **API Endpoint**: `https://maps.googleapis.com/maps/api/directions/json`

**Features Used**:
- Walking directions (primary mode)
- Transit directions (fallback mode)
- Location geocoding
- Step-by-step navigation instructions
- Maneuver detection (turn left, turn right, etc.)

### 👁️ Google Cloud Vision API
- **Object Detection**: AI-powered obstacle identification using `OBJECT_LOCALIZATION`
- **Label Detection**: Context-aware scene understanding
- **Real-Time Analysis**: Camera feed processing for obstacle alerts
- **Position Classification**: Determines obstacle location (front, left, right)
- **Confidence Filtering**: Filters low-confidence detections (>50% threshold)
- **API Endpoint**: `https://vision.googleapis.com/v1/images:annotate`

**Detection Capabilities**:
- Walls and corridors
- People and pedestrians
- Vehicles
- Furniture and objects
- General obstacles

**Rate Limiting**: Intelligent request throttling (1 request/second) to prevent API quota exhaustion

### 🔑 API Configuration

Both services use a single **Google Cloud API Key** configured via:
```env
GOOGLE_MAPS_API_KEY=your_google_cloud_api_key_here
```

**Required APIs** (Enable in Google Cloud Console):
1. **Directions API** - For navigation
2. **Geocoding API** - For destination resolution
3. **Cloud Vision API** - For obstacle detection

**Cost Optimization**:
- Efficient API calls with caching
- Rate limiting on Vision API
- Smart routing with mode fallback
- Image validation before Vision API calls

---

## 🏗️ Architecture

### Frontend (React Native + Expo)
```
/app                    # Main application screens
  /(tabs)              # Tab-based navigation screens
    /index.tsx         # Home screen with voice control
  /active-navigation.tsx  # Turn-by-turn navigation screen
  /location.tsx        # Current location screen
  /navigation.tsx      # Destination input screen
  /routes.tsx          # Saved routes screen
  /login.tsx           # Authentication screen
  /config              # Firebase configuration

/components            # Reusable UI components
  /voice-button.tsx    # Voice-enabled buttons
  /obstacle-detector.tsx # Obstacle detection logic
  /status-indicator.tsx # Navigation status display

/hooks                 # Custom React hooks
  /useSpeechToText.ts  # Speech-to-text functionality
  /useVoiceTurnManager.ts # Voice interaction management
  /useObstacleDetection.ts # Obstacle detection logic
  /useHomeVoiceControl.ts # Home screen voice commands
  /voiceCommands.ts    # Command parsing utilities

/services              # Business logic services
  /voice               # Voice input/output services

/contexts              # React context providers
```

### Backend (FastAPI)
```
/navigation-backend
  /app                 # Backend application logic
    /main.py          # FastAPI server
    /routes.py        # Navigation endpoints
    /services.py      # Google Maps integration
  /requirements.txt   # Python dependencies
  /streamlit_app.py   # Testing interface
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Expo CLI** (`npm install -g expo-cli`)
- **Python** (v3.8 or higher) - for backend
- **Android Studio** or **Xcode** (for mobile development)
- **Google Maps API Key** (for navigation features)

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd eyeway-main\ 4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # For local development (Android emulator)
   API_URL=http://10.0.2.2:8001
   
   # For production
   # API_URL=https://navigation-backend-r44z.onrender.com
   ```

4. **Start the development server**
   ```bash
   npm start
   # or
   npx expo start
   ```

5. **Run on your device**
   - **Android**: Press `a` or scan the QR code with Expo Go
   - **iOS**: Press `i` or scan the QR code with Expo Go
   - **Web**: Press `w` (limited functionality)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd navigation-backend
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   Create a `.env` file in `navigation-backend/`:
   ```env
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. **Start the FastAPI server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
   ```

5. **Test with Streamlit (Optional)**
   ```bash
   streamlit run streamlit_app.py
   ```

---

## 📱 Platform-Specific Configuration

### Android

**Permissions** (already configured in `app.json`):
- Camera access for obstacle detection
- Microphone access for voice commands
- Location access for navigation

**Network Configuration**:
- For Android emulator, use `10.0.2.2:8001` as the backend URL
- For physical devices, use your computer's local IP (e.g., `192.168.x.x:8001`)

### iOS

**Permissions** (already configured in `app.json`):
- Camera usage description
- Microphone usage description
- Location when-in-use usage description

**Development**:
- Requires macOS with Xcode installed
- May need to adjust network security settings for local development

---

## 🎯 Usage Guide

### Voice Commands

#### Home Screen
- **"Start navigation"** - Begin a new navigation session
- **"Where am I"** - Get current location information
- **"Saved routes"** - Access your saved routes
- **"Settings"** - Open settings menu
- **"Go back"** - Return to home screen (from any screen)

#### Navigation Screen
- **"Where would you like to go?"** - System prompts for destination
- Speak your destination naturally (e.g., "nearest coffee shop", "123 Main Street")

#### Active Navigation
- Automatic voice guidance for each turn
- Real-time distance and time updates
- Voice alerts for obstacles when enabled

### Button Controls

While the app is voice-first, all features are also accessible via on-screen buttons:

- **Start Navigation** - Large primary button on home screen
- **Where Am I** - Secondary button
- **Saved Routes** - Secondary button
- **Settings** - Bottom-right circular button
- **Logout** - Secondary button at bottom

---

## 🛠️ Technology Stack

### Frontend
- **React Native** (0.81.5) - Cross-platform mobile framework
- **Expo** (~54.0) - Development platform and toolkit
- **TypeScript** (~5.9) - Type-safe JavaScript
- **Expo Router** (~6.0) - File-based routing
- **Firebase** (12.7.0) - Authentication and backend services

### Key Libraries
- **expo-speech** - Text-to-speech output
- **expo-av** - Audio recording for voice input
- **expo-location** - GPS and location services
- **expo-camera** - Obstacle detection
- **expo-haptics** - Tactile feedback
- **react-native-reanimated** - Smooth animations

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Google Maps Platform**:
  - **Directions API** - Route calculation and turn-by-turn navigation
  - **Geocoding API** - Natural language destination resolution
- **Google Cloud Vision API** - AI-powered obstacle detection with object localization
- **Streamlit** - Testing interface
- **Pydantic** - Data validation
- **Pillow** - Image processing for Vision API

---

## 🔧 Configuration Files

### `app.json`
Main Expo configuration file containing:
- App metadata (name, version, slug)
- Platform-specific settings (iOS, Android, Web)
- Permissions declarations
- Plugin configurations
- Build settings

### `package.json`
NPM package configuration with dependencies and scripts:
- `npm start` - Start Expo dev server
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run web` - Run on web

### `.env.example`
Template for environment variables:
- `API_URL` - Backend API endpoint

---

## 🐛 Troubleshooting

### Voice Commands Not Working
- **Check microphone permissions**: Settings → App Permissions → Microphone
- **Rebuild the app** after permission changes
- **Test on physical device** - Expo Go may have limited voice support
- **Check console logs** for voice recognition errors

### Navigation Not Working
- **Verify backend is running** on the correct port (8001)
- **Check API_URL** configuration for your platform
- **For Android emulator**: Use `10.0.2.2:8001`
- **For iOS simulator**: Use `localhost:8001`
- **For physical devices**: Use your computer's local IP
- **Verify Google Maps API key** is valid and has required APIs enabled

### Obstacle Detection Issues
- **Grant camera permissions** in app settings
- **Ensure good lighting** for camera detection
- **Check camera initialization** in console logs
- **Test on physical device** (camera not available on emulators)

### Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Expo cache
npx expo start -c

# Rebuild native modules
cd android && ./gradlew clean && cd ..
```

---

## 🚢 Deployment

### Frontend (Expo)

**Development Build**:
```bash
eas build --platform android --profile development
eas build --platform ios --profile development
```

**Production Build**:
```bash
eas build --platform android --profile production
eas build --platform ios --profile production
```

**Configuration**: See `eas.json` for build profiles

### Backend

**Render Deployment**:
1. Connect your GitHub repository
2. Create a new Web Service
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variable: `GOOGLE_MAPS_API_KEY`

**Current production backend**: `https://navigation-backend-r44z.onrender.com`

---

## 📊 Project Statistics

- **Languages**: TypeScript, Python
- **Total Components**: 13 React components
- **Custom Hooks**: 9 hooks for business logic
- **Screens**: 8 main application screens
- **Voice Commands**: 5+ recognized commands
- **Supported Platforms**: Android, iOS, Web (limited)

---

## 🔐 Environment Variables

### Frontend
- `API_URL` - Backend API endpoint (optional, defaults to production)

### Backend

**Required**:
- `GOOGLE_MAPS_API_KEY` - **CRITICAL** - Single API key for both services:
  - Google Maps Platform (Directions API, Geocoding API)
  - Google Cloud Vision API

**Optional**:
- `PORT` - Server port (default: 8001)

### Google Cloud Setup

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing

2. **Enable Required APIs**
   ```
   - Directions API
   - Geocoding API  
   - Cloud Vision API
   ```

3. **Create API Key**
   - Navigate to **APIs & Services** → **Credentials**
   - Click **Create Credentials** → **API Key**
   - Copy the generated key

4. **Secure Your Key** (Recommended)
   - Click **Restrict Key**
   - Set **API restrictions**: Select only the 3 APIs listed above
   - Set **Application restrictions**: None (or set specific IP/domain)

5. **Add to Backend**
   ```bash
   cd navigation-backend
   echo "GOOGLE_MAPS_API_KEY=your_api_key_here" > .env
   ```

**Cost Management**:
- Set billing alerts in Google Cloud
- Monitor API usage in Cloud Console
- Default free tier includes limited requests/month

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🙏 Acknowledgments

- **Google Cloud AI** - Vision API for intelligent obstacle detection
- **Google Maps Platform** - Directions and Geocoding APIs for navigation
- **Expo Team** - Amazing development platform
- **React Native Community** - Powerful mobile framework
- **Firebase** - Authentication infrastructure

---

## 📞 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Check existing documentation
- Review troubleshooting section above

---

## 🎨 Design Philosophy

Eyeway is built with **accessibility-first** principles:
- Every feature is voice-controlled
- Visual elements support, not replace, voice interaction
- Haptic feedback for tactile confirmation
- Clear, concise spoken instructions
- Continuous voice loop for easy activation

---

## 🔮 Future Enhancements

- **Offline Maps** - Navigation without internet
- **Multi-language Support** - Global accessibility
- **Custom Voice Profiles** - Personalized voice settings
- **Advanced Obstacle Detection** - AI-powered object recognition
- **Route Optimization** - Multiple route options
- **Community Features** - Share routes with friends
- **Wearable Integration** - Apple Watch, Android Wear support

---

**Built with ❤️ by 3musketeers**
