import type { VoiceAgent } from '../types';

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

export interface VideoCommand {
  id: number;
  phrase: string;
  intent: VideoIntent;
  slots?: Record<string, any>;
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
  slots: Record<string, any>;
  phrase: string;
  confidence: number;
}

const VIDEO_COMMANDS: VideoCommand[] = [
  { id: 1, phrase: 'pause', intent: 'PAUSE' },
  { id: 2, phrase: 'stop', intent: 'PAUSE' },
  { id: 3, phrase: 'play', intent: 'PLAY' },
  { id: 4, phrase: 'resume', intent: 'PLAY' },
  {
    id: 5,
    phrase: 'rewind 10 seconds',
    intent: 'SEEK_REL',
    slots: { seconds: -10 },
  },
  { id: 6, phrase: 'back ten', intent: 'SEEK_REL', slots: { seconds: -10 } },
  {
    id: 7,
    phrase: 'skip back 30',
    intent: 'SEEK_REL',
    slots: { seconds: -30 },
  },
  {
    id: 8,
    phrase: 'forward one minute',
    intent: 'SEEK_REL',
    slots: { seconds: 60 },
  },
  {
    id: 9,
    phrase: 'skip ahead 10',
    intent: 'SEEK_REL',
    slots: { seconds: 10 },
  },
  {
    id: 10,
    phrase: 'go to two minutes',
    intent: 'SEEK_ABS',
    slots: { timestamp: 120 },
  },
  {
    id: 11,
    phrase: 'go to 10:00',
    intent: 'SEEK_ABS',
    slots: { timestamp: 600 },
  },
  { id: 12, phrase: 'volume up', intent: 'VOLUME_UP' },
  { id: 13, phrase: 'volume down', intent: 'VOLUME_DOWN' },
  {
    id: 14,
    phrase: 'set volume to 20 percent',
    intent: 'VOLUME_SET',
    slots: { percent: 20 },
  },
  {
    id: 15,
    phrase: 'set volume to 80 percent',
    intent: 'VOLUME_SET',
    slots: { percent: 80 },
  },
  { id: 16, phrase: 'mute', intent: 'MUTE' },
  { id: 17, phrase: 'unmute', intent: 'UNMUTE' },
  { id: 18, phrase: '1.25x', intent: 'SPEED_SET', slots: { rate: 1.25 } },
  { id: 19, phrase: '1.5x', intent: 'SPEED_SET', slots: { rate: 1.5 } },
  { id: 20, phrase: '2x', intent: 'SPEED_SET', slots: { rate: 2.0 } },
  { id: 21, phrase: 'normal speed', intent: 'SPEED_SET', slots: { rate: 1.0 } },
  { id: 22, phrase: 'subtitles on', intent: 'SUBTITLES_ON' },
  { id: 23, phrase: 'subtitles off', intent: 'SUBTITLES_OFF' },
  {
    id: 24,
    phrase: 'english subtitles',
    intent: 'SUBTITLES_LANG_SET',
    slots: { lang: 'en' },
  },
  {
    id: 25,
    phrase: 'audio original',
    intent: 'AUDIO_TRACK_SET',
    slots: { track: 'original' },
  },
  {
    id: 26,
    phrase: 'audio stereo',
    intent: 'AUDIO_TRACK_SET',
    slots: { track: 'stereo' },
  },
  {
    id: 27,
    phrase: 'quality 1080p',
    intent: 'QUALITY_SET',
    slots: { quality: '1080p' },
  },
  {
    id: 28,
    phrase: 'quality 720p',
    intent: 'QUALITY_SET',
    slots: { quality: '720p' },
  },
  {
    id: 29,
    phrase: 'highest quality',
    intent: 'QUALITY_SET',
    slots: { quality: 'auto_high' },
  },
  {
    id: 30,
    phrase: 'lower quality',
    intent: 'QUALITY_SET',
    slots: { quality: 'auto_low' },
  },
  { id: 31, phrase: 'fullscreen', intent: 'FULLSCREEN_ENTER' },
  { id: 32, phrase: 'exit fullscreen', intent: 'FULLSCREEN_EXIT' },
  { id: 33, phrase: 'next video', intent: 'NEXT' },
  { id: 34, phrase: 'previous video', intent: 'PREVIOUS' },
  { id: 35, phrase: 'repeat on', intent: 'LOOP_ON' },
  { id: 36, phrase: 'repeat off', intent: 'LOOP_OFF' },
  { id: 37, phrase: 'save', intent: 'SAVE' },
  { id: 38, phrase: 'like this', intent: 'SAVE' },
  { id: 39, phrase: 'download offline', intent: 'DOWNLOAD_OFFLINE' },
  { id: 40, phrase: 'skip intro', intent: 'SKIP_INTRO' },
  { id: 41, phrase: 'skip ads', intent: 'SKIP_ADS' },
  { id: 42, phrase: 'go live', intent: 'GO_LIVE' },
  { id: 43, phrase: 'restart', intent: 'RESTART' },
  { id: 44, phrase: 'resume playback', intent: 'RESUME' },
  { id: 45, phrase: 'stop playback', intent: 'PAUSE' },
  { id: 46, phrase: 'continue playing', intent: 'PLAY' },
];

