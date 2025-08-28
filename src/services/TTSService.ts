import Tts from 'react-native-tts';
import { Platform } from 'react-native';
import type { VoiceSettings, TTSOptions, NativeTTSVoice } from '../types';
import { createServiceError } from '../types';
import { AudioSessionManager } from '../utils/audioUtils';

export interface Voice {
  id: string;
  name: string;
  language: string;
  quality: 'low' | 'normal' | 'high' | 'enhanced';
  networkConnectionRequired?: boolean;
}

export class TTSService {
  private isInitialized = false;
  private audioSessionManager: AudioSessionManager;
  private options: TTSOptions;
  private availableVoices: Voice[] = [];
  private selectedVoice: Voice | null = null;
  private isSpeaking = false;

  constructor(options: TTSOptions = { interruptible: true }) {
    this.options = {
      rate: 0.5,
      pitch: 1.0,
      language: 'en-US',
      ...options,
    };
    this.audioSessionManager = AudioSessionManager.getInstance();
    this.setupTtsListeners();
  }

  private setupTtsListeners(): void {
    Tts.addEventListener('tts-start', () => {
      this.isSpeaking = true;
    });

    Tts.addEventListener('tts-finish', () => {
      this.isSpeaking = false;
    });

    Tts.addEventListener('tts-cancel', () => {
      this.isSpeaking = false;
    });

    // Errors will be handled via try/catch in speak method
  }

  async initialize(): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      // Configure audio session for speech
      await this.audioSessionManager.configureAudioSession({
        category: 'playAndRecord',
        mode: 'voiceChat',
        options: ['defaultToSpeaker', 'allowBluetooth'],
      });

      // Initialize TTS
      await this.initializeTts();

      // Load available voices
      await this.loadAvailableVoices();

      // Select best voice
      await this.selectBestVoice();

