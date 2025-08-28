import { initWhisper } from 'whisper.rn';
import type { WhisperContext } from 'whisper.rn';
import type {
  WhisperOptions,
  WhisperModel,
  ModelDownloadProgress,
} from '../types';
import { createServiceError } from '../types';
import { ModelDownloader } from '../utils/modelDownloader';
import { VoiceActivityDetector } from '../utils/audioUtils';

export class WhisperService {
  private whisperInstance: WhisperContext | null = null;
  private isInitialized = false;
  private modelDownloader: ModelDownloader;
  private vad?: VoiceActivityDetector;
  private options: WhisperOptions;

  constructor(options: WhisperOptions) {
    this.options = options;
    this.modelDownloader = ModelDownloader.getInstance();

    if (options.enableVAD) {
      this.vad = new VoiceActivityDetector({
        sampleRate: 16000,
      });
    }
  }

  async initialize(
    onDownloadProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Download model if not present
      const modelPath = await this.modelDownloader.downloadWhisperModel(
        this.options.modelName,
        onDownloadProgress
      );

      // Validate model file
      const isValid = await this.modelDownloader.validateModel(modelPath);
      if (!isValid) {
        throw new Error('Downloaded Whisper model is corrupted');
      }

      // Initialize Whisper using the real whisper.rn API
      this.whisperInstance = await initWhisper({
        filePath: modelPath,
        isBundleAsset: false,
        useGpu: this.options.enableGPUAcceleration ?? true,
        useCoreMLIos: this.options.enableGPUAcceleration ?? true,
      });

      this.isInitialized = true;
    } catch (error) {
      throw createServiceError(
        'whisper',
        'WHISPER_INIT_FAILED',
        'Failed to initialize Whisper',
        error
      );
    }
  }

  async transcribeAudio(audioData: Float32Array): Promise<string> {
    if (!this.isInitialized || !this.whisperInstance) {
      throw createServiceError(
        'whisper',
        'WHISPER_NOT_INITIALIZED',
        'WhisperService not initialized'
      );
    }

    try {
      // Check if audio has sufficient amplitude (not silent)
      const avgAmplitude =
        audioData.reduce((sum, val) => sum + Math.abs(val), 0) /
        audioData.length;
      if (avgAmplitude < 0.0001) {
        return '';
      }

      // Apply VAD if enabled
      if (this.vad) {
        const vadResult = this.vad.processSample(audioData, Date.now());
        if (!vadResult.isSpeaking && !vadResult.speechEnd) {
          return '';
        }
      }

      // Convert Float32Array to 16-bit PCM data for whisper.rn
      const pcm16Data = new Int16Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        // Clamp to [-1, 1] and convert to 16-bit PCM
        const sample = Math.max(-1, Math.min(1, audioData[i] ?? 0));
        pcm16Data[i] = sample * 32767;
      }

      // Convert to base64 for whisper.rn transcribeData
      const uint8Array = new Uint8Array(pcm16Data.buffer);
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        const byte = uint8Array[i];
        if (byte !== undefined) {
          binary += String.fromCharCode(byte);
        }
      }
      const base64Audio = btoa(binary);

      // Transcribe audio using whisper.rn API with base64 string
      const { promise } = this.whisperInstance.transcribeData(base64Audio, {
        language: this.options.language || 'en',
        maxLen: 1,
        temperature: 0.0, // Use deterministic output for better consistency
      });

      const result = await promise;
      const transcript = result.result?.trim() || '';

      return transcript;
    } catch (error) {
      throw createServiceError(
        'whisper',
        'TRANSCRIPTION_FAILED',
        'Failed to transcribe audio',
        error
      );
    }
  }

  async transcribeFile(filePath: string): Promise<string> {
    if (!this.isInitialized || !this.whisperInstance) {
      throw createServiceError(
        'whisper',
        'WHISPER_NOT_INITIALIZED',
        'WhisperService not initialized'
      );
    }

    try {
      const { promise } = this.whisperInstance.transcribe(filePath, {
        language: this.options.language || 'en',
      });

      const result = await promise;
      return result.result?.trim() || '';
    } catch (error) {
      throw createServiceError(
        'whisper',
        'FILE_TRANSCRIPTION_FAILED',
        'Failed to transcribe file',
        error
      );
    }
  }

  async setLanguage(language: string): Promise<void> {
    this.options.language = language;

    // Language change will take effect on next transcription
  }

  enableVAD(enabled: boolean): void {
    if (enabled && !this.vad) {
      this.vad = new VoiceActivityDetector({
        sampleRate: 16000,
      });
    } else if (!enabled) {
      this.vad = undefined;
    }
    this.options.enableVAD = enabled;
  }

  configureVAD(options: {
    energyThreshold?: number;
    silenceThreshold?: number;
    minSpeechDuration?: number;
    maxSilenceDuration?: number;
  }): void {
    if (this.vad) {
      this.vad = new VoiceActivityDetector({
        ...options,
        sampleRate: 16000,
      });
    }
  }

  getModelInfo(): { name: WhisperModel['name']; isLoaded: boolean } {
    return {
      name: this.options.modelName,
      isLoaded: this.isInitialized,
    };
  }

  isReady(): boolean {
    return this.isInitialized && this.whisperInstance !== null;
  }

  async dispose(): Promise<void> {
    try {
      if (this.whisperInstance) {
        // Clean up Whisper instance using the proper whisper.rn API
        await this.whisperInstance.release();
        this.whisperInstance = null;
      }

      this.isInitialized = false;
      this.vad?.reset();
    } catch (error) {}
  }

  // Helper method to get supported models
  static getSupportedModels(): WhisperModel[] {
    return [
      { name: 'tiny.en', size: 39 * 1024 * 1024, accuracy: 94.3 },
      { name: 'base.en', size: 142 * 1024 * 1024, accuracy: 95.8 },
      { name: 'small.en', size: 466 * 1024 * 1024, accuracy: 96.7 },
      { name: 'medium.en', size: 1500 * 1024 * 1024, accuracy: 97.3 },
      { name: 'large-v2', size: 3000 * 1024 * 1024, accuracy: 98.1 },
      { name: 'large-v3', size: 3000 * 1024 * 1024, accuracy: 98.3 },
    ];
  }

  // Helper method to recommend model based on requirements
  static recommendModel(requirements: {
    prioritizeSpeed?: boolean;
    prioritizeAccuracy?: boolean;
    maxSize?: number;
  }): WhisperModel {
    const models = WhisperService.getSupportedModels();

    if (requirements.maxSize) {
      const filteredModels = models.filter(
        (m) => m.size <= requirements.maxSize!
      );
      if (filteredModels.length === 0) {
        throw new Error(
          `No models available under ${requirements.maxSize} bytes`
        );
      }
    }

    if (requirements.prioritizeSpeed) {
      return models[0]!; // tiny.en - fastest
    }

    if (requirements.prioritizeAccuracy) {
      return models[models.length - 1]!; // large-v3 - most accurate
    }

    // Default recommendation: good balance of speed and accuracy
    const defaultModel = models.find((m) => m.name === 'base.en') || models[1];
    if (!defaultModel) {
      throw new Error('No suitable model found');
    }
    return defaultModel;
  }
}
