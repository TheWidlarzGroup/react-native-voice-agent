import { Platform } from 'react-native';
import type { AudioSessionConfig } from '../types';

export class AudioSessionManager {
  private static instance: AudioSessionManager;
  private isSessionActive = false;

  static getInstance(): AudioSessionManager {
    if (!AudioSessionManager.instance) {
      AudioSessionManager.instance = new AudioSessionManager();
    }
    return AudioSessionManager.instance;
  }

  async configureAudioSession(_config: AudioSessionConfig): Promise<void> {
    try {
      // Temporary fix: Skip audio session configuration to avoid conflicts with react-native-video
      // The react-native-audio-recorder-player will handle its own audio session
      console.log(
        '🔇 Skipping audio session configuration to avoid conflicts with video player'
      );
      this.isSessionActive = true;
    } catch (error) {
      throw new Error(`Failed to configure audio session: ${error}`);
    }
  }

  async activateSession(): Promise<void> {
    if (!this.isSessionActive) {
      throw new Error(
        'Audio session not configured. Call configureAudioSession first.'
      );
    }

    try {
      // Temporary fix: Skip audio session activation to avoid conflicts
      console.log(
        '🔇 Skipping audio session activation to avoid conflicts with video player'
      );
    } catch (error) {
      throw new Error(`Failed to activate audio session: ${error}`);
    }
  }

  async deactivateSession(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
      } else if (Platform.OS === 'android') {
      }
      this.isSessionActive = false;
    } catch (error) {}
  }

  isActive(): boolean {
    return this.isSessionActive;
  }
}

export class AudioBufferManager {
  private buffers: Float32Array[] = [];
  private maxBuffers = 10;
  private sampleRate = 16000;
  private maxTotalSamples = 16000 * 30; // 30 seconds max to prevent OOM

  constructor(sampleRate = 16000, maxBuffers = 10) {
    this.sampleRate = sampleRate;
    this.maxBuffers = maxBuffers;
    this.maxTotalSamples = sampleRate * 30; // 30 seconds max
  }

  addBuffer(buffer: Float32Array): void {
    if (buffer.length === 0) {
      return;
    }

    // Create a copy to prevent memory references
    const bufferCopy = new Float32Array(buffer);
    this.buffers.push(bufferCopy);

    // Remove old buffers if exceeding max count
    while (this.buffers.length > this.maxBuffers) {
      this.buffers.shift();
    }

    // Remove old buffers if exceeding max total samples (memory limit)
    let totalSamples = this.getTotalSamples();
    while (totalSamples > this.maxTotalSamples && this.buffers.length > 1) {
      this.buffers.shift();
      totalSamples = this.getTotalSamples();
    }
  }

  getBuffers(): Float32Array[] {
    return [...this.buffers];
  }

  getConcatenatedBuffer(): Float32Array {
    if (this.buffers.length === 0) {
      return new Float32Array(0);
    }

    const totalLength = this.getTotalSamples();

    // Prevent creating massive arrays that could cause OOM
    if (totalLength > this.maxTotalSamples) {
      console.warn('Audio buffer too large, truncating to prevent OOM');
      return this.getTruncatedBuffer();
    }

    const result = new Float32Array(totalLength);

    let offset = 0;
    for (const buffer of this.buffers) {
      if (offset + buffer.length <= result.length) {
        result.set(buffer, offset);
        offset += buffer.length;
      } else {
        // Truncate if we exceed the result array length
        const remainingSpace = result.length - offset;
        result.set(buffer.subarray(0, remainingSpace), offset);
        break;
      }
    }

    return result;
  }

  private getTotalSamples(): number {
    return this.buffers.reduce((sum, buffer) => sum + buffer.length, 0);
  }

  private getTruncatedBuffer(): Float32Array {
    // Return the last N seconds of audio to stay within memory limits
    const result = new Float32Array(this.maxTotalSamples);
    let resultOffset = 0;
    let remainingSpace = this.maxTotalSamples;

    // Start from the end and work backwards
    for (let i = this.buffers.length - 1; i >= 0 && remainingSpace > 0; i--) {
      const buffer = this.buffers[i];
      if (!buffer) continue;

      const samplesFromThisBuffer = Math.min(remainingSpace, buffer.length);
      const startIdx = buffer.length - samplesFromThisBuffer;

      // Insert at the beginning of result array (since we're going backwards)
      result.set(
        buffer.subarray(startIdx),
        this.maxTotalSamples - resultOffset - samplesFromThisBuffer
      );

      resultOffset += samplesFromThisBuffer;
      remainingSpace -= samplesFromThisBuffer;
    }

    // Return only the portion that contains data
    return result.subarray(this.maxTotalSamples - resultOffset);
  }

