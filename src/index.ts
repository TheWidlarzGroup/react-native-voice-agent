// Main VoiceAgent class and builder
export { VoiceAgent } from './VoiceAgent';
export type {
  VoiceAgent as VoiceAgentInterface,
  VoiceAgentBuilder,
} from './types';

// Hooks
export { useVoiceAgent, useAdvancedVoiceAgent } from './hooks/useVoiceAgent';
export {
  usePermissions,
  useVoiceRecordingPermissions,
} from './hooks/usePermissions';

// Components
export {
  VoiceAgentButton,
  AdvancedVoiceAgentButton,
} from './components/VoiceAgentButton';

// Services (for advanced users)
export { WhisperService } from './services/WhisperService';
export { LlamaService } from './services/LlamaService';
export { TTSService } from './services/TTSService';
export type { Voice } from './services/TTSService';

// Utilities (for advanced users)
export { ModelDownloader } from './utils/modelDownloader';
export {
  AudioSessionManager,
  AudioBufferManager,
  VoiceActivityDetector,
  audioUtils,
} from './utils/audioUtils';

// Types
export type {
  // Core types
  VoiceAgentState,
  VoiceAgentConfig,
  VoiceAgentHookReturn,
  VoiceAgentButtonProps,

  // Model types
  WhisperModel,
  LlamaModel,
  WhisperOptions,
  LlamaOptions,

  // Settings and configuration
  VoiceSettings,
  TTSOptions,
  AudioSessionConfig,

  // Progress and state
  ModelDownloadProgress,
  ConversationMessage,
  PermissionState,

  // Error handling
  ServiceError,
} from './types';

// Re-export the main class as default export for convenience
export { VoiceAgent as default } from './VoiceAgent';
