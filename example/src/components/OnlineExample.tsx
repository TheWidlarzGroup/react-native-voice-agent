import { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import {
  VoiceAgent,
  useVoiceAgent,
  usePermissions,
  OPENAI_MODELS,
  ANTHROPIC_MODELS,
  GOOGLE_MODELS,
} from 'react-native-voice-agent';
import type {
  OnlineLLMProvider,
  VoiceAgentInterface,
  OpenAIModel,
  AnthropicModel,
  GoogleModel,
} from 'react-native-voice-agent';
import { demoStyles } from '../styles/demoStyles';
import type { ConversationEntry, VoiceAgentProps } from '../types';

type ProviderConfig = {
  name: string;
  provider: OnlineLLMProvider;
  models: Array<{
    model: OpenAIModel | AnthropicModel | GoogleModel;
    description: string;
    context: number;
  }>;
  placeholder: string;
};

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'OpenAI',
    provider: 'openai',
    models: OPENAI_MODELS,
    placeholder: 'sk-proj-...',
  },
  {
    name: 'Anthropic',
    provider: 'anthropic',
    models: ANTHROPIC_MODELS,
    placeholder: 'sk-ant-...',
  },
  {
    name: 'Google',
    provider: 'google',
    models: GOOGLE_MODELS,
    placeholder: 'AIza...',
  },
];