function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ');
}

function parseTimeString(timeStr: string): number | null {
  const timeMatch = timeStr.match(/(\d+):(\d+)/);
  if (timeMatch) {
    const [, minutes, seconds] = timeMatch;
    return (
      Number.parseInt(minutes ?? '0', 10) * 60 +
      Number.parseInt(seconds ?? '0', 10)
    );
  }

  const minuteMatch = timeStr.match(/(\d+)\s*minutes?/);
  if (minuteMatch) {
    return Number.parseInt(minuteMatch[1] ?? '0', 10) * 60;
  }

  const secondMatch = timeStr.match(/(\d+)\s*seconds?/);
  if (secondMatch) {
    return Number.parseInt(secondMatch[1] ?? '0', 10);
  }

  return null;
}

function extractNumericValue(text: string, pattern: RegExp): number | null {
  const match = text.match(pattern);
  return match ? Number.parseInt(match[1] ?? '0', 10) : null;
}

function extractSpeedValue(text: string): number | null {
  const speedMatch = text.match(/(\d+(?:\.\d+)?)[x×]/);
  return speedMatch ? Number.parseFloat(speedMatch[1] ?? '0') : null;
}

export function matchIntent(text: string): IntentMatch | null {
  const normalizedText = normalize(text);

  let bestMatch: IntentMatch | null = null;
  let bestScore = 0;

  for (const command of VIDEO_COMMANDS) {
    const normalizedPhrase = normalize(command.phrase);

    let confidence = 0;
    let slots = { ...(command.slots || {}) };

    if (normalizedText === normalizedPhrase) {
      confidence = 1.0;
    } else if (normalizedText.includes(normalizedPhrase)) {
      confidence = 0.8;
    } else {
      const words = normalizedPhrase.split(' ');
      const textWords = normalizedText.split(' ');
      const matchingWords = words.filter((word) => textWords.includes(word));

      if (matchingWords.length > 0) {
        confidence = (matchingWords.length / words.length) * 0.6;
      }
    }

    if (command.intent === 'SEEK_REL' && !command.slots?.seconds) {
      const timeValue = parseTimeString(normalizedText);
      if (timeValue) {
        if (
          normalizedText.includes('back') ||
          normalizedText.includes('rewind')
        ) {
          slots.seconds = -timeValue;
        } else if (
          normalizedText.includes('forward') ||
          normalizedText.includes('ahead')
        ) {
          slots.seconds = timeValue;
        }
        confidence = Math.max(confidence, 0.7);
      }
    }

    if (command.intent === 'SEEK_ABS' && !command.slots?.timestamp) {
      const timeValue = parseTimeString(normalizedText);
      if (timeValue) {
        slots.timestamp = timeValue;
        confidence = Math.max(confidence, 0.7);
      }
    }

    if (command.intent === 'VOLUME_SET' && !command.slots?.percent) {
      const volumePercent = extractNumericValue(
        normalizedText,
        /(\d+)\s*percent/
      );
      if (volumePercent !== null) {
        slots.percent = Math.min(100, Math.max(0, volumePercent));
        confidence = Math.max(confidence, 0.7);
      }
    }

    if (command.intent === 'SPEED_SET' && !command.slots?.rate) {
      const speedValue = extractSpeedValue(normalizedText);
      if (speedValue !== null) {
        slots.rate = speedValue;
        confidence = Math.max(confidence, 0.7);
      }
    }

    if (confidence > bestScore) {
      bestScore = confidence;
      bestMatch = {
        intent: command.intent,
        slots,
        phrase: command.phrase,
        confidence,
      };
    }
  }

  return bestScore > 0.3 ? bestMatch : null;
}

