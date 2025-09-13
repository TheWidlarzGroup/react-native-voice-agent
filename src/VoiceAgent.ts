import { create } from 'zustand';
import type {
  VoiceAgent as IVoiceAgent,
  VoiceAgentBuilder,
  VoiceAgentConfig,
  VoiceAgentState,
  WhisperModel,
  VoiceSettings,
  ModelDownloadProgress,
  VoiceAgentStore,
  LLMConfig,
} from './types';
import { WhisperService } from './services/WhisperService';
import { LlamaService } from './services/LlamaService';
import { OnlineLLMService } from './services/OnlineLLMService';
import { TTSService } from './services/TTSService';
import { AudioRecordingService } from './services/AudioRecordingService';
import {
  AudioSessionManager,
  AudioBufferManager,
  VoiceActivityDetector,
} from './utils/audioUtils';

export class VoiceAgentImpl implements IVoiceAgent {
  private config: VoiceAgentConfig;
  private whisperService: WhisperService;
  private llamaService: LlamaService | OnlineLLMService;
  private ttsService: TTSService;
  private audioRecordingService: AudioRecordingService;
  private audioSessionManager: AudioSessionManager;
  private audioBuffer: AudioBufferManager;
  private vad?: VoiceActivityDetector;
  private store: any;
  private isRecording = false;
  private recordingTimeout?: NodeJS.Timeout;
  private subscribers = new Set<(state: VoiceAgentState) => void>();

  constructor(config: VoiceAgentConfig) {
    this.config = config;

    // Initialize services
    this.whisperService = new WhisperService({
      modelName: config.whisperModel.name,
      enableVAD: config.vadEnabled ?? true,
      language: 'en',
      enableGPUAcceleration: config.enableGPUAcceleration,
    });

    // Initialize LLM service based on configuration (skip for speech-only mode)
    if (config.llmConfig.model === 'tiny-placeholder') {
      // Speech-only mode - create a minimal dummy service
      this.llamaService = {
        initialize: async () => {},
        generateResponse: async () => '',
        dispose: async () => {},
        setSystemPrompt: () => {},
        clearHistory: () => {},
        getHistory: () => [],
        setMaxHistoryLength: () => {},
        updateModelSettings: async () => {},
        getModelInfo: () => ({
          name: 'speech-only',
          isLoaded: true,
          settings: {} as any,
        }),
        isReady: () => true,
        estimateTokenCount: () => 0,
        getStats: () => ({
          messageCount: 0,
          estimatedTokens: 0,
          historyLength: 0,
        }),
      } as any;
    } else if (config.llmConfig.provider === 'offline') {
      this.llamaService = new LlamaService({
        modelName: config.llmConfig.model,
        maxTokens: config.llmConfig.maxTokens || 256,
        temperature: config.llmConfig.temperature || 0.7,
        topP: config.llmConfig.topP || 0.9,
        enableGPUAcceleration:
          config.llmConfig.enableGPUAcceleration ??
          config.enableGPUAcceleration,
      });
    } else {
      this.llamaService = new OnlineLLMService(config.llmConfig);
    }

    this.ttsService = new TTSService({
      ...config.voiceSettings,
      interruptible: true,
    });

    this.audioRecordingService = new AudioRecordingService({
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      quality: 'medium',
    });

    this.audioSessionManager = AudioSessionManager.getInstance();
    this.audioBuffer = new AudioBufferManager(16000, 50);

    if (config.vadEnabled) {
      this.vad = new VoiceActivityDetector();
    }

    // Initialize Zustand store
    this.store = create<VoiceAgentStore>((set) => ({
      isListening: false,
      isThinking: false,
      isSpeaking: false,
      transcript: '',
      response: '',
      error: null,
      isInitialized: false,
      downloadProgress: undefined,
      setListening: (isListening) => set({ isListening }),
      setThinking: (isThinking) => set({ isThinking }),
      setSpeaking: (isSpeaking) => set({ isSpeaking }),
      setTranscript: (transcript) => set({ transcript }),
      setResponse: (response) => set({ response }),
      setError: (error) => set({ error }),
      setInitialized: (isInitialized) => set({ isInitialized }),
      setDownloadProgress: (downloadProgress) => set({ downloadProgress }),
    }));

    // Subscribe to store changes to notify subscribers
    this.store.subscribe((state: VoiceAgentState) => {
      this.subscribers.forEach((callback) => callback(state));
    });
  }

