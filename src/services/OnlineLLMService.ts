import type {
  OpenAIConfig,
  AnthropicConfig,
  GoogleConfig,
  ConversationMessage,
  ModelDownloadProgress,
} from '../types';
import { createServiceError } from '../types';
import { BaseOnlineLLMProvider } from './providers/BaseOnlineLLMProvider';
import { OpenAIProvider } from './providers/OpenAIProvider';
import { AnthropicProvider } from './providers/AnthropicProvider';
import { GoogleProvider } from './providers/GoogleProvider';

// Re-export the base class for backward compatibility
export { BaseOnlineLLMProvider };

export class OnlineLLMService {
  private provider: BaseOnlineLLMProvider;

  constructor(config: OpenAIConfig | AnthropicConfig | GoogleConfig) {
    // Factory pattern to create the right provider
    switch (config.provider) {
      case 'openai':
        this.provider = new OpenAIProvider(config);
        break;
      case 'anthropic':
        this.provider = new AnthropicProvider(config);
        break;
      case 'google':
        this.provider = new GoogleProvider(config);
        break;
      default:
        throw createServiceError(
          'llama',
          'UNSUPPORTED_PROVIDER',
          `Unsupported provider: ${(config as any).provider}`
        );
    }
  }

  async initialize(
    systemPrompt: string,
    onDownloadProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    return this.provider.initialize(systemPrompt, onDownloadProgress);
  }

  async generateResponse(userMessage: string): Promise<string> {
    return this.provider.generateResponse(userMessage);
  }

  setSystemPrompt(prompt: string): void {
    this.provider.setSystemPrompt(prompt);
  }

  clearHistory(): void {
    this.provider.clearHistory();
  }

  getHistory(): ConversationMessage[] {
    return this.provider.getHistory();
  }

  setMaxHistoryLength(length: number): void {
    this.provider.setMaxHistoryLength(length);
  }

  async updateModelSettings(
    settings: Partial<OpenAIConfig | AnthropicConfig | GoogleConfig>
  ): Promise<void> {
    return this.provider.updateModelSettings(settings);
  }

  getModelInfo(): {
    name: string;
    isLoaded: boolean;
    settings: OpenAIConfig | AnthropicConfig | GoogleConfig;
  } {
    return this.provider.getModelInfo();
  }

  isReady(): boolean {
    return this.provider.isReady();
  }

  async dispose(): Promise<void> {
    return this.provider.dispose();
  }

  estimateTokenCount(text: string): number {
    return this.provider.estimateTokenCount(text);
  }

  getStats(): {
    messageCount: number;
    estimatedTokens: number;
    historyLength: number;
  } {
    return this.provider.getStats();
  }
}

// Export provider implementations
export { OpenAIProvider, AnthropicProvider, GoogleProvider };