interface VideoControlState {
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
  playbackRate: number;
}

class VideoController {
  private videoRef: { current: VideoRef | null };
  private state: VideoControlState = {
    isPlaying: false,
    volume: 1.0,
    isMuted: false,
    isFullscreen: false,
    playbackRate: 1.0,
  };

  constructor(videoRef: { current: VideoRef | null }) {
    this.videoRef = videoRef;
  }

  async applyIntent(intentResult: IntentMatch): Promise<void> {
    const video = this.videoRef.current;
    if (!video) {
      throw new Error('Video ref is not available');
    }

    try {
      switch (intentResult.intent) {
        case 'PAUSE':
          video.pause();
          this.state.isPlaying = false;
          break;

        case 'PLAY':
        case 'RESUME':
          video.resume();
          this.state.isPlaying = true;
          break;

        case 'SEEK_REL':
          if (intentResult.slots.seconds) {
            const currentPos = await video.getCurrentPosition();
            const newPos = Math.max(0, currentPos + intentResult.slots.seconds);
            video.seek(newPos);
          }
          break;

        case 'SEEK_ABS':
          if (intentResult.slots.timestamp) {
            video.seek(intentResult.slots.timestamp);
          }
          break;

        case 'VOLUME_UP':
          const newVolumeUp = Math.min(1.0, this.state.volume + 0.1);
          video.setVolume(newVolumeUp);
          this.state.volume = newVolumeUp;
          this.state.isMuted = false;
          break;

        case 'VOLUME_DOWN':
          const newVolumeDown = Math.max(0, this.state.volume - 0.1);
          video.setVolume(newVolumeDown);
          this.state.volume = newVolumeDown;
          break;

        case 'VOLUME_SET':
          if (intentResult.slots.percent !== undefined) {
            const volumeLevel = intentResult.slots.percent / 100;
            video.setVolume(volumeLevel);
            this.state.volume = volumeLevel;
            this.state.isMuted = false;
          }
          break;

        case 'MUTE':
          video.setVolume(0);
          this.state.isMuted = true;
          break;

        case 'UNMUTE':
          video.setVolume(this.state.volume);
          this.state.isMuted = false;
          break;

        case 'FULLSCREEN_ENTER':
          video.setFullScreen(true);
          this.state.isFullscreen = true;
          break;

        case 'FULLSCREEN_EXIT':
          video.setFullScreen(false);
          this.state.isFullscreen = false;
          break;

        case 'RESTART':
          video.seek(0);
          video.resume();
          this.state.isPlaying = true;
          break;

        case 'SPEED_SET':
        case 'SUBTITLES_ON':
        case 'SUBTITLES_OFF':
        case 'SUBTITLES_LANG_SET':
        case 'AUDIO_TRACK_SET':
        case 'QUALITY_SET':
        case 'NEXT':
        case 'PREVIOUS':
        case 'LOOP_ON':
        case 'LOOP_OFF':
        case 'SAVE':
        case 'DOWNLOAD_OFFLINE':
        case 'SKIP_INTRO':
        case 'SKIP_ADS':
        case 'GO_LIVE':
          console.warn(`Intent ${intentResult.intent} not implemented yet`);
          break;

        default:
          console.warn(`Unknown intent: ${intentResult.intent}`);
          break;
      }
    } catch (error) {
      console.error('Error applying video intent:', error);
      throw error;
    }
  }
}

export function withVideoControl(
  agent: VoiceAgent,
  videoRef: { current: VideoRef | null }
): () => void {
  const videoController = new VideoController(videoRef);

  const handleTranscript = (state: any) => {
    if (state.transcript && state.transcript.trim()) {
      try {
        const intentResult = matchIntent(state.transcript);
        if (intentResult) {
          console.log('Video intent matched:', intentResult);
          videoController.applyIntent(intentResult).catch((error) => {
            console.error('Failed to apply video intent:', error);
          });
        }
      } catch (error) {
        console.error('Error processing video control intent:', error);
      }
    }
  };

  const unsubscribe = agent.subscribe(handleTranscript);

  return unsubscribe;
}
