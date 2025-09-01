import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import {
  AdvancedVoiceAgentButton,
  useAdvancedVoiceAgent,
} from 'react-native-voice-agent';
import { demoStyles } from '../styles/demoStyles';
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
    <View style={demoStyles.demoContainer}>
      <Text style={demoStyles.demoTitle}>Custom Personalities</Text>
      <Text style={demoStyles.demoDescription}>
        Try different AI personalities by changing the system prompt.
      </Text>

      <View style={demoStyles.promptGrid}>
        {presetPrompts.map((preset, index) => (
          <TouchableOpacity
            key={index}
            style={[
              demoStyles.promptButton,
              systemPrompt === preset.prompt && demoStyles.promptButtonActive,
            ]}
            onPress={() => applyPrompt(preset.prompt)}
          >
            <Text
              style={[
                demoStyles.promptButtonText,
                systemPrompt === preset.prompt &&
                  demoStyles.promptButtonTextActive,
              ]}
            >
              {preset.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={demoStyles.currentPromptContainer}>
        <Text style={demoStyles.currentPromptTitle}>Current Personality:</Text>
        <Text style={demoStyles.currentPromptText}>{systemPrompt}</Text>
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
