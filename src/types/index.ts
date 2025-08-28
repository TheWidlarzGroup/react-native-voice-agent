import type { StyleProp, ViewStyle } from 'react-native';

export interface WhisperModel {
  name:
    | 'tiny.en'
    | 'base.en'
    | 'small.en'
    | 'medium.en'
    | 'large-v2'
    | 'large-v3';
  size: number;
  accuracy: number;
}

export interface LlamaModel {
  name: string;
  size: number;
  quantization: string;
}

export interface VoiceSettings {
  rate?: number;
  pitch?: number;
  language?: string;
  voice?: string;
}

export interface ModelDownloadProgress {
  modelName: string;
  downloaded: number;
  total: number;
  percentage: number;
  isComplete: boolean;
}

export interface VoiceAgentState {
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  transcript: string;
  response: string;
  error: string | null;
  isInitialized: boolean;
  downloadProgress?: ModelDownloadProgress;
}

export interface VoiceAgentConfig {
  whisperModel: WhisperModel;
  llamaModel: LlamaModel;
  systemPrompt: string;
  voiceSettings: VoiceSettings;
  enableGPUAcceleration: boolean;
  maxHistoryLength?: number;
  vadEnabled?: boolean;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface AudioSessionConfig {
  category: 'playback' | 'record' | 'playAndRecord';
  mode:
    | 'default'
    | 'measurement'
    | 'moviePlayback'
    | 'videoRecording'
    | 'voiceChat';
  options?: string[];
}

export interface VoiceAgentHookReturn {
  startListening: () => Promise<void>;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  interruptSpeech: () => void;
  setSystemPrompt: (prompt: string) => void;
  clearHistory: () => void;
  isListening: boolean;
  isThinking: boolean;
  isSpeaking: boolean;
  transcript: string;
  response: string;
  error: string | null;
  isInitialized: boolean;
  downloadProgress?: ModelDownloadProgress;
}

export interface VoiceAgentButtonProps {
  agent: VoiceAgent;
  style?: StyleProp<ViewStyle>;
  onTranscript?: (text: string) => void;
  onResponse?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface PermissionState {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'blocked' | 'unavailable' | 'limited';
}

export interface VoiceAgent {
  initialize(): Promise<void>;
  startListening(): Promise<void>;
  stopListening(): void;
  processAudio(audioData: number[]): Promise<string>;
  generateResponse(transcript: string): Promise<string>;
  speak(text: string): Promise<void>;
  interruptSpeech(): void;
  setSystemPrompt(prompt: string): void;
  clearHistory(): void;
  dispose(): Promise<void>;
  getState(): VoiceAgentState;
  subscribe(callback: (state: VoiceAgentState) => void): () => void;
}

export interface VoiceAgentBuilder {
  withWhisper(modelName: WhisperModel['name']): VoiceAgentBuilder;
  withLlama(modelName: string): VoiceAgentBuilder;
  withSystemPrompt(prompt: string): VoiceAgentBuilder;
  withVoiceSettings(settings: VoiceSettings): VoiceAgentBuilder;
  enableGPUAcceleration(enabled: boolean): VoiceAgentBuilder;
  withMaxHistoryLength(length: number): VoiceAgentBuilder;
  enableVAD(enabled: boolean): VoiceAgentBuilder;
  build(): VoiceAgent;
}

export interface ServiceError extends Error {
  code: string;
  service: 'whisper' | 'llama' | 'tts' | 'permissions' | 'audio';
}

// Utility function to create standardized service errors
export function createServiceError(
  service: ServiceError['service'],
  code: string,
  message: string,
  originalError?: unknown
): ServiceError {
  const errorMessage =
    originalError instanceof Error
      ? `${message}: ${originalError.message}`
      : `${message}: ${originalError}`;

  const serviceError = new Error(errorMessage) as ServiceError;
  serviceError.name = `${service.charAt(0).toUpperCase() + service.slice(1)}ServiceError`;
  serviceError.code = code;
  serviceError.service = service;

  return serviceError;
}

export interface WhisperOptions {
  modelName: WhisperModel['name'];
  enableVAD: boolean;
  language: string;
  enableGPUAcceleration: boolean;
}

export interface LlamaOptions {
  modelName: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  enableGPUAcceleration: boolean;
}

export interface TTSOptions extends VoiceSettings {
  interruptible: boolean;
}

// Llama.rn instance interface
export interface LlamaInstance {
  completion(options: {
    prompt: string;
    n_predict: number;
    temperature: number;
    top_p: number;
    stop?: string[];
  }): Promise<{ text: string }>;
  release(): Promise<void>;
}

// Download progress from RNFS
export interface DownloadProgressInfo {
  bytesWritten: number;
  contentLength: number;
}

// TTS Voice from react-native-tts
export interface NativeTTSVoice {
  id: string;
  name: string;
  language: string;
  networkConnectionRequired?: boolean;
}

// TTS speak options
export interface TTSSpeakOptions {
  androidParams?: {
    KEY_PARAM_PAN?: number;
    KEY_PARAM_VOLUME?: number;
    KEY_PARAM_STREAM?: string;
  };
  iosVoiceId?: string;
  rate?: number;
  pitch?: number;
}

// Store interface for VoiceAgent internal state
export interface VoiceAgentStore extends VoiceAgentState {
  setListening: (isListening: boolean) => void;
  setThinking: (isThinking: boolean) => void;
  setSpeaking: (isSpeaking: boolean) => void;
  setTranscript: (transcript: string) => void;
  setResponse: (response: string) => void;
  setError: (error: string | null) => void;
  setInitialized: (isInitialized: boolean) => void;
  setDownloadProgress: (progress: ModelDownloadProgress | undefined) => void;
}
