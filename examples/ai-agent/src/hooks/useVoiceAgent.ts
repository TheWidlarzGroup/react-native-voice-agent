import { useMemo } from 'react';
import { VoiceAgent } from 'react-native-audio-agent';

export const useVoiceAgent = () => {
  const agent = useMemo(() => {
    return VoiceAgent.create()
      .withWhisper('tiny.en')
      .withLLM({
        provider: 'offline',
        model: 'llama-3.2-1b-instruct-q4_k_m.gguf',
        maxTokens: 256,
        temperature: 0.7,
        topP: 0.9,
        enableGPUAcceleration: false,
      })
      .withSystemPrompt(
        'You are a helpful AI assistant. Keep your responses very short, under 30 words.'
      )
      .withVoiceSettings({
        rate: 0.5,
        pitch: 1.0,
        language: 'en-US',
      })
      .enableGPUAcceleration(false)
      .build();
  }, []);

  return agent;
};
