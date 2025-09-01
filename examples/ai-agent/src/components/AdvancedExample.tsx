import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useAdvancedVoiceAgent } from 'react-native-audio-agent';
import { demoStyles } from '../styles/demoStyles';
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
    <View style={demoStyles.demoContainer}>
      <Text style={demoStyles.demoTitle}>Advanced Voice Features</Text>

      {/* Status Information */}
      <View style={demoStyles.statusCard}>
        <Text style={demoStyles.statusTitle}>Status</Text>
        <Text style={demoStyles.statusText}>
          State: {downloadInfo.statusText}
        </Text>
        <Text style={demoStyles.statusText}>
          Permissions: {voice.hasPermissions ? '✓ Granted' : '✗ Required'}
        </Text>
        <Text style={demoStyles.statusText}>
          Auto Mode: {voice.isAutoMode ? '✓ Enabled' : '✗ Disabled'}
        </Text>
        <Text style={demoStyles.statusText}>
          In Conversation: {conversationStatus.isInConversation ? 'Yes' : 'No'}
        </Text>
      </View>

      {/* Controls */}
      <View style={demoStyles.controlsGrid}>
        <TouchableOpacity
          style={[
            demoStyles.controlButton,
            !voice.canStartRecording && demoStyles.controlButtonDisabled,
          ]}
          onPress={() => voice.startConversation()}
          disabled={
            !voice.canStartRecording || conversationStatus.isInConversation
          }
        >
          <Text style={demoStyles.controlButtonText}>Start Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={demoStyles.controlButton}
          onPress={() => voice.endConversation()}
          disabled={!conversationStatus.isInConversation}
        >
          <Text style={demoStyles.controlButtonText}>End Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            demoStyles.controlButton,
            voice.isAutoMode && demoStyles.controlButtonActive,
          ]}
          onPress={() => voice.enableAutoMode(!voice.isAutoMode)}
        >
          <Text style={demoStyles.controlButtonText}>Auto Mode</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={demoStyles.controlButton}
          onPress={() => {
            voice.clearHistory();
            setConversationLog([]);
          }}
        >
          <Text style={demoStyles.controlButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Conversation Log */}
      <View style={demoStyles.conversationLog}>
        <Text style={demoStyles.logTitle}>Conversation Log</Text>
        <ScrollView style={demoStyles.logScrollView}>
          {conversationLog.map((entry, index) => (
            <View
              key={index}
              style={[
                demoStyles.logEntry,
                entry.type === 'user'
                  ? demoStyles.logEntryUser
                  : entry.type === 'thinking'
                    ? demoStyles.logEntryThinking
                    : demoStyles.logEntryAssistant,
              ]}
            >
              <Text style={demoStyles.logEntryType}>
                {entry.type === 'user'
                  ? 'You'
                  : entry.type === 'thinking'
                    ? 'AI'
                    : 'AI'}
                :
              </Text>
              <Text
                style={[
                  demoStyles.logEntryText,
                  entry.type === 'thinking' && demoStyles.logEntryThinkingText,
                ]}
              >
                {entry.text}
              </Text>
              {entry.type !== 'thinking' && (
                <Text style={demoStyles.logEntryTime}>
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
