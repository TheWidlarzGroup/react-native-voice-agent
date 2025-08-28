import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  AdvancedVoiceAgentButton,
  useAdvancedVoiceAgent,
} from 'react-native-voice-agent';
import { styles } from '../styles/demoStyles';
import type { VoiceAgentProps, PresetPrompt } from '../types';

const presetPrompts: PresetPrompt[] = [
  {
    name: 'Assistant',
    prompt:
      'You are a helpful AI assistant. Keep your responses concise and conversational.',
  },
  {
    name: 'Pirate',
    prompt:
      'You are a friendly pirate captain. Respond in pirate speak but keep it family-friendly and brief.',
  },
  {
    name: 'Scientist',
    prompt:
      'You are a brilliant scientist. Explain concepts clearly and concisely, using simple terms.',
  },
  {
    name: 'Poet',
    prompt:
      'You are a creative poet. Respond with short, beautiful verses that relate to what the user says.',
  },
];

export const CustomExample: React.FC<VoiceAgentProps> = ({ agent }) => {
  const voice = useAdvancedVoiceAgent(agent);
  const [systemPrompt, setSystemPrompt] = useState(
    'You are a helpful AI assistant. Keep your responses concise and conversational.'
  );

  const applyPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    voice.setSystemPrompt(prompt);
    voice.clearHistory();
  };

  return (
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>Custom Personalities</Text>
      <Text style={styles.demoDescription}>
        Try different AI personalities by changing the system prompt.
      </Text>

      <View style={styles.promptGrid}>
        {presetPrompts.map((preset, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.promptButton,
              systemPrompt === preset.prompt && styles.promptButtonActive,
            ]}
            onPress={() => applyPrompt(preset.prompt)}
          >
            <Text
              style={[
                styles.promptButtonText,
                systemPrompt === preset.prompt && styles.promptButtonTextActive,
              ]}
            >
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.currentPromptContainer}>
        <Text style={styles.currentPromptTitle}>Current Personality:</Text>
        <Text style={styles.currentPromptText}>{systemPrompt}</Text>
      </View>

      <AdvancedVoiceAgentButton
        agent={agent}
        showTranscript={true}
        showResponse={true}
        compact={false}
      />
    </View>
  );
};
