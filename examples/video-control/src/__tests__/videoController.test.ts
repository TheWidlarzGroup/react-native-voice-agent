import { matchIntent } from '../intentMatcher';

describe('Video Controller Intent Matching', () => {
  describe('Basic Commands', () => {
    it('should match pause commands', () => {
      expect(matchIntent('pause')?.intent).toBe('PAUSE');
      expect(matchIntent('stop')?.intent).toBe('PAUSE');
      expect(matchIntent('please pause')?.intent).toBe('PAUSE');
      expect(matchIntent('please pause the video')?.intent).toBe('PAUSE');
      expect(matchIntent('can you pause')?.intent).toBe('PAUSE');
      expect(matchIntent('pause the video')?.intent).toBe('PAUSE');
    });

    it('should match play commands', () => {
      expect(matchIntent('play')?.intent).toBe('PLAY');
      expect(matchIntent('resume')?.intent).toBe('PLAY');
      expect(matchIntent('please play')?.intent).toBe('PLAY');
      expect(matchIntent('please play the video')?.intent).toBe('PLAY');
      expect(matchIntent('can you play')?.intent).toBe('PLAY');
      expect(matchIntent('start the video')?.intent).toBe('PLAY');
    });
  });

  describe('Volume Commands', () => {
    it('should match volume up commands', () => {
      expect(matchIntent('volume up')?.intent).toBe('VOLUME_UP');
      expect(matchIntent('please turn up the volume')?.intent).toBe(
        'VOLUME_UP'
      );
      expect(matchIntent('make it louder')?.intent).toBe('VOLUME_UP');
      expect(matchIntent('turn up')?.intent).toBe('VOLUME_UP');
    });

    it('should match volume down commands', () => {
      expect(matchIntent('volume down')?.intent).toBe('VOLUME_DOWN');
      expect(matchIntent('please turn down the volume')?.intent).toBe(
        'VOLUME_DOWN'
      );
      expect(matchIntent('make it quieter')?.intent).toBe('VOLUME_DOWN');
      expect(matchIntent('turn down')?.intent).toBe('VOLUME_DOWN');
    });

    it('should match mute commands', () => {
      expect(matchIntent('mute')?.intent).toBe('MUTE');
      expect(matchIntent('please mute')?.intent).toBe('MUTE');
      expect(matchIntent('mute the video')?.intent).toBe('MUTE');
      expect(matchIntent('turn off sound')?.intent).toBe('MUTE');
    });

    it('should match unmute commands', () => {
      expect(matchIntent('unmute')?.intent).toBe('UNMUTE');
      expect(matchIntent('please unmute')?.intent).toBe('UNMUTE');
      expect(matchIntent('unmute the video')?.intent).toBe('UNMUTE');
      expect(matchIntent('turn on sound')?.intent).toBe('UNMUTE');
    });
  });

  describe('Seek Commands', () => {
    it('should match relative seek commands', () => {
      const skipAhead = matchIntent('skip ahead 10');
      expect(skipAhead?.intent).toBe('SEEK_REL');
      expect('seconds' in skipAhead?.slots! && skipAhead?.slots.seconds).toBe(
        10
      );

      const skipBack = matchIntent('skip back 30');
      expect(skipBack?.intent).toBe('SEEK_REL');
      expect('seconds' in skipBack?.slots! && skipBack?.slots.seconds).toBe(
        -30
      );

      const pleaseSkip = matchIntent('please skip ahead');
      expect(pleaseSkip?.intent).toBe('SEEK_REL');
      expect('seconds' in pleaseSkip?.slots! && pleaseSkip?.slots.seconds).toBe(
        10
      );
    });

    it('should match absolute seek commands', () => {
      const goToTime = matchIntent('go to 2 minutes');
      expect(goToTime?.intent).toBe('SEEK_ABS');
      expect('timestamp' in goToTime?.slots! && goToTime?.slots.timestamp).toBe(
        120
      );

      const goToTimeStamp = matchIntent('go to 10:00');
      expect(goToTimeStamp?.intent).toBe('SEEK_ABS');
      expect(
        'timestamp' in goToTimeStamp?.slots! && goToTimeStamp?.slots.timestamp
      ).toBe(600);
    });
  });

  describe('Fullscreen Commands', () => {
    it('should match fullscreen enter commands', () => {
      expect(matchIntent('fullscreen')?.intent).toBe('FULLSCREEN_ENTER');
      expect(matchIntent('please go fullscreen')?.intent).toBe(
        'FULLSCREEN_ENTER'
      );
      expect(matchIntent('make it fullscreen')?.intent).toBe(
        'FULLSCREEN_ENTER'
      );
    });

    it('should match fullscreen exit commands', () => {
      expect(matchIntent('exit fullscreen')?.intent).toBe('FULLSCREEN_EXIT');
      expect(matchIntent('please exit fullscreen')?.intent).toBe(
        'FULLSCREEN_EXIT'
      );
      expect(matchIntent('go back to window')?.intent).toBe('FULLSCREEN_EXIT');
    });
  });

  describe('Natural Language Processing', () => {
    it('should handle variations in capitalization and punctuation', () => {
      expect(matchIntent('PLEASE PAUSE THE VIDEO!')?.intent).toBe('PAUSE');
      expect(matchIntent('Can You Play?')?.intent).toBe('PLAY');
      expect(matchIntent('mute, please')?.intent).toBe('MUTE');
    });

    it('should handle extra words and filler', () => {
      expect(matchIntent('can you please pause the video now')?.intent).toBe(
        'PAUSE'
      );
      expect(matchIntent('I would like to play the video')?.intent).toBe(
        'PLAY'
      );
      expect(matchIntent('please turn up the volume a bit')?.intent).toBe(
        'VOLUME_UP'
      );
    });

    it('should return null for non-matching text', () => {
      expect(matchIntent('hello there')).toBe(null);
      expect(matchIntent('what time is it')).toBe(null);
      expect(matchIntent('random text')).toBe(null);
    });

    it('should have high confidence for exact matches', () => {
      const exact = matchIntent('pause');
      expect(exact?.confidence).toBe(1.0);

      const contained = matchIntent('please pause the video');
      expect(contained?.confidence).toBeGreaterThan(0.8);
    });
  });
});
