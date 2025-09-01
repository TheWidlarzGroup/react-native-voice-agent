# Video Control Example

This example demonstrates voice control of a react-native-video player using only STT (Speech-to-Text) without AI/LLM. It showcases the video controller integration from the react-native-voice-agent library.

## Features

- **Voice-controlled video playback** using only STT
- **46 voice commands** for complete video control
- **Real-time feedback** showing recognized speech and matched intents
- **Visual status display** of video state and voice recognition
- **No AI/LLM required** - direct STT to video control mapping

## Supported Voice Commands

### Playback Control
- "pause" / "stop" / "play" / "resume"
- "restart"

### Seeking
- "skip ahead 10" / "skip back 30"  
- "rewind 10 seconds" / "forward one minute"
- "go to two minutes" / "go to 10:00" / "go to 1:30"

### Volume Control
- "volume up" / "volume down"
- "set volume to 50 percent" / "set volume to 20 percent"
- "mute" / "unmute"

### Display Control
- "fullscreen" / "exit fullscreen"

### Advanced Commands
- Speed control: "1.25x", "1.5x", "2x", "normal speed"
- Subtitles: "subtitles on", "subtitles off"
- Quality: "quality 1080p", "highest quality"
- And many more...

## How It Works

1. **STT Only**: Uses @react-native-voice/voice for speech recognition
2. **Intent Matching**: Our NLU layer processes speech text and matches intents
3. **Direct Control**: Matched intents directly control react-native-video methods
4. **No API Calls**: Everything works offline with no external services

## Architecture

```
Speech Input → STT → Intent Matching → Video Control
     ↓              ↓           ↓            ↓
  Raw Audio → Text Result → Intent + Slots → video.pause()
```

## Setup & Installation

```bash
# Navigate to the video-control example
cd examples/video-control

# Install dependencies (already done)
yarn install

# Run on iOS
yarn ios

# Run on Android
yarn android
```

## Implementation Details

The example uses:
- `react-native-video` for video playback
- `@react-native-voice/voice` for STT
- `react-native-permissions` for microphone access
- Our `videoController` integration for intent matching

## Usage

1. Launch the app
2. Grant microphone permissions when prompted
3. Tap the "Start Voice Control" button
4. Speak any supported command (e.g., "pause", "volume up", "skip ahead 10")
5. Watch the video respond to your voice commands
6. View real-time status of recognition and video state

## Key Files

- `App.tsx` - Main demo application
- `../../src/integrations/videoController.ts` - Video control integration
- Voice commands are processed through the `matchIntent()` function
- Video control is applied directly via react-native-video ref methods

## Demo Video

The example loads a sample video (Big Buck Bunny) to demonstrate voice control capabilities.

## Permissions

The app requires microphone permission for voice recognition:
- Android: `RECORD_AUDIO` permission
- iOS: Microphone usage permission

## Testing

Try these commands to test the integration:
1. "pause" - should pause the video
2. "skip ahead 30" - should seek forward 30 seconds  
3. "set volume to 50 percent" - should set volume to 50%
4. "fullscreen" - should enter fullscreen mode
5. "restart" - should restart video from beginning

## Differences from AI-Agent Example

Unlike the ai-agent example, this demo:
- Uses only STT without LLM/AI processing
- Processes voice commands directly through intent matching
- No conversation or natural language understanding
- Focused specifically on video control use case
- Faster response time (no AI inference)
- Works completely offline