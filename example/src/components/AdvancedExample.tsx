import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAdvancedVoiceAgent } from 'react-native-voice-agent';
import { styles } from '../styles/demoStyles';
import type { ConversationEntry, VoiceAgentProps } from '../types';

export const AdvancedExample: React.FC<VoiceAgentProps> = ({ agent }) => {
  const voice = useAdvancedVoiceAgent(agent);
  const [conversationLog, setConversationLog] = useState<ConversationEntry[]>(
    []
  );
  const [thinkingAnimation, setThinkingAnimation] = useState('thinking');

  // Track conversation changes
  useEffect(() => {
    if (voice.transcript) {
      setConversationLog((prev) => [
        ...prev.filter((entry) => entry.type !== 'thinking'), // Remove thinking indicators
        {
          type: 'user',
          text: voice.transcript,
          timestamp: new Date(),
        },
      ]);
    }
  }, [voice.transcript]);

  useEffect(() => {
    if (voice.response) {
      setConversationLog((prev) => [
        ...prev.filter((entry) => entry.type !== 'thinking'), // Remove thinking indicators
        {
          type: 'assistant',
          text: voice.response,
          timestamp: new Date(),
        },
      ]);
    }
  }, [voice.response]);

  // Handle thinking state
  useEffect(() => {
    if (voice.isThinking) {
      // Add thinking indicator
      setConversationLog((prev) => [
        ...prev.filter((entry) => entry.type !== 'thinking'), // Remove any existing thinking indicators
        {
          type: 'thinking',
          text: thinkingAnimation,
          timestamp: new Date(),
        },
      ]);
    } else {
      // Remove thinking indicators when not thinking
      setConversationLog((prev) =>
        prev.filter((entry) => entry.type !== 'thinking')
      );
    }
  }, [voice.isThinking, thinkingAnimation]);

  // Animate thinking dots
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (voice.isThinking) {
      interval = setInterval(() => {
        setThinkingAnimation((prev) => {
          switch (prev) {
            case 'thinking':
              return 'thinking.';
            case 'thinking.':
              return 'thinking..';
            case 'thinking..':
              return 'thinking...';
            case 'thinking...':
              return 'thinking';
            default:
              return 'thinking';
          }
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [voice.isThinking]);

  const downloadInfo = voice.getDownloadInfo();
  const conversationStatus = voice.getConversationStatus();

  return (
    <View style={styles.demoContainer}>
      <Text style={styles.demoTitle}>Advanced Voice Features</Text>

      {/* Status Information */}
      <View style={styles.statusCard}>
        <Text style={styles.statusTitle}>Status</Text>
        <Text style={styles.statusText}>State: {downloadInfo.statusText}</Text>
        <Text style={styles.statusText}>
          Permissions: {voice.hasPermissions ? '✓ Granted' : '✗ Required'}
        </Text>
        <Text style={styles.statusText}>
          Auto Mode: {voice.isAutoMode ? '✓ Enabled' : '✗ Disabled'}
        </Text>
        <Text style={styles.statusText}>
          In Conversation: {conversationStatus.isInConversation ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Controls */}
      <View style={styles.controlsGrid}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            !voice.canStartRecording && styles.controlButtonDisabled,
          ]}
          onPress={() => voice.startConversation()}
          disabled={
            !voice.canStartRecording || conversationStatus.isInConversation
          }
        >
          <Text style={styles.controlButtonText}>Start Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => voice.endConversation()}
          disabled={!conversationStatus.isInConversation}
        >
          <Text style={styles.controlButtonText}>End Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.controlButton,
            voice.isAutoMode && styles.controlButtonActive,
          ]}
          onPress={() => voice.enableAutoMode(!voice.isAutoMode)}
        >
          <Text style={styles.controlButtonText}>Auto Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            voice.clearHistory();
            setConversationLog([]);
          }}
        >
          <Text style={styles.controlButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation Log */}
      <View style={styles.conversationLog}>
        <Text style={styles.logTitle}>Conversation Log</Text>
        <ScrollView style={styles.logScrollView}>
          {conversationLog.map((entry, index) => (
            <View
              key={index}
              style={[
                styles.logEntry,
                entry.type === 'user'
                  ? styles.logEntryUser
                  : entry.type === 'thinking'
                    ? styles.logEntryThinking
                    : styles.logEntryAssistant,
              ]}
            >
              <Text style={styles.logEntryType}>
                {entry.type === 'user'
                  ? 'You'
                  : entry.type === 'thinking'
                    ? 'AI'
                    : 'AI'}
                :
              </Text>
              <Text
                style={[
                  styles.logEntryText,
                  entry.type === 'thinking' && styles.logEntryThinkingText,
                ]}
              >
                {entry.text}
              </Text>
              {entry.type !== 'thinking' && (
                <Text style={styles.logEntryTime}>
                  {entry.timestamp.toLocaleTimeString()}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};
