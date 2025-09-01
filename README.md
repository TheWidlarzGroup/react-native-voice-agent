# React Native Voice Agent

> 🎙️ **Offline AI voice agent for React Native** - Free to use

React Native library that provides AI voice assistant experience using Whisper for speech-to-text, offline Llama models or online providers (OpenAI, Anthropic, Google) for language modeling, and system TTS for speech synthesis.

## ✨ Key Features

- 🔥 **Offline + Online** - Support both offline models and cloud providers (OpenAI, Anthropic, Google)
- ⚡ **Flexible Costs** - Free offline processing or pay-per-use online models
- 🚀 **Modern API** - Builder pattern configuration, React hooks integration
- 📱 **Cross Platform** - iOS and Android support with platform optimizations
- 🎨 **Customizable UI** - Optional components with full styling control
- 🧠 **Smart Features** - Voice Activity Detection, barge-in support, auto-mode
- 📊 **Performance Optimized** - Memory management, model caching, GPU acceleration

## 🎬 Quick Demo

```typescript
import { VoiceAgent, useVoiceAgent } from 'react-native-audio-agent';

// Create agent with offline model
const offlineAgent = VoiceAgent
  .create()
  .withWhisper('tiny.en') // 39MB, fast transcription
  .withLLM({
    provider: 'offline',
    model: 'llama-3.2-3b-instruct-q4_k_m.gguf', // 1.8GB
    maxTokens: 256,
    temperature: 0.7,
  })
  .withSystemPrompt('You are a helpful assistant.')
  .build();

// Or with online provider
const onlineAgent = VoiceAgent
  .create()
  .withWhisper('base.en')
  .withLLM({
    provider: 'openai', // 'openai' | 'anthropic' | 'google'
    apiKey: 'your-api-key',
    model: 'gpt-4',
    maxTokens: 256,
    temperature: 0.7,
  })
  .withSystemPrompt('You are a helpful assistant.')
  .build();

function VoiceChat() {
  const voice = useVoiceAgent(offlineAgent); // or onlineAgent

  return (
    <TouchableOpacity
      onPress={voice.isListening ? voice.stopListening : voice.startListening}
      style={{ backgroundColor: voice.isListening ? 'red' : 'blue' }}
    >
      <Text>
        {voice.isListening ? 'Stop Listening' : 'Start Voice Chat'}
      </Text>
    </TouchableOpacity>
  );
}
```

## 📦 Installation

```bash
npm install react-native-audio-agent
# or
yarn add react-native-audio-agent

# Install peer dependencies
npm install react-native-permissions react-native-tts react-native-fs llama.rn whisper.rn react-native-audio-recorder-player react-native-nitro-modules
```

### iOS Setup

Add permissions to `ios/YourApp/Info.plist`:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs microphone access for voice chat</string>
<key>NSSpeechRecognitionUsageDescription</key>
<string>This app needs speech recognition for voice chat</string>
```

### Android Setup

Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

## ⚠️ Important: Testing on Real Devices

**This library must be tested on real physical devices, not emulators or simulators.**

The voice agent downloads and runs large AI models (Whisper and Llama) locally on the device. Emulators and simulators:

- Lack the computational resources to run these models effectively
- May not properly handle model downloading and storage
- Cannot accurately simulate real-world performance and memory constraints
- May have audio recording/playback limitations

For the best development and testing experience, always use:

- **iOS**: Real iPhone/iPad devices
- **Android**: Physical Android devices

The models will be downloaded automatically on first use and cached locally for subsequent sessions.

## 🚀 Tech Stack

- **STT**: [whisper.rn](https://github.com/mybigday/whisper.rn) with tiny.en model (39MB, 94.3% accuracy)
- **LLM**: [llama.rn](https://github.com/mybigday/llama.rn) with Llama 3.2 3B quantized (1.8GB)
- **TTS**: react-native-tts using high-quality system voices
- **State**: Zustand for internal state management
- **Audio**: Advanced audio session management with barge-in support
- **Permissions**: react-native-permissions for microphone access

## 📚 API Reference

### VoiceAgent Builder

```typescript
const agent = VoiceAgent.create()
  .withWhisper(
    'tiny.en' | 'base.en' | 'small.en' | 'medium.en' | 'large-v2' | 'large-v3'
  )
  .withLlama('model-filename.gguf')
  .withSystemPrompt('Your custom prompt')
  .withVoiceSettings({
    rate: 0.5, // Speech rate (0.1 - 1.0)
    pitch: 1.0, // Speech pitch (0.5 - 2.0)
    language: 'en-US', // Language code
  })
  .enableGPUAcceleration(true) // iOS Metal support
  .withMaxHistoryLength(10) // Conversation memory
  .enableVAD(true) // Voice Activity Detection
  .build();