  clear(): void {
    // Clear references to help garbage collection
    this.buffers.length = 0;
    this.buffers = [];

    // Force garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }

  getSampleRate(): number {
    return this.sampleRate;
  }

  getDuration(): number {
    const totalSamples = this.getTotalSamples();
    return totalSamples / this.sampleRate;
  }

  getMemoryUsage(): {
    bufferCount: number;
    totalSamples: number;
    memoryMB: number;
  } {
    const totalSamples = this.getTotalSamples();
    const memoryBytes = totalSamples * 4; // 4 bytes per Float32
    const memoryMB = memoryBytes / (1024 * 1024);

    return {
      bufferCount: this.buffers.length,
      totalSamples,
      memoryMB: Math.round(memoryMB * 100) / 100,
    };
  }
}

export class VoiceActivityDetector {
  private energyThreshold = 0.001;
  private silenceThreshold = 0.0005;
  private minSpeechDuration = 0.5; // seconds
  private maxSilenceDuration = 2.0; // seconds
  private speechStartTime = 0;
  private silenceStartTime = 0;
  private isSpeaking = false;
  private sampleRate = 16000;

  constructor(
    options: {
      energyThreshold?: number;
      silenceThreshold?: number;
      minSpeechDuration?: number;
      maxSilenceDuration?: number;
      sampleRate?: number;
    } = {}
  ) {
    this.energyThreshold = options.energyThreshold ?? this.energyThreshold;
    this.silenceThreshold = options.silenceThreshold ?? this.silenceThreshold;
    this.minSpeechDuration =
      options.minSpeechDuration ?? this.minSpeechDuration;
    this.maxSilenceDuration =
      options.maxSilenceDuration ?? this.maxSilenceDuration;
    this.sampleRate = options.sampleRate ?? this.sampleRate;
  }

  private calculateEnergy(buffer: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < buffer.length; i++) {
      const sample = buffer[i] || 0;
      energy += sample * sample;
    }
    return energy / buffer.length;
  }

  processSample(
    buffer: Float32Array,
    timestamp: number
  ): {
    isSpeaking: boolean;
    speechStart: boolean;
    speechEnd: boolean;
  } {
    const energy = this.calculateEnergy(buffer);
    const currentTime = timestamp;

    let speechStart = false;
    let speechEnd = false;

    if (energy > this.energyThreshold) {
      if (!this.isSpeaking) {
        this.speechStartTime = currentTime;
        speechStart = true;
        this.isSpeaking = true;
      }
      this.silenceStartTime = 0;
    } else if (energy < this.silenceThreshold) {
      if (this.isSpeaking) {
        if (this.silenceStartTime === 0) {
          this.silenceStartTime = currentTime;
        } else if (
          currentTime - this.silenceStartTime >
          this.maxSilenceDuration
        ) {
          if (currentTime - this.speechStartTime > this.minSpeechDuration) {
            speechEnd = true;
          }
          this.isSpeaking = false;
          this.speechStartTime = 0;
          this.silenceStartTime = 0;
        }
      }
    }

    return {
      isSpeaking: this.isSpeaking,
      speechStart,
      speechEnd,
    };
  }

  reset(): void {
    this.isSpeaking = false;
    this.speechStartTime = 0;
    this.silenceStartTime = 0;
  }

  setThresholds(energy: number, silence: number): void {
    this.energyThreshold = energy;
    this.silenceThreshold = silence;
  }
}

export const audioUtils = {
  convertPCMToFloat32(pcmData: Int16Array): Float32Array {
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      const sample = pcmData[i];
      if (sample !== undefined) {
        floatData[i] = sample / 32768.0;
      }
    }
    return floatData;
  },

  convertFloat32ToPCM(floatData: Float32Array): Int16Array {
    const pcmData = new Int16Array(floatData.length);
    for (let i = 0; i < floatData.length; i++) {
      const inputSample = floatData[i];
      if (inputSample !== undefined) {
        const sample = Math.max(-1, Math.min(1, inputSample));
        pcmData[i] = sample * 32767;
      }
    }
    return pcmData;
  },

  resampleAudio(
    inputBuffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number
  ): Float32Array {
    if (inputSampleRate === outputSampleRate) {
      return inputBuffer;
    }

    const ratio = inputSampleRate / outputSampleRate;
    const outputLength = Math.round(inputBuffer.length / ratio);
    const outputBuffer = new Float32Array(outputLength);

    for (let i = 0; i < outputLength; i++) {
      const index = i * ratio;
      const indexFloor = Math.floor(index);
      const indexCeil = Math.min(indexFloor + 1, inputBuffer.length - 1);
      const fraction = index - indexFloor;

      const leftSample = inputBuffer[indexFloor] || 0;
      const rightSample = inputBuffer[indexCeil] || 0;

      outputBuffer[i] = leftSample * (1 - fraction) + rightSample * fraction;
    }

    return outputBuffer;
  },

  normalizeAudio(buffer: Float32Array): Float32Array {
    let maxValue = 0;
    for (let i = 0; i < buffer.length; i++) {
      const sample = buffer[i] || 0;
      maxValue = Math.max(maxValue, Math.abs(sample));
    }

    if (maxValue === 0) {
      return buffer;
    }

    const normalized = new Float32Array(buffer.length);
    const scale = 0.95 / maxValue;

    for (let i = 0; i < buffer.length; i++) {
      const sample = buffer[i] || 0;
      normalized[i] = sample * scale;
    }

    return normalized;
  },
};