      this.isInitialized = true;
    } catch (error) {
      throw createServiceError(
        'tts',
        'TTS_INIT_FAILED',
        'Failed to initialize TTS',
        error
      );
    }
  }

  private async initializeTts(): Promise<void> {
    try {
      if (this.options.language) {
        await Tts.setDefaultLanguage(this.options.language);
      }
    } catch (error) {}

    if (this.options.language) {
      await Tts.setDefaultLanguage(this.options.language);
    }

    // Platform-specific initialization
    if (Platform.OS === 'android') {
      // Request TTS engine initialization
      const isInitialized = await Tts.getInitStatus();
      if (!isInitialized) {
        await Tts.requestInstallEngine();
      }
    }
  }

  private async loadAvailableVoices(): Promise<void> {
    try {
      const voices = await Tts.voices();

      this.availableVoices = voices.map((voice: NativeTTSVoice) => ({
        id: voice.id,
        name: voice.name,
        language: voice.language,
        quality: this.determineVoiceQuality(voice),
        networkConnectionRequired: voice.networkConnectionRequired,
      }));
    } catch (error) {
      this.availableVoices = [];
    }
  }

  private determineVoiceQuality(voice: NativeTTSVoice): Voice['quality'] {
    // Heuristics to determine voice quality based on voice properties
    const name = voice.name?.toLowerCase() || '';

    if (
      name.includes('enhanced') ||
      name.includes('premium') ||
      name.includes('neural')
    ) {
      return 'enhanced';
    }

    if (name.includes('compact') || name.includes('low')) {
      return 'low';
    }

    if (voice.networkConnectionRequired) {
      return 'high';
    }

    return 'normal';
  }

  private async selectBestVoice(): Promise<void> {
    if (this.availableVoices.length === 0) {
      return;
    }

    // Filter voices by language preference
    const languageCode = this.options.language?.split('-')[0] || 'en';
    const matchingVoices = this.availableVoices.filter((voice) =>
      voice.language.toLowerCase().includes(languageCode)
    );

    const voicesToConsider =
      matchingVoices.length > 0 ? matchingVoices : this.availableVoices;

    // Prefer high-quality offline voices
    const sortedVoices = voicesToConsider.sort((a, b) => {
      // Prioritize offline voices
      if (a.networkConnectionRequired !== b.networkConnectionRequired) {
        return a.networkConnectionRequired ? 1 : -1;
      }

      // Prioritize higher quality
      const qualityOrder = { enhanced: 4, high: 3, normal: 2, low: 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    });

    this.selectedVoice = sortedVoices[0] || null;

    if (this.selectedVoice) {
      await Tts.setDefaultVoice(this.selectedVoice.id);
    }
  }

  async speak(text: string): Promise<void> {
    if (!this.isInitialized) {
      throw createServiceError(
        'tts',
        'TTS_NOT_INITIALIZED',
        'TTSService not initialized'
      );
    }

    if (!text.trim()) {
      return;
    }

    try {
      // Stop any ongoing speech if interruptible
      if (this.isSpeaking && this.options.interruptible) {
        await this.stop();
      }

      // Configure and activate audio session for TTS
      await this.audioSessionManager.configureAudioSession({
        category: 'playAndRecord',
        mode: 'voiceChat',
        options: ['defaultToSpeaker', 'allowBluetooth'],
      });

      await this.audioSessionManager.activateSession();

      // Start speaking
      const speakOptions: any = {
        androidParams: {
          KEY_PARAM_PAN: 0,
          KEY_PARAM_VOLUME: 1.0,
          KEY_PARAM_STREAM: 'STREAM_MUSIC',
        },
        rate: this.options.rate || 0.5, // Set rate per speech
        pitch: this.options.pitch || 1.0, // Set pitch per speech
      };

      if (this.selectedVoice?.id) {
        speakOptions.iosVoiceId = this.selectedVoice.id;
      }

      await Tts.speak(text, speakOptions);
    } catch (error) {
      this.isSpeaking = false;

      throw createServiceError(
        'tts',
        'SPEECH_FAILED',
        'Failed to speak text',
        error
      );
    }
  }

  async stop(): Promise<void> {
    try {
      if (this.isSpeaking) {
        await Tts.stop();
        this.isSpeaking = false;
      }
    } catch (error) {}
  }

  async pause(): Promise<void> {
    try {
      if (this.isSpeaking && Platform.OS === 'ios') {
        // Android doesn't support pause/resume
        await Tts.pause();
      }
    } catch (error) {}
  }

  async resume(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Tts.resume();
      }
    } catch (error) {}
  }

  async updateSettings(settings: Partial<VoiceSettings>): Promise<void> {
    this.options = { ...this.options, ...settings };

    try {
      if (settings.rate !== undefined) {
        await Tts.setDefaultRate(settings.rate);
      }

      if (settings.pitch !== undefined) {
        await Tts.setDefaultPitch(settings.pitch);
      }

      if (settings.language !== undefined) {
        await Tts.setDefaultLanguage(settings.language);
        // Re-select best voice for new language
        await this.selectBestVoice();
      }

      if (settings.voice !== undefined) {
        const voice = this.availableVoices.find((v) => v.id === settings.voice);
        if (voice) {
          this.selectedVoice = voice;
          await Tts.setDefaultVoice(voice.id);
        }
      }
    } catch (error) {}
  }

  getAvailableVoices(): Voice[] {
    return [...this.availableVoices];
  }

  getCurrentVoice(): Voice | null {
    return this.selectedVoice;
  }

  isSpeechActive(): boolean {
    return this.isSpeaking;
  }

  getSettings(): TTSOptions {
    return { ...this.options };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async dispose(): Promise<void> {
    try {
      // Stop any ongoing speech
      await this.stop();

      // Remove event listeners
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
      Tts.removeAllListeners('tts-error');

      this.isInitialized = false;
      this.availableVoices = [];
      this.selectedVoice = null;
    } catch (error) {}
  }

  // Helper methods for voice management
  async setVoiceByLanguage(languageCode: string): Promise<boolean> {
    const matchingVoices = this.availableVoices.filter((voice) =>
      voice.language.toLowerCase().includes(languageCode.toLowerCase())
    );

    if (matchingVoices.length === 0) {
      return false;
    }

    // Select the best quality voice for this language
    const bestVoice = matchingVoices.sort((a, b) => {
      const qualityOrder = { enhanced: 4, high: 3, normal: 2, low: 1 };
      return qualityOrder[b.quality] - qualityOrder[a.quality];
    })[0];

    if (bestVoice) {
      this.selectedVoice = bestVoice;
      await Tts.setDefaultVoice(bestVoice.id);
    }
    return true;
  }

  getVoicesByLanguage(languageCode: string): Voice[] {
    return this.availableVoices.filter((voice) =>
      voice.language.toLowerCase().includes(languageCode.toLowerCase())
    );
  }

  async testVoice(
    voiceId: string,
    testText: string = 'Hello, this is a test.'
  ): Promise<void> {
    const previousVoice = this.selectedVoice;

    try {
      const testVoice = this.availableVoices.find((v) => v.id === voiceId);
      if (!testVoice) {
        throw new Error('Voice not found');
      }

      this.selectedVoice = testVoice;
      await Tts.setDefaultVoice(voiceId);
      await this.speak(testText);
    } finally {
      // Restore previous voice
      if (previousVoice) {
        this.selectedVoice = previousVoice;
        await Tts.setDefaultVoice(previousVoice.id);
      }
    }
  }
}
