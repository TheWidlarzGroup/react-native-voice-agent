import type {
  IntentMatch,
  VideoCommandSlots,
  SeekRelativeSlots,
  SeekAbsoluteSlots,
  VolumeSetSlots,
  SpeedSetSlots,
} from './types';
import { VIDEO_COMMANDS } from './videoCommands';
import {
  normalize,
  parseTimeString,
  extractNumericValue,
  extractSpeedValue,
  KEY_WORDS,
} from './utils';

/**
 * Matches user input text to video control intents with confidence scoring
 */
export function matchIntent(text: string): IntentMatch | null {
  const normalizedText = normalize(text);

  let bestMatch: IntentMatch | null = null;
  let bestScore = 0;

  for (const command of VIDEO_COMMANDS) {
    const normalizedPhrase = normalize(command.phrase);

    let confidence = 0;
    let slots: VideoCommandSlots = command.slots ? { ...command.slots } : {};

    // Exact match
    if (normalizedText === normalizedPhrase) {
      confidence = 1.0;
    }
    // Contains the full phrase
    else if (normalizedText.includes(normalizedPhrase)) {
      confidence = 0.9;
    }
    // Reverse check: phrase contains the text (for short commands like "pause")
    else if (
      normalizedPhrase.includes(normalizedText) &&
      normalizedText.length >= 3
    ) {
      confidence = 0.85;
    }
    // Word-based matching with improved scoring
    else {
      const words = normalizedPhrase.split(' ').filter((w) => w.length > 0);
      const textWords = normalizedText.split(' ').filter((w) => w.length > 0);
      const matchingWords = words.filter((word) => textWords.includes(word));

      if (matchingWords.length > 0) {
        // Boost confidence for key action words
        const hasKeyWord = matchingWords.some((word) =>
          KEY_WORDS.includes(word as (typeof KEY_WORDS)[number])
        );
        const baseConfidence = (matchingWords.length / words.length) * 0.7;
        confidence = hasKeyWord
          ? Math.min(0.8, baseConfidence + 0.2)
          : baseConfidence;
      }
    }

    // Handle dynamic slot extraction for SEEK_REL commands
    if (command.intent === 'SEEK_REL' && !('seconds' in slots)) {
      const timeValue = parseTimeString(normalizedText);
      if (timeValue) {
        const seekSlots: SeekRelativeSlots = {
          seconds:
            normalizedText.includes('back') || normalizedText.includes('rewind')
              ? -timeValue
              : timeValue,
        };
        slots = seekSlots;
        confidence = Math.max(confidence, 0.7);
      }
    }

    // Handle dynamic slot extraction for SEEK_ABS commands
    if (command.intent === 'SEEK_ABS' && !('timestamp' in slots)) {
      const timeValue = parseTimeString(normalizedText);
      if (timeValue) {
        const seekSlots: SeekAbsoluteSlots = { timestamp: timeValue };
        slots = seekSlots;
        confidence = Math.max(confidence, 0.7);
      }
    }

    // Handle dynamic slot extraction for VOLUME_SET commands
    if (command.intent === 'VOLUME_SET' && !('percent' in slots)) {
      const volumePercent = extractNumericValue(
        normalizedText,
        /(\d+)\s*percent/
      );
      if (volumePercent !== null) {
        const volumeSlots: VolumeSetSlots = {
          percent: Math.min(100, Math.max(0, volumePercent)),
        };
        slots = volumeSlots;
        confidence = Math.max(confidence, 0.7);
      }
    }

    // Handle dynamic slot extraction for SPEED_SET commands
    if (command.intent === 'SPEED_SET' && !('rate' in slots)) {
      const speedValue = extractSpeedValue(normalizedText);
      if (speedValue !== null) {
        const speedSlots: SpeedSetSlots = { rate: speedValue };
        slots = speedSlots;
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
