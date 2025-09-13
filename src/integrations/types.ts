export interface VideoRef {
  seek(time: number, tolerance?: number): void;
  pause(): void;
  resume(): void;
  setFullScreen(fullscreen: boolean): void;
  setVolume(volume: number): void;
  presentFullscreenPlayer(): void;
  dismissFullscreenPlayer(): void;
  getCurrentPosition(): Promise<number>;
}

/**
 * Slot types for different video control intents
 */
export interface SeekRelativeSlots {
  seconds: number;
}

export interface SeekAbsoluteSlots {
  timestamp: number;
}

export interface VolumeSetSlots {
  percent: number;
}

export interface SpeedSetSlots {
  rate: number;
}

export interface SubtitleLanguageSlots {
  lang: string;
}

export interface AudioTrackSlots {
  track: string;
}

export interface QualitySetSlots {
  quality: string;
}

export type VideoCommandSlots =
  | SeekRelativeSlots
  | SeekAbsoluteSlots
  | VolumeSetSlots
  | SpeedSetSlots
  | SubtitleLanguageSlots
  | AudioTrackSlots
  | QualitySetSlots
  | Record<string, never>; // For commands without slots

export interface VideoCommand {
  id: number;
  phrase: string;
  intent: VideoIntent;
  slots?: VideoCommandSlots;
}

export type VideoIntent =
  | 'PAUSE'
  | 'PLAY'
  | 'SEEK_REL'
  | 'SEEK_ABS'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'VOLUME_SET'
  | 'MUTE'
  | 'UNMUTE'
  | 'SPEED_SET'
  | 'SUBTITLES_ON'
  | 'SUBTITLES_OFF'
  | 'SUBTITLES_LANG_SET'
  | 'AUDIO_TRACK_SET'
  | 'QUALITY_SET'
  | 'FULLSCREEN_ENTER'
  | 'FULLSCREEN_EXIT'
  | 'NEXT'
  | 'PREVIOUS'
  | 'LOOP_ON'
  | 'LOOP_OFF'
  | 'SAVE'
  | 'DOWNLOAD_OFFLINE'
  | 'SKIP_INTRO'
  | 'SKIP_ADS'
  | 'GO_LIVE'
  | 'RESTART'
  | 'RESUME';

export interface IntentMatch {
  intent: VideoIntent;
  slots: VideoCommandSlots;
  phrase: string;
  confidence: number;
}

export interface VideoControlState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
}
