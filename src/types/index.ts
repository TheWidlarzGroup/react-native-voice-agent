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

export interface OfflineLlamaModel {
  name: string;
  size: number;
  quantization: string;
  description?: string;
}

export type OnlineLLMProvider = 'openai' | 'anthropic' | 'google';

// OpenAI Models
export type OpenAIModel =
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gpt-4.1'
  | 'gpt-4.1-mini'
  | 'gpt-4.1-nano'
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-realtime'
  | 'o3-mini';

// Anthropic Models
export type AnthropicModel =
  | 'claude-opus-4.1-20250805'
  | 'claude-sonnet-4-20250522'
  | 'claude-opus-4-20250522'
  | 'claude-3.7-sonnet-20250224'
  | 'claude-3.5-sonnet'
  | 'claude-3.5-haiku'
  | 'claude-3.5-opus'
  | 'claude-3-opus-20240229'
  | 'claude-3-sonnet-20240229';

// Google Models
export type GoogleModel =
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash'
  | 'gemini-2.0-flash-thinking'
  | 'gemini-2.0-flash-lite'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

export interface OfflineLLMConfig {
  provider: 'offline';
  model: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  enableGPUAcceleration?: boolean;
}

export interface OpenAIConfig {
  provider: 'openai';
  apiKey: string;
  model: OpenAIModel;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

export interface AnthropicConfig {
  provider: 'anthropic';
  apiKey: string;
  model: AnthropicModel;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

export interface GoogleConfig {
  provider: 'google';
  apiKey: string;
  model: GoogleModel;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  timeout?: number;
}

export type LLMConfig =
  | OfflineLLMConfig
  | OpenAIConfig
  | AnthropicConfig
  | GoogleConfig;

// Model utility types and constants
export const OFFLINE_MODELS: OfflineLlamaModel[] = [
  {
    name: 'llama-3.2-1b-instruct-q4_k_m.gguf',
    size: 800 * 1024 * 1024, // ~800MB
    quantization: 'Q4_K_M',
    description: 'Fast, lightweight model for basic conversations',
  },
  {
    name: 'llama-3.2-3b-instruct-q4_k_m.gguf',
    size: 1800 * 1024 * 1024, // ~1.8GB
    quantization: 'Q4_K_M',
    description: 'Balanced model with good performance and quality',
  },
  {
    name: 'llama-3.1-8b-instruct-q4_k_m.gguf',
    size: 4800 * 1024 * 1024, // ~4.8GB
    quantization: 'Q4_K_M',
    description: 'High-quality model for complex conversations',
  },
];

export const OPENAI_MODELS: Array<{
  model: OpenAIModel;
  description: string;
  context: number;
}> = [
  {
    model: 'gpt-5',
    description: 'Most advanced reasoning model with 94.6% AIME performance',
    context: 272000,
  },
  {
    model: 'gpt-5-mini',
    description: 'Fast and efficient GPT-5 variant',
    context: 272000,
  },
  {
    model: 'gpt-5-nano',
    description: 'Lightweight GPT-5 variant',
    context: 272000,
  },
  {
    model: 'gpt-4.1',
    description: 'Enhanced GPT-4 with 1M context window',
    context: 1000000,
  },
  {
    model: 'gpt-4.1-mini',
    description: 'Efficient GPT-4.1 variant',
    context: 1000000,
  },
  {
    model: 'gpt-4.1-nano',
    description: 'Compact GPT-4.1 variant',
    context: 1000000,
  },
  {
    model: 'gpt-4o',
    description: 'Multimodal flagship model',
    context: 128000,
  },
  {
    model: 'gpt-4o-mini',
    description: 'Fast, cost-effective smart model',
    context: 128000,
  },
  {
    model: 'gpt-realtime',
    description: 'Optimized for real-time voice interactions',
    context: 128000,
  },
  {
    model: 'o3-mini',
    description: 'Latest reasoning model with enhanced abilities',
    context: 200000,
  },
];

export const ANTHROPIC_MODELS: Array<{
  model: AnthropicModel;
  description: string;
  context: number;
}> = [
  {
    model: 'claude-opus-4.1-20250805',
    description: 'Most capable and intelligent model (2025)',
    context: 1000000,
  },
  {
    model: 'claude-sonnet-4-20250522',
    description: 'High-performance Claude 4 with exceptional reasoning',
    context: 1000000,
  },
  {
    model: 'claude-opus-4-20250522',
    description: 'Most capable Claude 4 model',
    context: 1000000,
  },
  {
    model: 'claude-3.7-sonnet-20250224',
    description: 'Hybrid reasoning model with step-by-step thinking',
    context: 1000000,
  },
  {
    model: 'claude-3.5-sonnet',
    description: 'Industry-leading intelligence with computer use',
    context: 200000,
  },
  {
    model: 'claude-3.5-haiku',
    description: 'Fastest model surpassing Claude 3 Opus',
    context: 200000,
  },
  {
    model: 'claude-3.5-opus',
    description: 'Upcoming most capable Claude 3.5 model',
    context: 200000,
  },
  {
    model: 'claude-3-opus-20240229',
    description: 'Most capable Claude 3 model',
    context: 200000,
  },
  {
    model: 'claude-3-sonnet-20240229',
    description: 'Balanced performance and capability',
    context: 200000,
  },
];

export const GOOGLE_MODELS: Array<{
  model: GoogleModel;
  description: string;
  context: number;
}> = [
  {
    model: 'gemini-2.5-pro',
    description: 'Most intelligent AI model with state-of-the-art thinking',
    context: 2000000,
  },
  {
    model: 'gemini-2.5-flash',
    description: 'Best price-performance with thinking capabilities',
    context: 1000000,
  },
  {
    model: 'gemini-2.5-flash-lite',
    description: 'Lowest latency and cost in 2.5 family',
    context: 1000000,
  },
  {
    model: 'gemini-2.0-flash',
    description: 'Next-gen features with native tool use',
    context: 1000000,
  },
  {
    model: 'gemini-2.0-flash-thinking',
    description: 'First thinking model with Flash speed',
    context: 1000000,
  },
  {
    model: 'gemini-2.0-flash-lite',
    description: 'Lightweight 2.0 Flash variant',
    context: 1000000,
  },
  {
    model: 'gemini-1.5-pro',
    description: 'Advanced 1.5 generation model',
    context: 2000000,
  },
  {
    model: 'gemini-1.5-flash',
    description: 'Fast and efficient 1.5 model',
    context: 1000000,
  },
];

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
  llmConfig: LLMConfig;
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
  withLLM(config: LLMConfig): VoiceAgentBuilder;
  withSystemPrompt(prompt: string): VoiceAgentBuilder;
  withVoiceSettings(settings: VoiceSettings): VoiceAgentBuilder;
  enableGPUAcceleration(enabled: boolean): VoiceAgentBuilder;
  withMaxHistoryLength(length: number): VoiceAgentBuilder;
  enableVAD(enabled: boolean): VoiceAgentBuilder;
  speechOnly(): VoiceAgentBuilder;
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

export interface OfflineLlamaOptions {
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
