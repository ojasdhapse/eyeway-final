# EyeWay Voice Command System Documentation

## Overview

EyeWay is a voice-first navigation app designed for accessibility. The app uses a comprehensive voice command system that allows users to navigate the entire app through voice interactions. The system combines **Speech Recognition** (Speech-to-Text) for input and **Text-to-Speech** (TTS) for output, creating a fully voice-guided experience.

---

## System Architecture

### Core Components

1. **Voice Recognition Services**
   - Web: Browser's native SpeechRecognition API
   - Mobile: AssemblyAI API (cloud-based transcription service)

2. **Text-to-Speech**
   - `expo-speech`: Cross-platform TTS library for voice feedback

3. **Voice Command Parser**
   - Custom intent-matching system for natural language commands

4. **Voice Control Hooks**
   - React hooks that manage continuous listening and command processing

---

## Technology Stack

### Dependencies

```json
{
  "@react-native-voice/voice": "^3.2.4",     // Voice recognition (currently not actively used)
  "expo-speech": "~14.0.8",                   // Text-to-Speech output
  "expo-av": "~16.0.8",                       // Audio recording
  "expo-haptics": "~15.0.8",                  // Tactile feedback
  "expo-file-system": "~19.0.21"              // File operations for audio
}
```

### External Services

- **AssemblyAI API**: Cloud-based speech-to-text service
  - API Key: `26422c96915a455183278905acf57267` (hardcoded in `useSpeechToText.ts`)
  - Used exclusively for mobile platforms (iOS/Android)

---

## Voice Command Flow

### 1. **Global Voice Control Activation**