  async initialize(): Promise<void> {
    try {
      this.store.getState().setError(null);

      // Force garbage collection before initialization to free up memory
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }

      // Configure audio session
      await this.audioSessionManager.configureAudioSession({
        category: 'playAndRecord',
        mode: 'voiceChat',
        options: ['defaultToSpeaker', 'allowBluetooth'],
      });

      // Initialize services with download progress tracking
      const onDownloadProgress = (progress: ModelDownloadProgress) => {
        this.store.getState().setDownloadProgress(progress);
      };

      let whisperInitialized = false;

      try {
        await this.whisperService.initialize(onDownloadProgress);
        whisperInitialized = true;
      } catch (whisperError) {
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }

        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          await this.whisperService.initializeWithFallback();
          whisperInitialized = true;
        } catch (fallbackError) {
          this.store
            .getState()
            .setError('Voice input unavailable due to memory constraints.');
        }
      }

      try {
        await this.llamaService.initialize(
          this.config.systemPrompt,
          onDownloadProgress
        );
      } catch (llamaError) {
        if (this.config.llmConfig.provider !== 'offline') {
          throw new Error(
            `Online LLM service initialization failed: ${llamaError}`
          );
        }

        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }

        throw new Error(
          'LLM initialization failed due to insufficient memory. Try closing other apps or use online models instead.'
        );
      }

      // Initialize TTS (lightweight, should not fail)
      try {
        await this.ttsService.initialize();
      } catch (ttsError) {
        console.warn(
          'TTS initialization failed, continuing without speech output:',
          ttsError
        );
        // Continue without TTS - responses will be text-only
      }

      // Initialize audio recording (only if Whisper was successful)
      if (whisperInitialized) {
        try {
          await this.audioRecordingService.initialize();
        } catch (audioError) {
          console.warn('Audio recording initialization failed:', audioError);
          this.store
            .getState()
            .setError('Voice input unavailable due to audio system issues.');
        }
      }

      this.store.getState().setInitialized(true);
      this.store.getState().setDownloadProgress(undefined);

      // Final memory cleanup
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    } catch (error) {
      // Cleanup on failure
      try {
        await this.dispose();
      } catch (disposeError) {
        console.error(
          'Error during cleanup after initialization failure:',
          disposeError
        );
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown initialization error';
      this.store.getState().setError(errorMessage);
      throw error;
    }
  }

  async startListening(): Promise<void> {
    if (!this.store.getState().isInitialized) {
      throw new Error('VoiceAgent not initialized');
    }

    if (this.isRecording) {
      return;
    }

    try {
      this.store.getState().setError(null);
      this.store.getState().setListening(true);
      this.store.getState().setTranscript('');

      // Reset audio buffer and VAD
      this.audioBuffer.clear();
      this.vad?.reset();

      // Set up the callback for when recording completes (before retry loop)

      const callbackFunction = (audioData: Float32Array) => {
        try {
          // Don't clear buffer here - only add the complete recording data
          // The buffer was already cleared when startListening() was called
          this.audioBuffer.addBuffer(audioData);

          // Add a small delay to ensure all audio data is properly processed
          setTimeout(() => {
            this.processAccumulatedAudio();
          }, 50); // 50ms delay to ensure audio is fully processed
        } catch (error) {
          console.error('Error in audio callback:', error);
          this.store.getState().setError('Error processing audio callback');
        }
      };

      this.audioRecordingService.setOnAudioDataCallback(callbackFunction);

      // Start real audio recording with retry logic
      this.isRecording = true;

      let retryCount = 0;
      const maxRetries = 3;

      while (retryCount < maxRetries) {
        try {
          await this.audioRecordingService.startRecording(
            (audioData: Float32Array) => {
              // Real-time audio processing (for VAD only)
              if (this.vad) {
                const vadResult = this.vad.processSample(
                  audioData,
                  Date.now() / 1000
                );
                if (vadResult.speechEnd) {
                  this.stopListening();
                }
              }
            }
          );
          break; // Success, exit retry loop
        } catch (recordingError) {
          retryCount++;

          if (retryCount >= maxRetries) {
            throw recordingError;
          }

          // Wait briefly before retry
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Try to reinitialize audio session
          await this.audioRecordingService.dispose();
          await this.audioRecordingService.initialize();
        }
      }

      // Set a maximum recording time as fallback
      this.recordingTimeout = setTimeout(() => {
        if (this.isRecording) {
          this.stopListening();
        }
      }, 10000); // 10 seconds max
    } catch (error) {
      this.store.getState().setListening(false);
      this.isRecording = false;

      // More specific error messages
      let errorMessage = 'Failed to start listening';
      if (error instanceof Error) {
        if (error.message.includes('OSStatus error 1718449215')) {
          errorMessage = 'Audio format not supported. Try restarting the app.';
        } else if (error.message.includes('Permission')) {
          errorMessage =
            'Microphone permission required. Please check app settings.';
        } else {
          errorMessage = `Audio error: ${error.message}`;
        }
      }

      this.store.getState().setError(errorMessage);

      // Don't re-throw the error, just set error state
    }
  }

  stopListening(): void {
    if (!this.isRecording) {
      return;
    }

    this.isRecording = false;
    this.store.getState().setListening(false);

    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = undefined;
    }

    // Stop audio recording and process the file directly
    this.stopRecordingAndProcess();
  }

  private async stopRecordingAndProcess(): Promise<void> {
    try {
      // Stop the recording - AudioRecordingService will process the file and call our callback
      await this.audioRecordingService.stopRecording();

      // The callback will handle processing with a small delay
      // No need to force immediate garbage collection here as it might interfere with processing
    } catch (error) {
      this.store.getState().setError(`Processing failed: ${error}`);

      // Force cleanup on error only
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    }
  }

  async processAudio(audioData: number[]): Promise<string> {
    if (!this.store.getState().isInitialized) {
      throw new Error('VoiceAgent not initialized');
    }

    try {
      const audioFloat32 = new Float32Array(audioData);
      this.audioBuffer.addBuffer(audioFloat32);

      // Process with Whisper
      const transcript =
        await this.whisperService.transcribeAudio(audioFloat32);
      return transcript;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to process audio';
      this.store.getState().setError(errorMessage);
      throw error;
    }
  }

  private async processAccumulatedAudio(): Promise<void> {
    let audioData: Float32Array | null = null;

    try {
      audioData = this.audioBuffer.getConcatenatedBuffer();

      if (audioData.length === 0) {
        return;
      }

      // Check if Whisper is available (might have failed to initialize)
      if (!this.whisperService.isReady()) {
        this.store
          .getState()
          .setError('Voice processing unavailable. Whisper service not ready.');
        return;
      }

      this.store.getState().setThinking(true);

      // Force garbage collection before processing
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }

      // Transcribe audio with memory-safe error handling
      let transcript = '';
      try {
        transcript = await this.whisperService.transcribeAudio(audioData);
      } catch (transcriptionError) {
        console.error('Transcription failed:', transcriptionError);

        // Force cleanup and try to recover
        if (typeof global !== 'undefined' && global.gc) {
          global.gc();
        }

        this.store
          .getState()
          .setError('Voice transcription failed. Try speaking again.');
        return;
      }

      if (transcript.trim()) {
        this.store.getState().setTranscript(transcript);

        // Generate response with memory monitoring
        try {
          const response = await this.generateResponse(transcript);

          // Speak response if available
          if (response.trim()) {
            this.store.getState().setResponse(response);
            await this.speak(response);
          }
        } catch (responseError) {
          console.error('Response generation failed:', responseError);
          this.store
            .getState()
            .setError('Failed to generate response. Please try again.');
        }
      }

      this.store.getState().setThinking(false);

      // Clean up audio data reference
      audioData = null;

      // Force cleanup after processing
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    } catch (error) {
      this.store.getState().setThinking(false);

      // Clean up audio data reference on error
      audioData = null;

      // Force cleanup after error
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process accumulated audio';
      this.store.getState().setError(errorMessage);
    } finally {
      // Ensure audio data is cleaned up
      audioData = null;
    }
  }

  async generateResponse(transcript: string): Promise<string> {
    if (!this.store.getState().isInitialized) {
      throw new Error('VoiceAgent not initialized');
    }

    try {
      this.store.getState().setThinking(true);

      const response = await this.llamaService.generateResponse(transcript);
      this.store.getState().setResponse(response);

      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to generate response';
      this.store.getState().setError(errorMessage);
      throw error;
    } finally {
      this.store.getState().setThinking(false);
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.store.getState().isInitialized) {
      throw new Error('VoiceAgent not initialized');
    }

    try {
      this.store.getState().setSpeaking(true);
      await this.ttsService.speak(text);

      // In a real implementation, you would wait for TTS completion
      // For now, we'll simulate it
      setTimeout(() => {
        this.store.getState().setSpeaking(false);
      }, text.length * 50); // Rough estimate based on text length
    } catch (error) {
      this.store.getState().setSpeaking(false);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to speak';
      this.store.getState().setError(errorMessage);
      throw error;
    }
  }

  interruptSpeech(): void {
    if (this.store.getState().isSpeaking) {
      this.ttsService.stop();
      this.store.getState().setSpeaking(false);
    }
  }

  setSystemPrompt(prompt: string): void {
    this.config.systemPrompt = prompt;
    this.llamaService.setSystemPrompt(prompt);
  }

  clearHistory(): void {
    this.llamaService.clearHistory();
    this.store.getState().setTranscript('');
    this.store.getState().setResponse('');
  }

  getState(): VoiceAgentState {
    return this.store.getState();
  }

  subscribe(callback: (state: VoiceAgentState) => void): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  async dispose(): Promise<void> {
    try {
      // Stop any ongoing operations first
      this.stopListening();
      this.interruptSpeech();

      // Clear timeouts to prevent callbacks
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
        this.recordingTimeout = undefined;
      }

      // Clear audio buffer to free memory
      this.audioBuffer.clear();

      // Reset VAD state
      if (this.vad) {
        this.vad.reset();
      }

      // Dispose services with individual error handling to prevent double-free
      const disposePromises = [];

      // Dispose Whisper service
      if (this.whisperService) {
        disposePromises.push(
          this.whisperService.dispose().catch((error) => {
            console.error('Error disposing WhisperService:', error);
          })
        );
      }

      // Dispose LLM service
      if (this.llamaService) {
        disposePromises.push(
          this.llamaService.dispose().catch((error) => {
            console.error('Error disposing LlamaService:', error);
          })
        );
      }

      // Dispose TTS service
      if (this.ttsService) {
        disposePromises.push(
          this.ttsService.dispose().catch((error) => {
            console.error('Error disposing TTSService:', error);
          })
        );
      }

      // Dispose audio recording service
      if (this.audioRecordingService) {
        disposePromises.push(
          this.audioRecordingService.dispose().catch((error) => {
            console.error('Error disposing AudioRecordingService:', error);
          })
        );
      }

      // Wait for all disposals to complete
      await Promise.allSettled(disposePromises);

      // Deactivate audio session
      try {
        await this.audioSessionManager.deactivateSession();
      } catch (sessionError) {
        console.error('Error deactivating audio session:', sessionError);
      }

      // Clear subscribers
      this.subscribers.clear();

      // Reset state
      this.isRecording = false;

      // Force final garbage collection
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    } catch (error) {
      console.error('Error during VoiceAgent disposal:', error);

      // Ensure final garbage collection even on error
      if (typeof global !== 'undefined' && global.gc) {
        global.gc();
      }
    }
  }
}

