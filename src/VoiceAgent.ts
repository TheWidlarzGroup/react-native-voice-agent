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
} from './types';
import { WhisperService } from './services/WhisperService';
import { LlamaService } from './services/LlamaService';
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
  private llamaService: LlamaService;
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

    this.llamaService = new LlamaService({
      modelName: config.llamaModel.name,
      maxTokens: 256,
      temperature: 0.7,
      topP: 0.9,
      enableGPUAcceleration: config.enableGPUAcceleration,
    });

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

      // Initialize Whisper
      await this.whisperService.initialize(onDownloadProgress);

      // Initialize Llama
      await this.llamaService.initialize(
        this.config.systemPrompt,
        onDownloadProgress
      );

      // Initialize TTS
      await this.ttsService.initialize();

      // Initialize audio recording
      await this.audioRecordingService.initialize();

      this.store.getState().setInitialized(true);
      this.store.getState().setDownloadProgress(undefined);
    } catch (error) {
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
          // Clear the real-time buffer and add the complete recording
          this.audioBuffer.clear();
          this.audioBuffer.addBuffer(audioData);

          // Process immediately
          this.processAccumulatedAudio();
        } catch (error) {
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
      // Stop the recording
      await this.audioRecordingService.stopRecording();

      // Wait a brief moment for the file to be written
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Process the recorded file directly
      const recordingPath = this.audioRecordingService.getRecordingPath();

      if (recordingPath) {
        // Use the same processing logic from AudioRecordingService
        const audioData = await this.processRecordedFileDirect(recordingPath);
        if (audioData.length > 0) {
          // Clear the buffer and add the processed audio
          this.audioBuffer.clear();
          this.audioBuffer.addBuffer(audioData);

          // Process immediately
          await this.processAccumulatedAudio();
        }
      }
    } catch (error) {
      this.store.getState().setError(`Processing failed: ${error}`);
    }
  }

  private async processRecordedFileDirect(
    filePath: string
  ): Promise<Float32Array> {
    try {
      const RNFS = require('react-native-fs');

      // Check if file exists
      const exists = await RNFS.exists(filePath);
      if (!exists) {
        return new Float32Array(0);
      }

      // Read the recorded audio file as base64
      const audioBase64 = await RNFS.readFile(filePath, 'base64');

      // Convert WAV/PCM data to Float32Array (same logic as AudioRecordingService)
      const audioData = this.base64ToFloat32Array(audioBase64);

      // Clean up the temporary file
      if (await RNFS.exists(filePath)) {
        await RNFS.unlink(filePath);
      }

      return audioData;
    } catch (error) {
      return new Float32Array(0);
    }
  }

  private base64ToFloat32Array(base64: string): Float32Array {
    try {
      // Same conversion logic as AudioRecordingService
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Skip WAV header (typically 44 bytes) if present
      let dataStart = 0;
      if (
        bytes.length > 44 &&
        bytes[0] === 0x52 &&
        bytes[1] === 0x49 &&
        bytes[2] === 0x46 &&
        bytes[3] === 0x46
      ) {
        dataStart = 44;
      }

      // Convert bytes to 16-bit PCM samples
      const sampleData = bytes.slice(dataStart);
      const samples = new Int16Array(
        sampleData.buffer,
        sampleData.byteOffset,
        sampleData.length / 2
      );

      // Convert to Float32Array normalized to [-1, 1]
      const floatSamples = new Float32Array(samples.length);
      for (let i = 0; i < samples.length; i++) {
        floatSamples[i] = (samples[i] ?? 0) / 32768.0;
      }

      return floatSamples;
    } catch (error) {
      return new Float32Array(0);
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
    try {
      const audioData = this.audioBuffer.getConcatenatedBuffer();

      if (audioData.length === 0) {
        return;
      }

      this.store.getState().setThinking(true);

      // Transcribe audio
      const transcript = await this.whisperService.transcribeAudio(audioData);

      if (transcript.trim()) {
        this.store.getState().setTranscript(transcript);

        // Generate response
        const response = await this.generateResponse(transcript);

        // Speak response
        if (response.trim()) {
          this.store.getState().setResponse(response);
          await this.speak(response);
        }
      }

      this.store.getState().setThinking(false);
    } catch (error) {
      this.store.getState().setThinking(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to process accumulated audio';
      this.store.getState().setError(errorMessage);
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
      // Stop any ongoing operations
      this.stopListening();
      this.interruptSpeech();

      // Clear timeouts
      if (this.recordingTimeout) {
        clearTimeout(this.recordingTimeout);
      }

      // Dispose services
      await Promise.all([
        this.whisperService.dispose(),
        this.llamaService.dispose(),
        this.ttsService.dispose(),
        this.audioRecordingService.dispose(),
      ]);

      // Deactivate audio session
      await this.audioSessionManager.deactivateSession();

      // Clear subscribers
      this.subscribers.clear();
    } catch (error) {}
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

  withLlama(modelName: string): VoiceAgentBuilder {
    // For now, we'll create a basic model configuration
    // In a real implementation, you might want to validate against supported models
    this.config.llamaModel = {
      name: modelName,
      size: 1800 * 1024 * 1024, // 1.8GB estimate
      quantization: 'Q4_K_M',
    };
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

    if (!this.config.llamaModel) {
      throw new Error('Llama model is required. Use withLlama() to set it.');
    }

    const finalConfig: VoiceAgentConfig = {
      whisperModel: this.config.whisperModel!,
      llamaModel: this.config.llamaModel!,
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