export function OnlineExample({ agent: _defaultAgent }: VoiceAgentProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderConfig>(
    PROVIDERS[0]!
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    PROVIDERS[0]!.models[0]!.model
  );
  const [apiKey, setApiKey] = useState<string>('');
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are a helpful AI assistant. Keep your responses concise and conversational.'
  );
  const [agent, setAgent] = useState<VoiceAgentInterface | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [isConfigured, setIsConfigured] = useState(false);

  // Create a stable dummy agent that won't cause re-renders
  const dummyAgent = useMemo(
    () =>
      ({
        initialize: async () => {},
        startListening: async () => {},
        stopListening: () => {},
        processAudio: async () => '',
        generateResponse: async () => '',
        speak: async () => {},
        interruptSpeech: () => {},
        setSystemPrompt: () => {},
        clearHistory: () => {},
        dispose: async () => {},
        getState: () => ({
          isListening: false,
          isThinking: false,
          isSpeaking: false,
          transcript: '',
          response: '',
          error: null,
          isInitialized: false,
        }),
        subscribe: () => () => {},
      }) as VoiceAgentInterface,
    []
  );

  // Only use real agent when it's configured and ready
  const activeAgent = isConfigured && agent ? agent : dummyAgent;

  const {
    startListening,
    stopListening,
    isListening,
    isThinking,
    isSpeaking,
    transcript,
    response,
    error,
    isInitialized,
    downloadProgress,
  } = useVoiceAgent(activeAgent);

  const { checkMicrophonePermission, requestMicrophonePermission } =
    usePermissions();

  // Track the last processed values to prevent duplicates
  const lastTranscriptRef = useRef<string>('');
  const lastResponseRef = useRef<string>('');

  useEffect(() => {
    // Update conversation when we get new transcript
    if (transcript && transcript !== lastTranscriptRef.current) {
      lastTranscriptRef.current = transcript;
      setConversation((prev) => [
        ...prev.filter((entry) => entry.type !== 'thinking'),
        { type: 'user', text: transcript, timestamp: new Date() },
      ]);
    }
  }, [transcript]);

  useEffect(() => {
    if (isThinking) {
      setConversation((prev) => {
        // Only add thinking if it's not already the last entry
        if (prev[prev.length - 1]?.type !== 'thinking') {
          return [
            ...prev,
            { type: 'thinking', text: 'Thinking...', timestamp: new Date() },
          ];
        }
        return prev;
      });
    }
  }, [isThinking]);

  useEffect(() => {
    if (response && response !== lastResponseRef.current) {
      lastResponseRef.current = response;
      setConversation((prev) => [
        ...prev.filter((entry) => entry.type !== 'thinking'),
        { type: 'assistant', text: response, timestamp: new Date() },
      ]);
    }
  }, [response]);

  const configureAgent = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    try {
      const llmConfig = {
        provider: selectedProvider.provider,
        apiKey: apiKey.trim(),
        model: selectedModel as any, // Type assertion since we know the model is valid
        maxTokens: 256,
        temperature: 0.7,
        topP: 0.9,
        timeout: 30000,
      };

      const newAgent = VoiceAgent.create()
        .withWhisper('tiny.en') // Use smaller model to avoid memory issues
        .enableGPUAcceleration(false) // Disable GPU to avoid Metal memory issues
        .withLLM(llmConfig)
        .withSystemPrompt(systemPrompt)
        .withVoiceSettings({
          rate: 0.5,
          pitch: 1.0,
          language: 'en-US',
        })
        .build();

      setAgent(newAgent);
      setIsConfigured(true);
      setConversation([]);
    } catch (configError) {
      console.error('Failed to configure agent:', configError);
      Alert.alert('Error', `Failed to configure agent: ${configError}`);
    }
  };

  const handleStartListening = async () => {
    try {
      const micPermission = await checkMicrophonePermission();

      if (!micPermission.granted) {
        const granted = await requestMicrophonePermission();
        if (!granted.granted) {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required for voice input'
          );
          return;
        }
      }

      await startListening();
    } catch (listenError) {
      Alert.alert('Error', `Failed to start listening: ${listenError}`);
    }
  };

  const clearConversation = () => {
    if (agent) {
      agent.clearHistory();
      setConversation([]);
    }
  };

  const resetConfiguration = () => {
    setAgent(null);
    setIsConfigured(false);
    setApiKey('');
    setConversation([]);
  };

  const clearModelsAndReset = async () => {
    try {
      // Clear any cached models
      const RNFS = require('react-native-fs');
      const documentsPath = RNFS.DocumentDirectoryPath;
      const modelsDir = `${documentsPath}/models`;

      if (await RNFS.exists(modelsDir)) {
        await RNFS.unlink(modelsDir);
        console.log('Cleared models directory');
      }

      resetConfiguration();
      Alert.alert('Success', 'Models cleared. Try configuring again.');
    } catch (error) {
      console.error('Failed to clear models:', error);
      Alert.alert('Error', 'Failed to clear models');
    }
  };

  if (!isConfigured) {
    return (
      <ScrollView style={demoStyles.container}>
        <View style={demoStyles.section}>
          <Text style={demoStyles.sectionTitle}>
            Configure Online AI Provider
          </Text>
          <Text style={demoStyles.description}>
            Choose an AI provider and enter your API key to start using online
            models.
          </Text>
        </View>

        <View style={demoStyles.section}>
          <Text style={demoStyles.label}>Provider</Text>
          <View style={demoStyles.providerContainer}>
            {PROVIDERS.map((provider) => (
              <TouchableOpacity
                key={provider.provider}
                style={[
                  demoStyles.providerButton,
                  selectedProvider.provider === provider.provider &&
                    demoStyles.providerButtonActive,
                ]}
                onPress={() => {
                  setSelectedProvider(provider);
                  setSelectedModel(provider.models[0]?.model || '');
                }}
              >
                <Text
                  style={[
                    demoStyles.providerButtonText,
                    selectedProvider.provider === provider.provider &&
                      demoStyles.providerButtonTextActive,
                  ]}
                >
                  {provider.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={demoStyles.section}>
          <Text style={demoStyles.label}>Model</Text>
          <View style={demoStyles.modelContainer}>
            {selectedProvider.models.map(({ model, description, context }) => (
              <TouchableOpacity
                key={model}
                style={[
                  demoStyles.modelButton,
                  selectedModel === model && demoStyles.modelButtonActive,
                ]}
                onPress={() => setSelectedModel(model)}
              >
                <Text
                  style={[
                    demoStyles.modelButtonText,
                    selectedModel === model && demoStyles.modelButtonTextActive,
                  ]}
                >
                  {model}
                </Text>
                <Text
                  style={[
                    demoStyles.modelDescription,
                    selectedModel === model &&
                      demoStyles.modelDescriptionActive,
                  ]}
                >
                  {description} ({context.toLocaleString()} tokens)
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={demoStyles.section}>
          <Text style={demoStyles.label}>API Key</Text>
          <TextInput
            style={demoStyles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder={selectedProvider.placeholder}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={demoStyles.section}>
          <Text style={demoStyles.label}>System Prompt</Text>
          <TextInput
            style={[demoStyles.input, demoStyles.multilineInput]}
            value={systemPrompt}
            onChangeText={setSystemPrompt}
            multiline
            numberOfLines={3}
            placeholder="Enter system prompt..."
          />
        </View>

        <TouchableOpacity
          style={demoStyles.primaryButton}
          onPress={configureAgent}
        >
          <Text style={demoStyles.primaryButtonText}>Configure Agent</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[demoStyles.secondaryButton, { marginTop: 10 }]}
          onPress={clearModelsAndReset}
        >
          <Text style={demoStyles.secondaryButtonText}>
            Clear Models & Reset
          </Text>
        </TouchableOpacity>

        <View style={demoStyles.infoBox}>
          <Text style={demoStyles.infoText}>
            ⚠️ API keys are stored temporarily in memory only. Never hardcode
            them in production apps.
          </Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={demoStyles.container}>
      <View style={demoStyles.header}>
        <View style={demoStyles.statusContainer}>
          <Text style={demoStyles.statusLabel}>
            {selectedProvider.name} • {selectedModel}
          </Text>
          <View
            style={[
              demoStyles.statusIndicator,
              isInitialized ? demoStyles.statusReady : demoStyles.statusPending,
            ]}
          />
        </View>

        <TouchableOpacity
          style={demoStyles.secondaryButton}
          onPress={resetConfiguration}
        >
          <Text style={demoStyles.secondaryButtonText}>Reconfigure</Text>
        </TouchableOpacity>
      </View>

      {downloadProgress && (
        <View style={demoStyles.progressContainer}>
          <Text style={demoStyles.progressText}>
            Downloading {downloadProgress.modelName}:{' '}
            {downloadProgress.percentage.toFixed(1)}%
          </Text>
          <View style={demoStyles.progressBar}>
            <View
              style={[
                demoStyles.progressFill,
                { width: `${downloadProgress.percentage}%` },
              ]}
            />
          </View>
        </View>
      )}

      <View style={demoStyles.conversationContainer}>
        <ScrollView style={demoStyles.conversation}>
          {conversation.map((entry, index) => (
            <View
              key={index}
              style={[
                demoStyles.messageContainer,
                entry.type === 'user'
                  ? demoStyles.userMessage
                  : entry.type === 'thinking'
                    ? demoStyles.thinkingMessage
                    : demoStyles.assistantMessage,
              ]}
            >
              <Text style={demoStyles.messageText}>
                {entry.type === 'user'
                  ? '🎤 '
                  : entry.type === 'thinking'
                    ? '🤔 '
                    : '🤖 '}
                {entry.text}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={demoStyles.controls}>
        <TouchableOpacity
          style={[
            demoStyles.recordButton,
            isListening && demoStyles.recordButtonActive,
            !isInitialized && demoStyles.recordButtonDisabled,
          ]}
          onPress={isListening ? stopListening : handleStartListening}
          disabled={!isInitialized}
        >
          <Text
            style={[
              demoStyles.recordButtonText,
              isListening && demoStyles.recordButtonTextActive,
            ]}
          >
            {isListening ? '🛑 Stop' : '🎤 Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={demoStyles.clearButton}
          onPress={clearConversation}
        >
          <Text style={demoStyles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={demoStyles.errorContainer}>
          <Text style={demoStyles.errorText}>⚠️ {error}</Text>
        </View>
      )}

      <View style={demoStyles.statusBar}>
        <Text style={demoStyles.statusText}>
          {isListening
            ? '🎤 Listening...'
            : isThinking
              ? '🤔 Thinking...'
              : isSpeaking
                ? '🔊 Speaking...'
                : '💤 Ready'}
        </Text>
      </View>
    </View>
  );
}