```

### useVoiceAgent Hook

```typescript
const voice = useVoiceAgent(agent);

// Methods
voice.startListening(); // Start recording
voice.stopListening(); // Stop recording
voice.speak(text); // Speak text
voice.interruptSpeech(); // Stop current speech
voice.setSystemPrompt(); // Update AI personality
voice.clearHistory(); // Clear conversation

// State
voice.isListening; // Currently recording
voice.isThinking; // Processing speech
voice.isSpeaking; // Playing response
voice.transcript; // Last transcribed text
voice.response; // Last AI response
voice.error; // Current error state
voice.isInitialized; // Agent ready
voice.downloadProgress; // Model download status
```

### Advanced Hook

```typescript
const voice = useAdvancedVoiceAgent(agent);

// Additional features
voice.startConversation(); // Begin session
voice.endConversation(); // End session
voice.enableAutoMode(true); // Auto-continue after responses
voice.canStartRecording; // Permission check
voice.getConversationStatus(); // Detailed state info
voice.getDownloadInfo(); // Model download details
```

### UI Components

```typescript
// Simple button with built-in logic
<VoiceAgentButton
  agent={agent}
  onTranscript={(text) => console.log('User said:', text)}
  onResponse={(text) => console.log('AI replied:', text)}
  onError={(error) => Alert.alert('Error', error)}
/>

// Advanced component with controls
<AdvancedVoiceAgentButton
  agent={agent}
  showTranscript={true}
  showResponse={true}
  showStatus={true}
  compact={false}
/>
```

## 🎯 Usage Patterns

### Basic Voice Chat

```typescript
import { VoiceAgent, VoiceAgentButton } from 'react-native-audio-agent';

const agent = VoiceAgent
  .create()
  .withWhisper('tiny.en')
  .withLlama('llama-3.2-3b-instruct-q4_k_m.gguf')
  .withSystemPrompt('You are a helpful assistant.')
  .build();

export function BasicVoiceChat() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <VoiceAgentButton agent={agent} />
    </View>
  );
}
```

### Custom Controls

```typescript
export function CustomVoiceUI() {
  const voice = useVoiceAgent(agent);

  return (
    <View>
      <Text>Status: {voice.isListening ? 'Listening...' : 'Ready'}</Text>
      <Text>You: {voice.transcript}</Text>
      <Text>AI: {voice.response}</Text>

      <TouchableOpacity onPress={voice.startListening}>
        <Text>🎤 Talk</Text>
      </TouchableOpacity>

      {voice.isSpeaking && (
        <TouchableOpacity onPress={voice.interruptSpeech}>
          <Text>⏸️ Interrupt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
```

### Personality Switching

```typescript
const personalities = {
  assistant: 'You are a helpful AI assistant.',
  pirate: 'You are a friendly pirate. Speak like one!',
  poet: 'You are a creative poet. Respond in verse.',
};

function switchPersonality(type: keyof typeof personalities) {
  voice.setSystemPrompt(personalities[type]);
  voice.clearHistory();
}
```

## 📱 Platform Specifics

### iOS Features

- Metal GPU acceleration for Llama inference
- Core ML acceleration for Whisper (when available)
- AVAudioSession optimization for low latency
- High-quality Neural TTS voices

### Android Features

- GPU acceleration via NNAPI (when supported)
- AudioRecord optimization for real-time processing
- System TTS with voice selection
- Background processing permissions

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/TheWidlarzGroup/react-native-audio-agent
cd react-native-audio-agent
yarn install

# Run example app
cd example
yarn install
yarn ios # or yarn android
```

## 🙏 Acknowledgments

- [whisper.rn](https://github.com/mybigday/whisper.rn) for Whisper integration
- [llama.rn](https://github.com/mybigday/llama.rn) for Llama integration
- OpenAI for the Whisper model
- Meta for the Llama models

**Built by [The Widlarz Group](https://thewidlarzgroup.com) 🚀**

_Making AI voice interfaces accessible to every React Native developer_
