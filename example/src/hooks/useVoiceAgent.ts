import { useMemo } from 'react';
import { Platform } from 'react-native';
import { VoiceAgent } from 'react-native-voice-agent';

export const useVoiceAgent = () => {
  const agent = useMemo(() => {
    return VoiceAgent.create()
      .withWhisper('tiny.en') // Fast, small model for demo
      .withLLM({
        provider: 'offline',
        model: 'llama-3.2-3b-instruct-q4_k_m.gguf',
        maxTokens: 256,
        temperature: 0.7,
        topP: 0.9,
        enableGPUAcceleration: Platform.OS === 'ios',
      })
      .withSystemPrompt(
        'You are a helpful AI assistant. Keep your responses concise and conversational, ideally under 50 words.'
      )
      .withVoiceSettings({
        rate: 0.5,
        pitch: 1.0,
        language: 'en-US',
      })
      .enableGPUAcceleration(Platform.OS === 'ios')
      .build();
  }, []);

  return agent;
};
