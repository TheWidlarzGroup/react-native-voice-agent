import { BaseOnlineLLMProvider } from './BaseOnlineLLMProvider';
import type { ConversationMessage, OpenAIConfig } from '../../types';
import { createServiceError } from '../../types';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenAIProvider extends BaseOnlineLLMProvider {
  private baseUrl: string;

  constructor(config: OpenAIConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  protected async validateApiKey(): Promise<void> {
    if (!this.config.apiKey) {
      throw createServiceError(
        'llama',
        'MISSING_API_KEY',
        'OpenAI API key is required'
      );
    }

    try {
      // Test API key by making a simple request to models endpoint
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw createServiceError(
            'llama',
            'INVALID_API_KEY',
            'Invalid OpenAI API key'
          );
        } else if (response.status === 429) {
          throw createServiceError(
            'llama',
            'RATE_LIMIT',
            'Rate limit exceeded'
          );
        } else {
          throw createServiceError(
            'llama',
            'API_ERROR',
            `OpenAI API error: ${response.status}`
          );
        }
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('ServiceError')) {
        throw error;
      }
      throw createServiceError(
        'llama',
        'NETWORK_ERROR',
        'Failed to connect to OpenAI API',
        error
      );
    }
  }

  protected async callProvider(
    messages: ConversationMessage[]
  ): Promise<string> {
    try {
      // Convert our message format to OpenAI format
      const openaiMessages: OpenAIMessage[] = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const requestBody = {
        model: this.config.model,
        messages: openaiMessages,
        max_tokens: this.config.maxTokens || 256,
        temperature: this.config.temperature || 0.7,
        top_p: this.config.topP || 0.9,
      };

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeout || 30000
      );

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 401) {
          throw createServiceError(
            'llama',
            'INVALID_API_KEY',
            'Invalid or expired OpenAI API key'
          );
        } else if (response.status === 429) {
          throw createServiceError(
            'llama',
            'RATE_LIMIT',
            'Rate limit exceeded. Please try again later.'
          );
        } else if (response.status === 400) {
          throw createServiceError(
            'llama',
            'INVALID_REQUEST',
            `Invalid request: ${errorData.error?.message || 'Unknown error'}`
          );
        } else if (response.status >= 500) {
          throw createServiceError(
            'llama',
            'SERVER_ERROR',
            'OpenAI server error. Please try again later.'
          );
        } else {
          throw createServiceError(
            'llama',
            'API_ERROR',
            `OpenAI API error: ${response.status} ${errorData.error?.message || ''}`
          );
        }
      }

      const data: OpenAIResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw createServiceError(
          'llama',
          'NO_RESPONSE',
          'No response generated from OpenAI'
        );
      }

      const assistantMessage = data.choices[0]?.message?.content?.trim();

      if (!assistantMessage) {
        throw createServiceError(
          'llama',
          'EMPTY_RESPONSE',
          'Empty response from OpenAI'
        );
      }

      return assistantMessage;
    } catch (error) {
      // Handle fetch abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw createServiceError(
          'llama',
          'TIMEOUT',
          'Request timeout. Please try again.'
        );
      }

      // Re-throw service errors
      if (error instanceof Error && error.message.includes('ServiceError')) {
        throw error;
      }

      // Network/unknown errors
      throw createServiceError(
        'llama',
        'NETWORK_ERROR',
        'Failed to connect to OpenAI API',
        error
      );
    }
  }
}
