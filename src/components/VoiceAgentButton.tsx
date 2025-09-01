import React, { useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import type { VoiceAgentButtonProps } from '../types';
import { useAdvancedVoiceAgent } from '../hooks/useVoiceAgent';

export const VoiceAgentButton: React.FC<VoiceAgentButtonProps> = ({
  agent,
  style,
  onTranscript,
  onResponse,
  onError,
}) => {
  const voice = useAdvancedVoiceAgent(agent);

  // Handle transcript changes
  React.useEffect(() => {
    if (voice.transcript && onTranscript) {
      onTranscript(voice.transcript);
    }
  }, [voice.transcript, onTranscript]);

  // Handle response changes
  React.useEffect(() => {
    if (voice.response && onResponse) {
      onResponse(voice.response);
    }
  }, [voice.response, onResponse]);

  // Handle error changes
  React.useEffect(() => {
    if (voice.error && onError) {
      onError(voice.error);
    }
  }, [voice.error, onError]);

  // Determine button state and style
  const buttonState = useMemo(() => {
    const downloadInfo = voice.getDownloadInfo();
    const conversationStatus = voice.getConversationStatus();

    if (downloadInfo.isDownloading) {
      return {
        label: downloadInfo.statusText,
        color: '#FFA500',
        disabled: true,
        showActivity: true,
        downloadProgress: downloadInfo.progress,
      };
    }

    if (!voice.isInitialized) {
      return {
        label: 'Initializing...',
        color: '#FFA500',
        disabled: true,
        showActivity: true,
      };
    }

    if (voice.error) {
      return {
        label: 'Error - Tap to retry',
        color: '#FF4444',
        disabled: false,
        showActivity: false,
      };
    }

    if (!voice.hasPermissions) {
      return {
        label: 'Grant Microphone Permission',
        color: '#FF6B6B',
        disabled: false,
        showActivity: false,
      };
    }

    switch (conversationStatus.status) {
      case 'listening':
        return {
          label: 'Listening... (Tap to stop)',
          color: '#44FF44',
          disabled: false,
          showActivity: false,
          pulsing: true,
        };
      case 'processing':
        return {
          label: 'Processing...',
          color: '#4444FF',
          disabled: true,
          showActivity: true,
        };
      case 'speaking':
        return {
          label: 'Speaking... (Tap to interrupt)',
          color: '#FF44FF',
          disabled: false,
          showActivity: false,
          pulsing: true,
        };
      default:
        return {
          label: conversationStatus.isInConversation
            ? 'Continue Conversation'
            : 'Start Voice Chat',
          color: '#007AFF',
          disabled: false,
          showActivity: false,
        };
    }
  }, [voice]);

  // Handle button press
  const handlePress = async () => {
    if (buttonState.disabled) return;

    try {
      if (voice.error) {
        // Retry initialization on error
        await agent.initialize();
        return;
      }

      if (!voice.hasPermissions) {
        // Request permissions
        await voice.requestPermissions();
        return;
      }

      const conversationStatus = voice.getConversationStatus();

      switch (conversationStatus.status) {
        case 'listening':
          voice.stopListening();
          break;
        case 'speaking':
          voice.interruptSpeech();
          break;
        default:
          if (conversationStatus.isInConversation) {
            await voice.startListening();
          } else {
            await voice.startConversation();
          }
          break;
      }
    } catch (error) {
      if (onError) {
        onError(
          error instanceof Error ? error.message : 'Button action failed'
        );
      }
    }
  };

  return (
    <Pressable
      style={[styles.container, style]}
      onPress={handlePress}
      disabled={buttonState.disabled}
    >
      <View
        style={[
          styles.button,
          { backgroundColor: buttonState.color },
          buttonState.disabled && styles.buttonDisabled,
          buttonState.pulsing && styles.buttonPulsing,
        ]}
      >
        <View style={styles.buttonContent}>
          {buttonState.showActivity && (
            <ActivityIndicator
              color="white"
              size="small"
              style={styles.activityIndicator}
            />
          )}
          <Text
            style={[
              styles.buttonText,
              buttonState.showActivity && styles.buttonTextWithActivity,
            ]}
          >
            {buttonState.label}
          </Text>
        </View>

        {/* Download Progress Bar */}
        {buttonState.downloadProgress && (
          <View style={styles.buttonProgressContainer}>
            <View
              style={[
                styles.buttonProgressBar,
                {
                  width: `${Math.max(buttonState.downloadProgress.percentage, 0)}%`,
                },
              ]}
            />
          </View>
        )}
      </View>
    </Pressable>
  );
};

// Advanced button with more UI features
export const AdvancedVoiceAgentButton: React.FC<
  VoiceAgentButtonProps & {
    showTranscript?: boolean;
    showResponse?: boolean;
    showStatus?: boolean;
    compact?: boolean;
  }
> = ({
  agent,
  style,
  onTranscript,
  onResponse,
  onError,
  showTranscript = false,
  showResponse = false,
  showStatus = false,
  compact = false,
}) => {
  const voice = useAdvancedVoiceAgent(agent);

  // Handle callbacks
  React.useEffect(() => {
    if (voice.transcript && onTranscript) onTranscript(voice.transcript);
  }, [voice.transcript, onTranscript]);

  React.useEffect(() => {
    if (voice.response && onResponse) onResponse(voice.response);
  }, [voice.response, onResponse]);

  React.useEffect(() => {
    if (voice.error && onError) onError(voice.error);
  }, [voice.error, onError]);

  const downloadInfo = voice.getDownloadInfo();
  const conversationStatus = voice.getConversationStatus();

  const handleMainAction = async () => {
    try {
      if (voice.error) {
        await agent.initialize();
        return;
      }

      if (!voice.hasPermissions) {
        await voice.requestPermissions();
        return;
      }

      if (conversationStatus.status === 'listening') {
        voice.stopListening();
      } else if (conversationStatus.status === 'speaking') {
        voice.interruptSpeech();
      } else {
        if (conversationStatus.isInConversation) {
          await voice.startListening();
        } else {
          await voice.startConversation();
        }
      }
    } catch (error) {
      if (onError) {
        onError(
          error instanceof Error ? error.message : 'Button action failed'
        );
      }
    }
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={handleMainAction}
        disabled={
          !voice.canStartRecording &&
          conversationStatus.status !== 'listening' &&
          conversationStatus.status !== 'speaking'
        }
      >
        <View
          style={[
            styles.compactButton,
            conversationStatus.status === 'listening' &&
              styles.compactButtonListening,
            conversationStatus.status === 'speaking' &&
              styles.compactButtonSpeaking,
          ]}
        >
          {downloadInfo.isDownloading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.compactButtonText}>🎤</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[styles.advancedContainer, style]}>
      {/* Status indicator */}
      {showStatus && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{downloadInfo.statusText}</Text>
          {downloadInfo.isDownloading && downloadInfo.progress && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${downloadInfo.progress.percentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(downloadInfo.progress.percentage)}%
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Main button */}
      <VoiceAgentButton
        agent={agent}
        onTranscript={onTranscript}
        onResponse={onResponse}
        onError={onError}
      />

      {/* Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[
            styles.controlButton,
            voice.isAutoMode && styles.controlButtonActive,
          ]}
          onPress={() => voice.enableAutoMode(!voice.isAutoMode)}
        >
          <Text
            style={[
              styles.controlButtonText,
              voice.isAutoMode && styles.controlButtonTextActive,
            ]}
          >
            Auto Mode
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={voice.clearHistory}
        >
          <Text style={styles.controlButtonText}>Clear</Text>
        </TouchableOpacity>

        {conversationStatus.isInConversation && (
          <TouchableOpacity
            style={[styles.controlButton, styles.endButton]}
            onPress={voice.endConversation}
          >
            <Text style={[styles.controlButtonText, styles.endButtonText]}>
              End
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Transcript */}
      {showTranscript && voice.transcript && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptLabel}>You said:</Text>
          <Text style={styles.transcriptText}>{voice.transcript}</Text>
        </View>
      )}

      {/* Response */}
      {showResponse && voice.response && (
        <View style={styles.responseContainer}>
          <Text style={styles.responseLabel}>AI response:</Text>
          <Text style={styles.responseText}>{voice.response}</Text>
        </View>
      )}

      {/* Error */}
      {voice.error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{voice.error}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    minWidth: 200,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPulsing: {
    // Animation would be implemented with Animated API
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  buttonTextWithActivity: {
    marginLeft: 8,
  },
  activityIndicator: {
    marginRight: 8,
  },
  buttonProgressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: 'hidden',
  },
  buttonProgressBar: {
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  // Compact button styles
  compactContainer: {
    alignItems: 'center',
  },
  compactButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  compactButtonListening: {
    backgroundColor: '#44FF44',
  },
  compactButtonSpeaking: {
    backgroundColor: '#FF44FF',
  },
  compactButtonText: {
    fontSize: 24,
  },

  // Advanced button styles
  advancedContainer: {
    padding: 16,
    alignItems: 'center',
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  controlsContainer: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  controlButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
  },
  controlButtonActive: {
    backgroundColor: '#007AFF',
  },
  controlButtonText: {
    fontSize: 14,
    color: '#333',
  },
  controlButtonTextActive: {
    color: 'white',
  },
  endButton: {
    backgroundColor: '#FF4444',
  },
  endButtonText: {
    color: 'white',
  },
  transcriptContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    width: '100%',
  },
  transcriptLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  transcriptText: {
    fontSize: 14,
    color: '#333',
  },
  responseContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#E8F4FD',
    borderRadius: 8,
    width: '100%',
  },
  responseLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  responseText: {
    fontSize: 14,
    color: '#333',
  },
  errorContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FFE8E8',
    borderRadius: 8,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    color: '#CC0000',
  },
});
