import type { VideoCommand } from './types';

export const VIDEO_COMMANDS: VideoCommand[] = [
  // ===== PLAYBACK CONTROLS =====
  // Basic pause commands
  { id: 1, phrase: 'pause', intent: 'PAUSE' },
  { id: 2, phrase: 'stop', intent: 'PAUSE' },
  { id: 45, phrase: 'stop playback', intent: 'PAUSE' },
  { id: 47, phrase: 'please pause', intent: 'PAUSE' },
  { id: 48, phrase: 'please pause the video', intent: 'PAUSE' },
  { id: 49, phrase: 'could you pause', intent: 'PAUSE' },
  { id: 50, phrase: 'can you pause', intent: 'PAUSE' },
  { id: 51, phrase: 'pause the video', intent: 'PAUSE' },
  { id: 52, phrase: 'stop the video', intent: 'PAUSE' },

  // Basic play commands
  { id: 3, phrase: 'play', intent: 'PLAY' },
  { id: 4, phrase: 'resume', intent: 'PLAY' },
  { id: 44, phrase: 'resume playback', intent: 'RESUME' },
  { id: 46, phrase: 'continue playing', intent: 'PLAY' },
  { id: 53, phrase: 'please play', intent: 'PLAY' },
  { id: 54, phrase: 'please play the video', intent: 'PLAY' },
  { id: 55, phrase: 'can you play', intent: 'PLAY' },
  { id: 56, phrase: 'could you play', intent: 'PLAY' },
  { id: 57, phrase: 'start the video', intent: 'PLAY' },
  { id: 58, phrase: 'play the video', intent: 'PLAY' },

  // Restart command
  { id: 43, phrase: 'restart', intent: 'RESTART' },

  // ===== SEEKING CONTROLS =====
  // Relative seeking (backward)
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
    id: 68,
    phrase: 'can you skip back',
    intent: 'SEEK_REL',
    slots: { seconds: -10 },
  },
  {
    id: 69,
    phrase: 'please go back',
    intent: 'SEEK_REL',
    slots: { seconds: -10 },
  },

  // Relative seeking (forward)
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
    id: 67,
    phrase: 'please skip ahead',
    intent: 'SEEK_REL',
    slots: { seconds: 10 },
  },
  {
    id: 70,
    phrase: 'can you go forward',
    intent: 'SEEK_REL',
    slots: { seconds: 10 },
  },

  // Absolute seeking
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

  // ===== VOLUME CONTROLS =====
  // Volume up
  { id: 12, phrase: 'volume up', intent: 'VOLUME_UP' },
  { id: 59, phrase: 'please turn up the volume', intent: 'VOLUME_UP' },
  { id: 61, phrase: 'can you turn up the volume', intent: 'VOLUME_UP' },
  { id: 63, phrase: 'make it louder', intent: 'VOLUME_UP' },
  { id: 65, phrase: 'turn up', intent: 'VOLUME_UP' },

  // Volume down
  { id: 13, phrase: 'volume down', intent: 'VOLUME_DOWN' },
  { id: 60, phrase: 'please turn down the volume', intent: 'VOLUME_DOWN' },
  { id: 62, phrase: 'can you turn down the volume', intent: 'VOLUME_DOWN' },
  { id: 64, phrase: 'make it quieter', intent: 'VOLUME_DOWN' },
  { id: 66, phrase: 'turn down', intent: 'VOLUME_DOWN' },

  // Volume set
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

  // Mute controls
  { id: 16, phrase: 'mute', intent: 'MUTE' },
  { id: 71, phrase: 'please mute', intent: 'MUTE' },
  { id: 73, phrase: 'can you mute', intent: 'MUTE' },
  { id: 75, phrase: 'mute the video', intent: 'MUTE' },
  { id: 77, phrase: 'turn off sound', intent: 'MUTE' },

  // Unmute controls
  { id: 17, phrase: 'unmute', intent: 'UNMUTE' },
  { id: 72, phrase: 'please unmute', intent: 'UNMUTE' },
  { id: 74, phrase: 'can you unmute', intent: 'UNMUTE' },
  { id: 76, phrase: 'unmute the video', intent: 'UNMUTE' },
  { id: 78, phrase: 'turn on sound', intent: 'UNMUTE' },

  // ===== PLAYBACK SPEED =====
  { id: 18, phrase: '1.25x', intent: 'SPEED_SET', slots: { rate: 1.25 } },
  { id: 19, phrase: '1.5x', intent: 'SPEED_SET', slots: { rate: 1.5 } },
  { id: 20, phrase: '2x', intent: 'SPEED_SET', slots: { rate: 2.0 } },
  { id: 21, phrase: 'normal speed', intent: 'SPEED_SET', slots: { rate: 1.0 } },

  // ===== FULLSCREEN CONTROLS =====
  // Enter fullscreen
  { id: 31, phrase: 'fullscreen', intent: 'FULLSCREEN_ENTER' },
  { id: 79, phrase: 'please go fullscreen', intent: 'FULLSCREEN_ENTER' },
  { id: 80, phrase: 'can you go fullscreen', intent: 'FULLSCREEN_ENTER' },
  { id: 81, phrase: 'make it fullscreen', intent: 'FULLSCREEN_ENTER' },

  // Exit fullscreen
  { id: 32, phrase: 'exit fullscreen', intent: 'FULLSCREEN_EXIT' },
  { id: 82, phrase: 'please exit fullscreen', intent: 'FULLSCREEN_EXIT' },
  { id: 83, phrase: 'can you exit fullscreen', intent: 'FULLSCREEN_EXIT' },
  { id: 84, phrase: 'go back to window', intent: 'FULLSCREEN_EXIT' },

  // ===== SUBTITLE CONTROLS =====
  { id: 22, phrase: 'subtitles on', intent: 'SUBTITLES_ON' },
  { id: 23, phrase: 'subtitles off', intent: 'SUBTITLES_OFF' },
  {
    id: 24,
    phrase: 'english subtitles',
    intent: 'SUBTITLES_LANG_SET',
    slots: { lang: 'en' },
  },

  // ===== AUDIO TRACK CONTROLS =====
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

  // ===== QUALITY CONTROLS =====
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

  // ===== PLAYLIST CONTROLS =====
  { id: 33, phrase: 'next video', intent: 'NEXT' },
  { id: 34, phrase: 'previous video', intent: 'PREVIOUS' },

  // ===== LOOP CONTROLS =====
  { id: 35, phrase: 'repeat on', intent: 'LOOP_ON' },
  { id: 36, phrase: 'repeat off', intent: 'LOOP_OFF' },

  // ===== USER ACTIONS =====
  { id: 37, phrase: 'save', intent: 'SAVE' },
  { id: 38, phrase: 'like this', intent: 'SAVE' },
  { id: 39, phrase: 'download offline', intent: 'DOWNLOAD_OFFLINE' },

  // ===== SPECIAL FEATURES =====
  { id: 40, phrase: 'skip intro', intent: 'SKIP_INTRO' },
  { id: 41, phrase: 'skip ads', intent: 'SKIP_ADS' },
  { id: 42, phrase: 'go live', intent: 'GO_LIVE' },
];
