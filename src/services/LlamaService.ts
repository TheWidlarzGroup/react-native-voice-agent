import { initLlama } from 'llama.rn';
import type {
  OfflineLlamaOptions,
  ConversationMessage,
  LlamaInstance,
  ModelDownloadProgress,
} from '../types';
import { createServiceError } from '../types';
import { ModelDownloader } from '../utils/modelDownloader';

export class LlamaService {
  private llamaInstance: LlamaInstance | null = null;
  private isInitialized = false;
  private modelDownloader: ModelDownloader;
  private options: OfflineLlamaOptions;
  private conversationHistory: ConversationMessage[] = [];
  private systemPrompt = '';
  private maxHistoryLength = 10;

  constructor(options: OfflineLlamaOptions) {
    this.options = options;
    this.modelDownloader = ModelDownloader.getInstance();
  }

  async initialize(
    systemPrompt: string,
    onDownloadProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    try {
      if (this.isInitialized) {
        return;
      }

      this.systemPrompt = systemPrompt;

      const modelPath = await this.modelDownloader.downloadLlamaModel(
        this.options.modelName,
        onDownloadProgress
      );

      const RNFS = require('react-native-fs');

      if (!(await RNFS.exists(modelPath))) {
        throw new Error('Model file does not exist after download');
      }

      const stats = await RNFS.stat(modelPath);

      if (stats.size < 50 * 1024 * 1024) {
        await this.modelDownloader.clearCorruptedModel(this.options.modelName);

        const newModelPath = await this.modelDownloader.downloadLlamaModel(
          this.options.modelName,
          onDownloadProgress
        );

        const newStats = await RNFS.stat(newModelPath);

        if (newStats.size < 50 * 1024 * 1024) {
          throw new Error(
            'Model download failed - unable to get valid model file'
          );
        }
      }

      this.llamaInstance = await initLlama({
        model: modelPath,
        n_ctx: 128,
        n_batch: 32,
        n_threads: 1,
        use_mlock: false,
        use_mmap: true,
        n_gpu_layers: 0,
      });

      this.isInitialized = true;

      // Set initial system prompt
      if (this.systemPrompt) {
        this.conversationHistory.push({
          role: 'system',
          content: this.systemPrompt,
          timestamp: new Date(),
        });
      }
    } catch (error) {
      throw createServiceError(
        'llama',
        'LLAMA_INIT_FAILED',
        'Failed to initialize Llama',
        error
      );
    }
  }

  async generateResponse(userMessage: string): Promise<string> {
    if (!this.isInitialized || !this.llamaInstance) {
      throw createServiceError(
        'llama',
        'LLAMA_NOT_INITIALIZED',
        'LlamaService not initialized'
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

      // Build prompt with conversation history
      const prompt = this.buildPrompt();

      // Generate response using the new completion API
      const response = await this.llamaInstance.completion({
        prompt: prompt,
        n_predict: this.options.maxTokens,
        temperature: this.options.temperature,
        top_p: this.options.topP,
        stop: ['<|im_end|>', '<|endoftext|>', '\nUser:', '\nAssistant:'],
      });

      const rawResponse = response.text?.trim() || '';

      // Clean up the response by removing template artifacts
      const assistantMessage = this.cleanResponse(rawResponse);

      if (assistantMessage) {
        // Add assistant response to history
        this.conversationHistory.push({
          role: 'assistant',
          content: assistantMessage,
          timestamp: new Date(),
        });
      }

      return assistantMessage;
    } catch (error) {
      throw createServiceError(
        'llama',
        'GENERATION_FAILED',
        'Failed to generate response',
        error
      );
    }
  }

  private buildPrompt(): string {
    // Use ChatML format for Llama 3.2
    let prompt = '';

    for (const message of this.conversationHistory) {
      switch (message.role) {
        case 'system':
          prompt += `<|im_start|>system\n${message.content}<|im_end|>\n`;
          break;
        case 'user':
          prompt += `<|im_start|>user\n${message.content}<|im_end|>\n`;
          break;
        case 'assistant':
          prompt += `<|im_start|>assistant\n${message.content}<|im_end|>\n`;
          break;
      }
    }

    // Add start token for assistant response
    prompt += '<|im_start|>assistant\n';

    return prompt;
  }

  private cleanResponse(response: string): string {
    let cleaned = response;

    // Remove ChatML template artifacts
    cleaned = cleaned.replace(/<\|im_start\|>/g, '');
    cleaned = cleaned.replace(/<\|im_end\|>/g, '');
    cleaned = cleaned.replace(/<\|endoftext\|>/g, '');

    // Remove role indicators that might appear
    cleaned = cleaned.replace(/^(system|user|assistant)[\s\n]*/, '');
    cleaned = cleaned.replace(/\n(system|user|assistant)[\s\n]*/g, '\n');

    // Remove other common prompt artifacts
    cleaned = cleaned.replace(/^[:\s]*/, ''); // Remove leading colons and whitespace
    cleaned = cleaned.replace(/^\w+:\s*/, ''); // Remove "Assistant:" or similar prefixes

    // Clean up excessive whitespace
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple newlines to double
    cleaned = cleaned.trim();

    return cleaned;
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
    settings: Partial<OfflineLlamaOptions>
  ): Promise<void> {
    this.options = { ...this.options, ...settings };

    // Settings will apply to next generation if model is already initialized
  }

  getModelInfo(): {
    name: string;
    isLoaded: boolean;
    settings: OfflineLlamaOptions;
  } {
    return {
      name: this.options.modelName,
      isLoaded: this.isInitialized,
      settings: this.options,
    };
  }

  isReady(): boolean {
    return this.isInitialized && this.llamaInstance !== null;
  }

  async dispose(): Promise<void> {
    try {
      if (this.llamaInstance) {
        // Clean up Llama instance using the release method
        if (typeof this.llamaInstance.release === 'function') {
          await this.llamaInstance.release();
        }
        this.llamaInstance = null;
      }

      this.isInitialized = false;
      this.conversationHistory = [];
    } catch (error) {}
  }

  // Helper method to estimate token count
  estimateTokenCount(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English
    return Math.ceil(text.length / 4);
  }

  // Helper method to check if response will fit in context
  canFitInContext(additionalText: string): boolean {
    const currentPrompt = this.buildPrompt();
    const estimatedCurrentTokens = this.estimateTokenCount(currentPrompt);
    const estimatedAdditionalTokens = this.estimateTokenCount(additionalText);
    const contextLimit = 2048; // Standard context length for mobile models

    return (
      estimatedCurrentTokens +
        estimatedAdditionalTokens +
        this.options.maxTokens <
      contextLimit
    );
  }

  // Helper method to get conversation stats
  getStats(): {
    messageCount: number;
    estimatedTokens: number;
    historyLength: number;
  } {
    const currentPrompt = this.buildPrompt();

    return {
      messageCount: this.conversationHistory.length,
      estimatedTokens: this.estimateTokenCount(currentPrompt),
      historyLength: this.maxHistoryLength,
    };
  }
}
