import AudioRecorderPlayer, {
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
  AVLinearPCMBitDepthKeyIOSType,
} from 'react-native-audio-recorder-player';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { AudioSessionManager } from '../utils/audioUtils';
import { createServiceError } from '../types';

export interface AudioRecordingOptions {
  sampleRate: number;
  channels: number;
  bitsPerSample: number;
  quality: 'low' | 'medium' | 'high';
}

export class AudioRecordingService {
  private audioRecorderPlayer: typeof AudioRecorderPlayer;
  private audioSessionManager: AudioSessionManager;
  private isRecording = false;
  private isInitialized = false;
  private options: AudioRecordingOptions;
  private recordingPath: string;
  public onAudioDataCallback?: (audioData: Float32Array) => void;

  constructor(options: Partial<AudioRecordingOptions> = {}) {
    this.options = {
      sampleRate: 16000,
      channels: 1,
      bitsPerSample: 16,
      quality: 'medium',
      ...options,
    };
    // Use the singleton AudioRecorderPlayer instance
    this.audioRecorderPlayer = AudioRecorderPlayer;
    this.audioSessionManager = AudioSessionManager.getInstance();

    // Set recording path
    const fileName = 'voice_recording.wav';
    this.recordingPath =
      Platform.select({
        ios: `${RNFS.DocumentDirectoryPath}/${fileName}`,
        android: `${RNFS.CachesDirectoryPath}/${fileName}`,
      }) || `${RNFS.DocumentDirectoryPath}/${fileName}`;
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Configure audio session
      await this.audioSessionManager.configureAudioSession({
        category: 'playAndRecord',
        mode: 'voiceChat',
        options: ['defaultToSpeaker'],
      });

      this.isInitialized = true;
    } catch (error) {
      throw createServiceError(
        'audio',
        'AUDIO_RECORDING_INIT_FAILED',
        'Failed to initialize audio recording',
        error
      );
    }
  }

  async startRecording(
    _onAudioData: (audioData: Float32Array) => void
  ): Promise<void> {
    if (!this.isInitialized) {
      throw createServiceError(
        'audio',
        'AUDIO_NOT_INITIALIZED',
        'AudioRecordingService not initialized'
      );
    }

    if (this.isRecording) {
      return;
    }

    try {
      await this.audioSessionManager.activateSession();
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSampleRateAndroid: this.options.sampleRate,
        OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,

        AVFormatIDKeyIOS: 'lpcm' as const,
        AVSampleRateKeyIOS: this.options.sampleRate,
        AVNumberOfChannelsKeyIOS: this.options.channels,
        AVLinearPCMBitDepthKeyIOS: AVLinearPCMBitDepthKeyIOSType.bit16,
        AVLinearPCMIsBigEndianKeyIOS: false,
        AVLinearPCMIsFloatKeyIOS: false,
        AVLinearPCMIsNonInterleavedIOS: false,
      };

      await this.audioRecorderPlayer.startRecorder(
        this.recordingPath,
        audioSet
      );

      this.isRecording = true;

      this.audioRecorderPlayer.addRecordBackListener(() => {});
    } catch (error) {
      this.isRecording = false;
      throw createServiceError(
        'audio',
        'RECORDING_START_FAILED',
        'Failed to start recording',
        error
      );
    }
  }

  async stopRecording(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      // Stop recording
      await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      this.isRecording = false;

      // Process the recorded audio file
      // Always try to process if callback exists, regardless of result value
      if (this.onAudioDataCallback) {
        const audioData = await this.processRecordedFile(this.recordingPath);

        if (audioData.length > 0) {
          try {
            this.onAudioDataCallback(audioData);
          } catch (error) {
            console.error('Error in audio callback:', error);
          }
        }

        // Clean up recording file AFTER processing
        await this.cleanupRecordingFile();
      } else {
        await this.cleanupRecordingFile();
      }

      // Deactivate audio session
      await this.audioSessionManager.deactivateSession();
    } catch (error) {
      // Ensure cleanup even if errors occur
      await this.cleanupRecordingFile();
    }
  }

  private async processRecordedFile(filePath: string): Promise<Float32Array> {
    try {
      // Check if file exists
      if (!(await RNFS.exists(filePath))) {
        return new Float32Array(0);
      }

      // Get file stats
      const stats = await RNFS.stat(filePath);

      if (stats.size === 0) {
        return new Float32Array(0);
      }

      // Read the recorded audio file as base64
      const audioBase64 = await RNFS.readFile(filePath, 'base64');

      // Convert WAV/PCM data to Float32Array
      const audioData = this.base64ToFloat32Array(audioBase64);

      return audioData;
    } catch (error) {
      console.error('processRecordedFile: error processing file:', error);
      return new Float32Array(0);
    }
  }

  private async cleanupRecordingFile(): Promise<void> {
    try {
      if (await RNFS.exists(this.recordingPath)) {
        await RNFS.unlink(this.recordingPath);
      }
    } catch (error) {
      // Silent cleanup failure
    }
  }

  private base64ToFloat32Array(base64: string): Float32Array {
    try {
      // Limit processing to prevent OOM - max 5MB of audio data
      if (base64.length > 6_666_666) {
        // ~5MB when decoded
        console.warn('Audio file too large, truncating to prevent OOM');
        base64 = base64.substring(0, 6_666_666);
      }

      // Decode base64 to binary
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

  setOnAudioDataCallback(callback: (audioData: Float32Array) => void): void {
    this.onAudioDataCallback = callback;
  }

  getIsRecording(): boolean {
    return this.isRecording;
  }

  getRecordingPath(): string {
    return this.recordingPath;
  }

  async dispose(): Promise<void> {
    try {
      // Stop recording if active
      await this.stopRecording();

      // Remove any remaining listeners
      this.audioRecorderPlayer.removeRecordBackListener();

      // Clean up recording file
      await this.cleanupRecordingFile();

      // Clear callback reference
      this.onAudioDataCallback = undefined;

      this.isInitialized = false;
    } catch (error) {
      // Ensure state is reset even if cleanup fails
      this.isInitialized = false;
      this.isRecording = false;
      this.onAudioDataCallback = undefined;
    }
  }
}