export class VoiceAgentBuilderImpl implements VoiceAgentBuilder {
  private config: Partial<VoiceAgentConfig> = {
    enableGPUAcceleration: true,
    maxHistoryLength: 10,
    vadEnabled: true,
    systemPrompt:
      'You are a helpful AI assistant. Keep your responses concise and conversational.',
    voiceSettings: {
      rate: 0.5,
      pitch: 1.0,
      language: 'en-US',
    },
  };

  withWhisper(modelName: WhisperModel['name']): VoiceAgentBuilder {
    const models = WhisperService.getSupportedModels();
    const model = models.find((m) => m.name === modelName);

    if (!model) {
      throw new Error(`Unsupported Whisper model: ${modelName}`);
    }

    this.config.whisperModel = model;
    return this;
  }

  withLLM(llmConfig: LLMConfig): VoiceAgentBuilder {
    this.config.llmConfig = llmConfig;
    return this;
  }

  withSystemPrompt(prompt: string): VoiceAgentBuilder {
    this.config.systemPrompt = prompt;
    return this;
  }

  withVoiceSettings(settings: VoiceSettings): VoiceAgentBuilder {
    this.config.voiceSettings = { ...this.config.voiceSettings, ...settings };
    return this;
  }

  enableGPUAcceleration(enabled: boolean): VoiceAgentBuilder {
    this.config.enableGPUAcceleration = enabled;
    return this;
  }