Location: [`app/_layout.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/app/_layout.tsx)

The app activates voice control at the root level using the `useHomeVoiceControl` hook:

```typescript
// Global voice handler in app layout
useHomeVoiceControl((action: VoiceAction) => {
  switch (action) {
    case 'START_NAVIGATION':
      router.push('/navigation');
      break;
    case 'WHERE_AM_I':
      router.push('/location');
      break;
    case 'SAVED_ROUTES':
      router.push('/routes');
      break;
    case 'SETTINGS':
      router.push('/modal');
      break;
    case 'GO_BACK':
      router.back();
      break;
  }
}, () => {});
```

**Key Features:**
- Initialized once at app startup
- Continuously listens for voice commands
- Routes users to different screens based on recognized commands
- Provides spoken confirmation for each action

---

### 2. **Voice Command Parsing**

Location: [`hooks/voiceCommands.ts`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/hooks/voiceCommands.ts)

#### Supported Voice Actions

```typescript
type VoiceAction =
  | 'START_NAVIGATION'
  | 'WHERE_AM_I'
  | 'SAVED_ROUTES'
  | 'SETTINGS'
  | 'GO_BACK'
  | null;
```

#### Command Parsing Logic

The system uses **keyword-based matching** with simple substring detection:

```typescript
function parseVoiceCommand(text: string): VoiceAction {
  const t = text.toLowerCase();

  if (t.includes('start')) return 'START_NAVIGATION';
  if (t.includes('where')) return 'WHERE_AM_I';
  if (t.includes('saved')) return 'SAVED_ROUTES';
  if (t.includes('setting')) return 'SETTINGS';
  if (t.includes('back')) return 'GO_BACK';

  return null;
}
```

**Example Voice Commands:**
- "Start navigation" → Opens navigation screen
- "Where am I?" → Shows current location
- "Saved routes" → Displays saved destinations
- "Settings" → Opens settings modal
- "Go back" → Returns to previous screen

---

### 3. **Speech-to-Text Processing**

#### Platform-Specific Implementations

##### **Web Platform**

Location: [`hooks/useHomeVoiceControl.ts`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/hooks/useHomeVoiceControl.ts) (Lines 28-45)

Uses browser's native **Web Speech API**:

```typescript
if (Platform.OS === 'web') {
  const SpeechRecognition =
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    await new Promise((r) => setTimeout(r, 1000));
    continue;
  }

  text = await new Promise((resolve) => {
    const recog = new SpeechRecognition();
    recog.lang = 'en-US';
    recog.onresult = (e: any) =>
      resolve(e.results[0][0].transcript);
    recog.onerror = () => resolve(null);
    recog.start();
  });
}
```

**Process:**
1. Checks for browser SpeechRecognition API support
2. Creates recognition instance with English (US) language
3. Starts listening for speech
4. Returns transcript when speech is detected
5. Returns null on error

---

##### **Mobile Platform (iOS/Android)**

Location: [`hooks/useSpeechToText.ts`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/hooks/useSpeechToText.ts)

Uses **AssemblyAI cloud service** with a 3-step process:

```typescript
async function recordAndTranscribe(): Promise<string | null> {
  // Step 1: Record audio for 4 seconds
  const recording = new Audio.Recording();
  await recording.prepareToRecordAsync(
    Audio.RecordingOptionsPresets.HIGH_QUALITY
  );
  await recording.startAsync();
  await new Promise((r) => setTimeout(r, 4000)); // 4 second recording
  await recording.stopAndUnloadAsync();
  
  // Step 2: Upload audio to AssemblyAI
  const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
    method: 'POST',
    headers: {
      authorization: ASSEMBLYAI_API_KEY,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ audio_data: audioBase64 }),
  });
  
  // Step 3: Request transcription and poll for results
  const transcriptRes = await fetch('https://api.assemblyai.com/v2/transcript', {
    method: 'POST',
    body: JSON.stringify({
      audio_url: upload_url,
      language_code: 'en',
    }),
  });
  
  // Step 4: Poll for completion
  while (true) {
    const statusRes = await fetch(
      `https://api.assemblyai.com/v2/transcript/${id}`
    );
    const data = await statusRes.json();
    
    if (data.status === 'completed') return data.text;
    if (data.status === 'error') return null;
    
    await new Promise((r) => setTimeout(r, 1000)); // Check every second
  }
}
```

**Process:**
1. **Request microphone permissions** via `expo-av`
2. **Configure audio mode** for recording
3. **Record audio** for exactly 4 seconds
4. **Convert to Base64** and upload to AssemblyAI
5. **Submit transcription request** with English language code
6. **Poll every second** until transcription completes
7. **Return transcript** text or null on error

**Configuration:**
- Recording Duration: 4 seconds (hardcoded)
- Audio Quality: HIGH_QUALITY preset
- Language: English ('en')
- Polling Interval: 1 second

---

### 4. **Continuous Voice Listening Loop**

Location: [`hooks/useHomeVoiceControl.ts`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/hooks/useHomeVoiceControl.ts) (Lines 19-72)

```typescript
const loop = async () => {
  // Initial greeting
  Speech.speak('Voice control started. You can speak commands.');
  await new Promise((r) => setTimeout(r, 1500));

  // Continuous listening loop
  while (activeRef.current) {
    let text: string | null = null;

    // Get speech input (platform-specific)
    if (Platform.OS === 'web') {
      text = await /* Web speech recognition */;
    } else {
      text = await recordAndTranscribe(); // Mobile
    }

    // Skip if no speech detected
    if (!text) {
      await new Promise((r) => setTimeout(r, 800));
      continue;
    }

    // Parse command
    const action = parseVoiceCommand(text);

    // Execute or reject command
    if (action) {
      setStatus?.('navigating');
      Speech.speak(`Opening ${action.replace(/_/g, ' ')}`);
      onAction(action);
    } else {
      setStatus?.('error');
      Speech.speak('Command not recognized');
    }

    // Pause before next listen
    await new Promise((r) => setTimeout(r, 1200));
  }
};
```

**Flow:**
1. **Initialization**: Speaks welcome message
2. **Listen**: Waits for voice input (web or mobile)
3. **Parse**: Converts speech to command action
4. **Execute**: Triggers navigation or speaks error
5. **Feedback**: Provides spoken confirmation
6. **Repeat**: Pauses 1.2s then loops back

**Timing:**
- Initial delay: 1.5 seconds
- No-input retry: 800ms
- Post-command pause: 1.2 seconds

---

### 5. **Text-to-Speech Feedback**

Location: Used throughout the app via `expo-speech`

All voice feedback uses **consistent speech parameters**:

```typescript
Speech.speak(message, {
  language: 'en',
  pitch: 1.0,
  rate: 0.9,
});
```

**Parameters:**
- **Language**: English (`'en'`)
- **Pitch**: Normal (1.0)
- **Rate**: Slightly slower than normal (0.9 for clarity)

#### TTS Usage Scenarios

1. **Button Presses** ([`components/voice-button.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/components/voice-button.tsx))
   ```typescript
   const handlePress = () => {
     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
     Speech.speak(title, { language: 'en', pitch: 1.0, rate: 0.9 });
     onPress();
   };
   ```
   - Speaks button label when pressed
   - Provides haptic feedback simultaneously

