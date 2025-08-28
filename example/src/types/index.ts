export type DemoType = 'basic' | 'advanced' | 'custom';

export interface ConversationEntry {
  type: 'user' | 'assistant' | 'thinking';
  text: string;
  timestamp: Date;
}

export interface PresetPrompt {
  name: string;
  prompt: string;
}

export interface VoiceAgentProps {
  agent: any;
}