  withMaxHistoryLength(length: number): VoiceAgentBuilder {
    this.config.maxHistoryLength = length;
    return this;
  }

  speechOnly(): VoiceAgentBuilder {
    // Set a minimal LLM config that won't be used
    this.config.llmConfig = {
      provider: 'offline',
      model: 'tiny-placeholder',
      maxTokens: 1,
      temperature: 0.1,
      topP: 0.1,
      enableGPUAcceleration: false,
    };
    this.config.systemPrompt = 'Speech recognition only mode.';
    return this;
  }

  enableVAD(enabled: boolean): VoiceAgentBuilder {
    this.config.vadEnabled = enabled;
    return this;
  }

  build(): IVoiceAgent {
    // Validate required configuration
    if (!this.config.whisperModel) {
      throw new Error(
        'Whisper model is required. Use withWhisper() to set it.'
      );
    }

    if (!this.config.llmConfig) {
      throw new Error(
        'LLM configuration is required. Use withLLM() to set it.'
      );
    }

    const finalConfig: VoiceAgentConfig = {
      whisperModel: this.config.whisperModel!,
      llmConfig: this.config.llmConfig!,
      systemPrompt: this.config.systemPrompt!,
      voiceSettings: this.config.voiceSettings!,
      enableGPUAcceleration: this.config.enableGPUAcceleration!,
      maxHistoryLength: this.config.maxHistoryLength,
      vadEnabled: this.config.vadEnabled,
    };

    return new VoiceAgentImpl(finalConfig);
  }
}

// Main export class with static factory method
export class VoiceAgent {
  static create(): VoiceAgentBuilder {
    return new VoiceAgentBuilderImpl();
  }
}