2. **Navigation Actions** ([`app/navigation.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/app/navigation.tsx))
   ```typescript
   Speech.speak(`Starting navigation to ${destination}`, {
     language: 'en', pitch: 1.0, rate: 0.9
   });
   ```

3. **Location Services** ([`app/location.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/app/location.tsx))
   ```typescript
   Speech.speak(`You are at ${formattedAddress}`, { rate: 0.9 });
   ```

4. **Saved Routes** ([`app/routes.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/app/routes.tsx))
   ```typescript
   Speech.speak(`Navigate to ${route.name}, ${route.address}`, {
     language: 'en', pitch: 1.0, rate: 0.9
   });
   ```

5. **Error Messages**
   ```typescript
   Speech.speak('Command not recognized');
   Speech.speak('Permission to access location was denied');
   Speech.speak('Failed to get your current location');
   ```

---

## Voice Button Component

Location: [`components/voice-button.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/components/voice-button.tsx)

A reusable button component with built-in voice and haptic feedback:

```typescript
interface VoiceButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  accessibilityLabel?: string;
}
```

**Features:**
- ✅ Automatic TTS when pressed (speaks button title)
- ✅ Haptic feedback (medium impact)
- ✅ Accessible (proper ARIA labels)
- ✅ Visual feedback (pressed state)
- ✅ Two variants (primary/secondary styling)

**Usage Example:**
```typescript
<VoiceButton
  title="Start Navigation"
  onPress={handleStartNavigation}
  variant="primary"
  style={styles.button}
/>
```

---

## Status Indicator

Location: [`components/status-indicator.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/components/status-indicator.tsx)

Visual feedback for voice command processing:

```typescript
type Status = 'ready' | 'navigating' | 'error';
```

**Status Colors:**
- `ready`: Green (#4CAF50) - System listening
- `navigating`: Blue (#2196F3) - Command executing
- `error`: Red (#F44336) - Command failed

**Display:**
- Colored dot indicator
- Text label
- Accessibility-friendly

---

## Voice Command Implementation Details

### Current Implementation Status

#### ✅ **Active Features**

1. **Global Voice Control** (`app/_layout.tsx`)
   - Continuously listens for commands
   - Routes to different screens
   - Provides spoken feedback

2. **Voice Buttons** (across all screens)
   - Speak their labels when pressed
   - Provide haptic feedback
   - Fully accessible

3. **Location Services** (`app/location.tsx`)
   - Speaks current address
   - Announces errors
   - "Repeat Location" button for re-announcement

4. **Navigation Screen** (`app/navigation.tsx`)
   - Voice input button (placeholder)
   - Speaks confirmation when starting navigation
   - Error feedback for empty destination

5. **Saved Routes** (`app/routes.tsx`)
   - Speaks route details when selected
   - Voice feedback for adding routes

#### ⚠️ **Partially Implemented / Commented Out**

**Home Screen Voice Control** ([`app/(tabs)/index.tsx`](file:///Users/ojasdhapse/Documents/GitHub/EyeWay_voice/app/(tabs)/index.tsx))

Lines 10-59 are **commented out**:

```typescript
// import { useHomeVoiceControl } from '../../hooks/useHomeVoiceControl';
// import { VoiceAction } from '../../hooks/voiceCommands';

// const handleVoiceAction = (action: VoiceAction) => { ... }
// useHomeVoiceControl(handleVoiceAction, setStatus);
```

**Reason**: Voice control is handled globally in `_layout.tsx` instead of per-screen basis.

---

## How Voice Commands Work: Step-by-Step

### Scenario: User Says "Start Navigation"

1. **App Initialization**
   - `_layout.tsx` mounts
   - `useHomeVoiceControl` hook activates
   - System speaks: *"Voice control started. You can speak commands."*
   - Continuous listening loop begins

2. **Voice Input**
   - **Web**: Browser captures speech via Web Speech API
   - **Mobile**: 
     - Records 4 seconds of audio
     - Uploads to AssemblyAI
     - Polls for transcription
     - Receives text: "start navigation"

3. **Command Parsing**
   - `parseVoiceCommand("start navigation")`
   - Checks if text contains "start"
   - Returns: `'START_NAVIGATION'`

4. **Command Execution**
   - `onAction('START_NAVIGATION')` callback triggered
   - Router executes: `router.push('/navigation')`
   - Status updates to: `'navigating'`

5. **Voice Feedback**
   - System speaks: *"Opening START NAVIGATION"*

6. **Navigation**
   - Navigation screen opens
   - User can enter destination
   - Voice input button available

7. **Loop Continues**
   - System pauses 1.2 seconds
   - Starts listening again for next command

---

### Scenario: User Taps "Where Am I" Button

1. **Button Press**
   - User taps `VoiceButton` component
   - Haptic feedback triggers (medium impact)

2. **Voice Feedback**
   - `Speech.speak("Where Am I")`
   - System announces button label

3. **Button Action**
   - `onPress={handleWhereAmI}` executes
   - `router.push('/location')` navigates to location screen

4. **Location Screen**
   - Requests location permissions
   - Gets GPS coordinates
   - Reverse geocodes to address
   - Speaks: *"You are at 123 Main Street, City, State"*

---

## Technical Challenges & Solutions

### Challenge 1: Platform Differences

**Problem**: Web and mobile require different speech recognition APIs

**Solution**: Platform-specific implementation in `useHomeVoiceControl`:
```typescript
if (Platform.OS === 'web') {
  // Use browser's SpeechRecognition API
} else {
  // Use AssemblyAI for mobile
}
```

---

### Challenge 2: Continuous Listening

**Problem**: Need to listen continuously without blocking UI

**Solution**: Asynchronous loop with delays:
```typescript
while (activeRef.current) {
  text = await recordAndTranscribe();
  // Process...
  await new Promise((r) => setTimeout(r, 1200)); // Pause before next
}
```

---

### Challenge 3: Command Ambiguity

**Problem**: Simple keyword matching can have false positives

**Current Limitation**: 
- "I want to start" → triggers `START_NAVIGATION`
- "Where is the settings?" → triggers `WHERE_AM_I` (matches "where")

**Potential Solution** (not implemented):
- Use more sophisticated NLP
- Implement command confidence scoring
- Support multi-word phrase matching

---

### Challenge 4: Mobile Recording Latency

**Problem**: AssemblyAI requires network requests and polling

**Current Behavior**:
- 4 seconds recording
- ~1-3 seconds upload/processing
- Total: 5-7 seconds per command

**Mitigation**:
- High-quality recording preset
- Efficient polling (1s intervals)
- No current optimization implemented

---

## Permission Requirements

### Audio Recording (Mobile)

```typescript
const { granted } = await Audio.requestPermissionsAsync();
```

**Required for:**
- Recording voice commands on iOS/Android
- AssemblyAI transcription

**Platforms:**
- iOS: `NSMicrophoneUsageDescription` in Info.plist
- Android: `RECORD_AUDIO` permission in AndroidManifest.xml

### Location Services

```typescript
const { status } = await Location.requestForegroundPermissionsAsync();
```

**Required for:**
- "Where Am I" feature
- Getting current GPS coordinates
- Reverse geocoding address

---

## Error Handling

### Speech Recognition Errors

1. **No API Support (Web)**
   ```typescript
   if (!SpeechRecognition) {
     await new Promise((r) => setTimeout(r, 1000));
     continue; // Skip this iteration
   }
   ```

2. **Recording Failure (Mobile)**
   ```typescript
   catch (err) {
     console.error('AssemblyAI STT error:', err);
     return null;
   }
   ```

3. **Transcription Error**
   ```typescript
   if (data.status === 'error') return null;
   ```

4. **Unrecognized Command**
   ```typescript
   if (action) {
     // Execute command
   } else {
     setStatus?.('error');
     Speech.speak('Command not recognized');
   }
   ```

---

## Future Enhancements

### Potential Improvements

1. **Wake Word Detection**
   - Listen for "Hey Eyeway" before processing commands
   - Reduce false positives

2. **Natural Language Processing**
   - Use NLP library for better intent matching
   - Support complex queries: "Navigate to the nearest coffee shop"

3. **Voice Confirmation**
   - Ask for confirmation before critical actions
   - "Did you say 'start navigation'?"

4. **Custom Voice Profiles**
   - Train on user's voice
   - Improve accuracy for accents/speech patterns

5. **Offline Voice Recognition**
   - Implement on-device STT for mobile
   - Reduce latency and network dependency

6. **Multi-Language Support**
   - Support languages beyond English
   - Dynamic language switching

7. **Voice Shortcuts**
   - "Home" → Navigate to saved home address
   - "Work" → Navigate to work

8. **Context-Aware Commands**
   - Different commands available on different screens
   - Screen-specific command sets

---

## Code Structure Summary

```
EyeWay_voice/
│
├── hooks/
│   ├── voiceCommands.ts          # Command parsing logic
│   ├── useSpeechToText.ts        # AssemblyAI mobile STT
│   └── useHomeVoiceControl.ts    # Main voice control hook
│
├── components/
│   ├── voice-button.tsx          # Voice-enabled button component
│   └── status-indicator.tsx      # Visual status feedback
│
├── app/
│   ├── _layout.tsx               # Global voice control initialization
│   ├── (tabs)/
│   │   └── index.tsx             # Home screen (voice control commented)
│   ├── navigation.tsx            # Start navigation screen
│   ├── location.tsx              # "Where Am I" screen
│   └── routes.tsx                # Saved routes screen
│
└── constants/
    └── theme.ts                  # Color scheme for status indicators
```

---

## API Keys & Configuration

### AssemblyAI

**API Key**: `26422c96915a455183278905acf57267`

**Location**: `hooks/useSpeechToText.ts` (Line 5)

**Endpoints:**
- Upload: `https://api.assemblyai.com/v2/upload`
- Transcript: `https://api.assemblyai.com/v2/transcript`
- Status: `https://api.assemblyai.com/v2/transcript/{id}`

**⚠️ Security Note**: API key is hardcoded. Should be moved to environment variables for production.

---

## Testing Voice Commands

### Manual Testing Steps

1. **Start the App**
   ```bash
   npm start
   ```

2. **Web Testing**
   - Open in Chrome/Edge (best Web Speech API support)
   - Allow microphone access
   - Speak commands clearly
   - Wait for visual/audio feedback

3. **Mobile Testing**
   - Build development app
   - Ensure microphone permissions granted
   - Speak after 1.5s delay
   - Wait 4 seconds for recording to complete

### Test Commands

- ✅ "start" → Navigate to navigation screen
- ✅ "where am I" → Open location screen
- ✅ "saved routes" → Show saved routes
- ✅ "settings" → Open settings modal
- ✅ "go back" → Previous screen

---

## Accessibility Features

1. **Voice-First Design**
   - Entire app navigable by voice
   - No screen interaction required

2. **Haptic Feedback**
   - Tactile confirmation for actions
   - Different intensities for different actions

3. **Clear Voice Feedback**
   - Every action announced
   - Error states clearly communicated

4. **Screen Reader Support**
   - Proper `accessibilityRole` and `accessibilityLabel`
   - Semantic UI components

5. **High Contrast UI**
   - Clear visual feedback
   - Status indicators with distinct colors

---

## Performance Considerations

### Current Performance

- **Web**: Real-time (< 1 second response)
- **Mobile**: 5-7 seconds per command (network-dependent)

### Optimization Opportunities

1. **Reduce Recording Duration**
   - Current: 4 seconds (hardcoded)
   - Could use voice activity detection to stop early

2. **Local STT on Mobile**
   - Use `expo-speech-to-text` or native APIs
   - Eliminate network latency

3. **Caching**
   - Cache common commands
   - Predictive command loading

4. **Background Processing**
   - Start next recording while processing current
   - Parallel upload and transcription

---

## Known Issues

1. **Voice Control Commented Out on Home Screen**
   - Lines 10-59 in `app/(tabs)/index.tsx` are commented
   - Functionality moved to global scope in `_layout.tsx`

2. **Fixed 4-Second Recording**
   - Can't interrupt early
   - Wastes time for short commands

3. **No Wake Word**
   - Always listening
   - Potential for accidental triggers

4. **Single Language Only**
   - English only
   - No multi-language support

5. **Hardcoded API Key**
   - AssemblyAI key exposed in source code
   - Security risk for public repositories

---

## Conclusion

The EyeWay voice command system is a comprehensive, accessibility-focused implementation that enables hands-free navigation through voice commands. It intelligently handles platform differences, provides clear audio feedback, and maintains a continuous listening loop for seamless user interaction.

**Key Strengths:**
- ✅ Cross-platform voice recognition
- ✅ Continuous listening
- ✅ Clear voice feedback
- ✅ Simple command parsing
- ✅ Global navigation control

**Areas for Improvement:**
- ⚠️ Mobile latency (network-dependent)
- ⚠️ Simple keyword matching (prone to false positives)
- ⚠️ No wake word detection
- ⚠️ Hardcoded API credentials

The system provides a solid foundation for voice-first navigation with clear paths for future enhancement.
