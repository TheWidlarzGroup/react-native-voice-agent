import type {
  OpenAIConfig,
  AnthropicConfig,
  GoogleConfig,
  ConversationMessage,
  ModelDownloadProgress,
} from '../../types';
import { createServiceError } from '../../types';

export abstract class BaseOnlineLLMProvider {
  protected config: OpenAIConfig | AnthropicConfig | GoogleConfig;
  protected conversationHistory: ConversationMessage[] = [];
  protected systemPrompt = '';
  protected maxHistoryLength = 10;
  protected isInitialized = false;

  constructor(config: OpenAIConfig | AnthropicConfig | GoogleConfig) {
    this.config = config;
  }

  async initialize(
    systemPrompt: string,
    onDownloadProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.systemPrompt = systemPrompt;

    // Online providers don't need model downloads
    if (onDownloadProgress) {
      onDownloadProgress({
        modelName: this.config.model,
        downloaded: 1,
        total: 1,
        percentage: 100,
        isComplete: true,
      });
    }

    await this.validateApiKey();
    this.isInitialized = true;

    // Set initial system prompt
    if (this.systemPrompt) {
      this.conversationHistory.push({
        role: 'system',
        content: this.systemPrompt,
        timestamp: new Date(),
      });
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    if (!this.isInitialized) {
      throw createServiceError(
        'llama',
        'ONLINE_LLM_NOT_INITIALIZED',
        'OnlineLLMService not initialized'
      );
    }

    try {
      // Add user message to history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date(),
      });

      // Trim history if too long
      this.trimHistory();

      // Generate response using provider-specific implementation
      const response = await this.callProvider(this.conversationHistory);

      if (response) {
        // Add assistant response to history
        this.conversationHistory.push({
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        });
      }

      return response;
    } catch (error) {
      throw createServiceError(
        'llama',
        'GENERATION_FAILED',
        'Failed to generate response',
        error
      );
    }
  }

  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;

    // Update or add system message in history
    const systemMessageIndex = this.conversationHistory.findIndex(
      (msg) => msg.role === 'system'
    );

    if (systemMessageIndex >= 0) {
      this.conversationHistory[systemMessageIndex] = {
        role: 'system',
        content: prompt,
        timestamp: new Date(),
      };
    } else {
      this.conversationHistory.unshift({
        role: 'system',
        content: prompt,
        timestamp: new Date(),
      });
    }
  }

  clearHistory(): void {
    // Keep only system prompt
    const systemMessages = this.conversationHistory.filter(
      (msg) => msg.role === 'system'
    );
    this.conversationHistory = systemMessages;
  }

  getHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  setMaxHistoryLength(length: number): void {
    this.maxHistoryLength = length;
    this.trimHistory();
  }

  async updateModelSettings(
    settings: Partial<OpenAIConfig | AnthropicConfig | GoogleConfig>
  ): Promise<void> {
    this.config = { ...this.config, ...settings } as
      | OpenAIConfig
      | AnthropicConfig
      | GoogleConfig;
  }

  getModelInfo(): {
    name: string;
    isLoaded: boolean;
    settings: OpenAIConfig | AnthropicConfig | GoogleConfig;
  } {
    return {
      name: this.config.model,
      isLoaded: this.isInitialized,
      settings: this.config,
    };
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  async dispose(): Promise<void> {
    this.isInitialized = false;
    this.conversationHistory = [];
  }

  estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  getStats(): {
    messageCount: number;
    estimatedTokens: number;
    historyLength: number;
  } {
    const allMessages = this.conversationHistory
      .map((msg) => msg.content)
      .join(' ');

    return {
      messageCount: this.conversationHistory.length,
      estimatedTokens: this.estimateTokenCount(allMessages),
      historyLength: this.maxHistoryLength,
    };
  }

  private trimHistory(): void {
    // Keep system prompt (first message) and trim user/assistant pairs
    if (this.conversationHistory.length <= this.maxHistoryLength) {
      return;
    }

    const systemMessages = this.conversationHistory.filter(
      (msg) => msg.role === 'system'
    );
    const conversationMessages = this.conversationHistory.filter(
      (msg) => msg.role !== 'system'
    );

    // Keep only the most recent messages
    const messagesToKeep = Math.floor(this.maxHistoryLength / 2) * 2; // Keep pairs
    const recentMessages = conversationMessages.slice(-messagesToKeep);

    this.conversationHistory = [...systemMessages, ...recentMessages];
  }

  // Abstract methods that providers must implement
  protected abstract validateApiKey(): Promise<void>;
  protected abstract callProvider(
    messages: ConversationMessage[]
  ): Promise<string>;
}
