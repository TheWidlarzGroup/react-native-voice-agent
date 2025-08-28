import React from 'react';
import { View, Text, Alert } from 'react-native';
import { AdvancedVoiceAgentButton } from 'react-native-voice-agent';
import { styles } from '../styles/demoStyles';
import type { VoiceAgentProps } from '../types';

export const BasicExample: React.FC<VoiceAgentProps> = ({ agent }) => {
  return (
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>Basic Voice Chat</Text>
      <Text style={styles.demoDescription}>
        Simple voice interaction using the AdvancedVoiceAgentButton component.
        Tap the button to start talking, and the AI will respond.
      </Text>

      <View style={styles.buttonContainer}>
        <AdvancedVoiceAgentButton
          agent={agent}
          showTranscript={true}
          showResponse={true}
          showStatus={true}
          onTranscript={(text) => console.log('Transcript:', text)}
          onResponse={(text) => console.log('Response:', text)}
          onError={(error) => {
            console.error('Voice Agent Error:', error);
            Alert.alert('Error', error);
          }}
        />
      </View>
    </View>
  );
};
