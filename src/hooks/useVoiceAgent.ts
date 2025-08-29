import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  VoiceAgent,
  VoiceAgentHookReturn,
  VoiceAgentState,
  ModelDownloadProgress,
} from '../types';
import { useVoiceRecordingPermissions } from './usePermissions';

export const useVoiceAgent = (agent: VoiceAgent): VoiceAgentHookReturn => {
  const [state, setState] = useState<VoiceAgentState>({
    isListening: false,
    isThinking: false,
    isSpeaking: false,
    transcript: '',
    response: '',
    error: null,
    isInitialized: false,
    downloadProgress: undefined,
  });

  // Permissions hook
  const permissions = useVoiceRecordingPermissions();

  // Refs for cleanup and state management
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const agentRef = useRef<VoiceAgent>(agent);

  // Update agent ref when agent changes
  useEffect(() => {
    agentRef.current = agent;
  }, [agent]);

  // Subscribe to agent state changes
  useEffect(() => {
    // Clean up previous subscription
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const unsubscribe = agentRef.current.subscribe(
      (newState: VoiceAgentState) => {
        setState(newState);
      }
    );

    unsubscribeRef.current = unsubscribe;

    // Initialize agent if not already initialized
    const currentState = agentRef.current.getState();

    if (!currentState.isInitialized) {
      agentRef.current.initialize().catch((error) => {
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : 'Initialization failed',
        }));
      });
    } else {
      // Get current state immediately if already initialized
      setState(currentState);
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [agent]); // Re-run when agent changes

  // Start listening with permission checks
  const startListening = useCallback(async (): Promise<void> => {
    try {
      // Check permissions first
      const prepareResult = await permissions.prepareForRecording();
      if (!prepareResult.success) {
        setState((prev) => ({
          ...prev,
          error: prepareResult.message || 'Permission denied',
        }));
        return;
      }

      // Ensure agent is initialized
      if (!state.isInitialized) {
        await agentRef.current.initialize();
      }

      // Start listening
      await agentRef.current.startListening();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to start listening';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, [permissions, state.isInitialized]);

  // Stop listening
  const stopListening = useCallback((): void => {
    try {
      agentRef.current.stopListening();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to stop listening';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Speak text
  const speak = useCallback(
    async (text: string): Promise<void> => {
      try {
        // Clear any previous errors
        setState((prev) => ({ ...prev, error: null }));

        // Ensure agent is initialized
        if (!state.isInitialized) {
          await agentRef.current.initialize();
        }

        await agentRef.current.speak(text);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to speak';
        setState((prev) => ({
          ...prev,
          error: errorMessage,
        }));
      }
    },
    [state.isInitialized]
  );

  // Interrupt speech
  const interruptSpeech = useCallback((): void => {
    try {
      agentRef.current.interruptSpeech();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to interrupt speech';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Set system prompt
  const setSystemPrompt = useCallback((prompt: string): void => {
    try {
      agentRef.current.setSystemPrompt(prompt);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to set system prompt';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Clear conversation history
  const clearHistory = useCallback((): void => {
    try {
      agentRef.current.clearHistory();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to clear history';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
      }));
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  return {
    // Core methods
    startListening,
    stopListening,
    speak,
    interruptSpeech,
    setSystemPrompt,
    clearHistory,

    // State
    isListening: state.isListening,
    isThinking: state.isThinking,
    isSpeaking: state.isSpeaking,
    transcript: state.transcript,
    response: state.response,
    error: state.error,
    isInitialized: state.isInitialized,
    downloadProgress: state.downloadProgress,
  };
};

// Advanced hook with additional features
export const useAdvancedVoiceAgent = (agent: VoiceAgent) => {
  const basicHook = useVoiceAgent(agent);
  const permissions = useVoiceRecordingPermissions();

  // Additional state for advanced features
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [conversationStarted, setConversationStarted] = useState(false);
  const autoModeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto mode: automatically start listening after TTS finishes
  const enableAutoMode = useCallback((enabled: boolean): void => {
    setIsAutoMode(enabled);
    if (!enabled && autoModeTimeoutRef.current) {
      clearTimeout(autoModeTimeoutRef.current);
      autoModeTimeoutRef.current = null;
    }
  }, []);

  // Auto-restart listening after speaking in auto mode
  useEffect(() => {
    if (
      isAutoMode &&
      !basicHook.isSpeaking &&
      !basicHook.isListening &&
      conversationStarted
    ) {
      // Start listening again after a short delay
      autoModeTimeoutRef.current = setTimeout(() => {
        if (permissions.canStartRecording()) {
          basicHook.startListening();
        }
      }, 1000);
    }

    return () => {
      if (autoModeTimeoutRef.current) {
        clearTimeout(autoModeTimeoutRef.current);
        autoModeTimeoutRef.current = null;
      }
    };
  }, [
    isAutoMode,
    basicHook.isSpeaking,
    basicHook.isListening,
    conversationStarted,
    permissions,
    basicHook,
  ]);

  // Enhanced start listening that tracks conversation state
  const startConversation = useCallback(async (): Promise<void> => {
    setConversationStarted(true);
    await basicHook.startListening();
  }, [basicHook]);

  // Enhanced stop that ends conversation
  const endConversation = useCallback((): void => {
    setConversationStarted(false);
    setIsAutoMode(false);
    basicHook.stopListening();
    basicHook.interruptSpeech();

    if (autoModeTimeoutRef.current) {
      clearTimeout(autoModeTimeoutRef.current);
      autoModeTimeoutRef.current = null;
    }
  }, [basicHook]);

  // Get conversation status
  const getConversationStatus = useCallback((): {
    status: 'idle' | 'listening' | 'processing' | 'speaking';
    isInConversation: boolean;
    canInterrupt: boolean;
  } => {
    let status: 'idle' | 'listening' | 'processing' | 'speaking' = 'idle';

    if (basicHook.isListening) {
      status = 'listening';
    } else if (basicHook.isThinking) {
      status = 'processing';
    } else if (basicHook.isSpeaking) {
      status = 'speaking';
    }

    return {
      status,
      isInConversation: conversationStarted,
      canInterrupt: basicHook.isSpeaking,
    };
  }, [
    basicHook.isListening,
    basicHook.isThinking,
    basicHook.isSpeaking,
    conversationStarted,
  ]);

  // Get download progress information
  const getDownloadInfo = useCallback((): {
    isDownloading: boolean;
    progress?: ModelDownloadProgress;
    statusText: string;
  } => {
    const progress = basicHook.downloadProgress;
    const isDownloading = !!progress && !progress.isComplete;

    let statusText = 'Ready';

    if (!basicHook.isInitialized) {
      if (isDownloading && progress) {
        statusText = `Downloading ${progress.modelName}: ${Math.round(progress.percentage)}%`;
      } else {
        statusText = 'Initializing...';
      }
    } else if (basicHook.error) {
      statusText = 'Error occurred';
    } else {
      const convStatus = getConversationStatus();
      switch (convStatus.status) {
        case 'listening':
          statusText = 'Listening...';
          break;
        case 'processing':
          statusText = 'Thinking...';
          break;
        case 'speaking':
          statusText = 'Speaking...';
          break;
        default:
          statusText = convStatus.isInConversation
            ? 'In conversation'
            : 'Ready';
      }
    }

    return {
      isDownloading,
      progress,
      statusText,
    };
  }, [
    basicHook.downloadProgress,
    basicHook.isInitialized,
    basicHook.error,
    getConversationStatus,
  ]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoModeTimeoutRef.current) {
        clearTimeout(autoModeTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...basicHook,

    // Enhanced methods
    startConversation,
    endConversation,

    // Auto mode
    isAutoMode,
    enableAutoMode,

    // Status helpers
    getConversationStatus,
    getDownloadInfo,
    conversationStarted,

    // Permission helpers
    hasPermissions: permissions.hasMicrophonePermission,
    canStartRecording: permissions.canStartRecording,
    requestPermissions: permissions.ensureMicrophonePermission,
    permissionStatus: permissions.getPermissionStatusText(),
    shouldShowSettingsPrompt: permissions.shouldShowSettingsPrompt(),
    openSettings: permissions.openAppSettings,
  };
};
