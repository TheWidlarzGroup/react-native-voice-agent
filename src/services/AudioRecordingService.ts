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
    onAudioData: (audioData: Float32Array) => void
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
      this.onAudioDataCallback = onAudioData;

      // Activate audio session
      await this.audioSessionManager.activateSession();

      // Configure recording options
      const audioSet = {
        AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
        AudioSampleRateAndroid: this.options.sampleRate,
        OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
        AudioSourceAndroid: AudioSourceAndroidType.MIC,

        // iOS WAV/LPCM settings for better compatibility
        AVFormatIDKeyIOS: 'lpcm' as const,
        AVSampleRateKeyIOS: this.options.sampleRate,
        AVNumberOfChannelsKeyIOS: this.options.channels,
        AVLinearPCMBitDepthKeyIOS: AVLinearPCMBitDepthKeyIOSType.bit16,
        AVLinearPCMIsBigEndianKeyIOS: false,
        AVLinearPCMIsFloatKeyIOS: false,
        AVLinearPCMIsNonInterleavedIOS: false,
      };

      // Start recording
      await this.audioRecorderPlayer.startRecorder(
        this.recordingPath,
        audioSet
      );

      this.isRecording = true;

      // Set up recording progress listener
      this.audioRecorderPlayer.addRecordBackListener(() => {
        // Audio will be processed after recording is complete
      });
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
      const result = await this.audioRecorderPlayer.stopRecorder();
      this.audioRecorderPlayer.removeRecordBackListener();
      this.isRecording = false;

      // Process the recorded audio file

      if (this.onAudioDataCallback && result) {
        const audioData = await this.processRecordedFile(this.recordingPath);
        try {
          this.onAudioDataCallback(audioData);
        } catch (error) {
          // Silently handle callback errors to prevent service disruption
        }
      }

      // Deactivate audio session
      await this.audioSessionManager.deactivateSession();
    } catch (error) {}
  }

  private async processRecordedFile(filePath: string): Promise<Float32Array> {
    try {
      // Read the recorded audio file as base64
      const audioBase64 = await RNFS.readFile(filePath, 'base64');

      // Convert WAV/PCM data to Float32Array
      const audioData = this.base64ToFloat32Array(audioBase64);

      // Clean up temporary file if no callback is set
      if (!this.onAudioDataCallback && (await RNFS.exists(filePath))) {
        await RNFS.unlink(filePath);
      }

      return audioData;
    } catch (error) {
      return new Float32Array(0);
    }
  }

  private base64ToFloat32Array(base64: string): Float32Array {
    try {
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
    await this.stopRecording();
    this.isInitialized = false;
  }
}
