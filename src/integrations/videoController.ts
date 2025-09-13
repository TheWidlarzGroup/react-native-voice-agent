import type { VoiceAgent, VoiceAgentState } from '../types';
import type { VideoRef, IntentMatch, VideoControlState } from './types';
import { matchIntent } from './intentMatcher';

/**
 * VideoController handles the execution of video control commands
 * based on matched intents from voice input
 */
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
          if ('seconds' in intentResult.slots && intentResult.slots.seconds) {
            const currentPos = await video.getCurrentPosition();
            const newPos = Math.max(0, currentPos + intentResult.slots.seconds);
            video.seek(newPos);
          }
          break;

        case 'SEEK_ABS':
          if (
            'timestamp' in intentResult.slots &&
            intentResult.slots.timestamp
          ) {
            video.seek(intentResult.slots.timestamp);
          }
          break;

        case 'VOLUME_UP': {
          const newVolumeUp = Math.min(1.0, this.state.volume + 0.1);
          video.setVolume(newVolumeUp);
          this.state.volume = newVolumeUp;
          this.state.isMuted = false;
          break;
        }

        case 'VOLUME_DOWN': {
          const newVolumeDown = Math.max(0, this.state.volume - 0.1);
          video.setVolume(newVolumeDown);
          this.state.volume = newVolumeDown;
          break;
        }

        case 'VOLUME_SET':
          if (
            'percent' in intentResult.slots &&
            intentResult.slots.percent !== undefined
          ) {
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

/**
 * Higher-order function that adds video control capabilities to a VoiceAgent
 * Returns an unsubscribe function to clean up the integration
 */
export function withVideoControl(
  agent: VoiceAgent,
  videoRef: { current: VideoRef | null }
): () => void {
  const videoController = new VideoController(videoRef);

  const handleTranscript = (state: VoiceAgentState) => {
    if (state.transcript?.trim()) {
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

// Re-export public types and functions for backward compatibility
export type { VideoRef, VideoIntent, VideoCommand, IntentMatch } from './types';
export { matchIntent } from './intentMatcher';
