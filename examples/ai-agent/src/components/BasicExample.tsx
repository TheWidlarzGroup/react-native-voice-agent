import React from 'react';
import { View, Text, Alert } from 'react-native';
import { AdvancedVoiceAgentButton } from 'react-native-audio-agent';
import { demoStyles } from '../styles/demoStyles';
import type { VoiceAgentProps } from '../types';

export const BasicExample: React.FC<VoiceAgentProps> = ({ agent }) => {
  return (
    <View style={demoStyles.demoContainer}>
      <Text style={demoStyles.demoTitle}>Basic Voice Chat</Text>
      <Text style={demoStyles.demoDescription}>
        Simple voice interaction using the AdvancedVoiceAgentButton component.
        Tap the button to start talking, and the AI will respond.
      </Text>

      <View style={demoStyles.buttonContainer}>
        <AdvancedVoiceAgentButton
          agent={agent}
          showTranscript={true}
          showResponse={true}
          showStatus={true}
          onTranscript={(text: string) => console.log('Transcript:', text)}
          onResponse={(text: string) => console.log('Response:', text)}
          onError={(error: unknown) => {
            console.error('Voice Agent Error:', error);
            Alert.alert('Error', String(error));
          }}
        />
      </View>
    </View>
  );
};
