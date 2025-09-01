# Examples

This directory contains example applications demonstrating different use cases of the react-native-voice-agent library.

## Available Examples

### 1. AI Agent Example (`./ai-agent/`)

**Full AI voice conversation experience**

This example demonstrates the complete voice agent functionality with:
- **STT (Whisper)** for speech recognition
- **LLM (Llama/Online)** for AI conversation
- **TTS** for voice responses
- **Full conversation flow** with context and history
- **Offline and online LLM options**

**Features:**
- Natural voice conversations with AI
- Model downloading with progress
- Permission management
- Voice activity detection
- Conversation history
- Multiple AI provider support (OpenAI, Anthropic, Google)

**Usage:**
```bash
cd examples/ai-agent
yarn install
yarn ios # or yarn android
```

### 2. Video Control Example (`./video-control/`)

**Voice-controlled video player (STT only)**

This example focuses specifically on video control without AI:
- **STT only** using @react-native-voice/voice
- **46 voice commands** for video control
- **Direct intent matching** without LLM
- **react-native-video integration**
- **Faster response** (no AI processing)

**Features:**
- Voice control of video playback
- Seek, volume, fullscreen control
- Real-time speech recognition feedback
- Visual status display
- Completely offline operation
- No API keys required

**Usage:**
```bash
cd examples/video-control
yarn install
yarn ios # or yarn android
```

## Comparison

| Feature | AI Agent | Video Control |
|---------|----------|---------------|
| **STT** | ✅ Whisper | ✅ @react-native-voice/voice |
| **LLM/AI** | ✅ Full conversation | ❌ No AI |
| **TTS** | ✅ Voice responses | ❌ No TTS |
| **Use Case** | General AI assistant | Video control only |
| **Response Time** | Slower (AI processing) | Faster (direct intent) |
| **Offline** | ✅ With offline models | ✅ Complete |
| **Setup Complexity** | Higher (model downloads) | Lower (just STT) |
| **API Keys** | Optional (for online) | None required |

## Use Cases

### Choose AI Agent Example for:
- Building AI voice assistants
- Natural language conversations
- Complex query handling
- Multi-turn conversations
- Educational or research purposes

### Choose Video Control Example for:
- Video/media applications
- Smart TV interfaces
- Accessibility features
- Simple command interfaces
- When you need fast response times

## Integration Patterns

Both examples showcase different integration approaches:

**AI Agent Pattern:**
```typescript
const agent = VoiceAgent.create()
  .withWhisper('base.en')
  .withLLM({ provider: 'offline', model: 'llama-3.2-1b' })
  .withSystemPrompt('You are a helpful assistant')
  .build();

const { startListening, response } = useVoiceAgent(agent);
```

**Video Control Pattern:**
```typescript
import { withVideoControl, matchIntent } from 'react-native-voice-agent';

// Direct STT → Intent → Action
Voice.onSpeechResults = (event) => {
  const text = event.value[0];
  const intent = matchIntent(text);
  if (intent) executeVideoCommand(intent);
};
```

## Architecture Diagrams

### AI Agent Flow
```
Voice → STT → LLM → TTS → Speaker
  ↓      ↓     ↓     ↓      ↓
Audio → Text → Response → Audio → User
```

### Video Control Flow  
```
Voice → STT → Intent → Video Control
  ↓      ↓      ↓         ↓
Audio → Text → Action → video.pause()
```

## Development

Each example is a standalone React Native application with its own:
- `package.json` and dependencies
- `App.tsx` main component  
- Platform-specific configuration
- README with detailed setup instructions

## Contributing

When adding new examples:
1. Create a new directory in `examples/`
2. Follow the naming convention: `kebab-case`
3. Include a comprehensive README.md
4. Add TypeScript support
5. Ensure proper error handling
6. Add to this main examples README