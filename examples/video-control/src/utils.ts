/**
 * Normalizes text for intent matching by converting to lowercase,
 * removing punctuation, extra spaces, and common articles
 */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b(the|a|an)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Parses time strings like "2:30", "10 seconds", "5 minutes" into seconds
 */
export function parseTimeString(timeStr: string): number | null {
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

/**
 * Extracts numeric values from text using a regex pattern
 */
export function extractNumericValue(
  text: string,
  pattern: RegExp
): number | null {
  const match = text.match(pattern);
  return match ? Number.parseInt(match[1] ?? '0', 10) : null;
}

/**
 * Extracts speed values from text like "1.5x", "2×"
 */
export function extractSpeedValue(text: string): number | null {
  const speedMatch = text.match(/(\d+(?:\.\d+)?)[x×]/);
  return speedMatch ? Number.parseFloat(speedMatch[1] ?? '0') : null;
}

/**
 * Key words that boost confidence in intent matching
 */
export const KEY_WORDS = [
  'pause',
  'play',
  'stop',
  'resume',
  'mute',
  'unmute',
  'volume',
  'seek',
  'fullscreen',
] as const;
