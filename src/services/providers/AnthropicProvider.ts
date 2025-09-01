import { BaseOnlineLLMProvider } from '../OnlineLLMService';
import type { ConversationMessage, AnthropicConfig } from '../../types';
import { createServiceError } from '../../types';

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  stop_sequence?: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicProvider extends BaseOnlineLLMProvider {
  private baseUrl: string;

  constructor(config: AnthropicConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';
  }

  protected async validateApiKey(): Promise<void> {
    if (!this.config.apiKey) {
      throw createServiceError(
        'llama',
        'MISSING_API_KEY',
        'Anthropic API key is required'
      );
    }

    // Anthropic doesn't have a simple validation endpoint like OpenAI,
    // so we'll validate on first actual request
  }

  protected async callProvider(
    messages: ConversationMessage[]
  ): Promise<string> {
    try {
      // Anthropic API requires separate system message and conversation messages
      let systemMessage = '';
      const conversationMessages: AnthropicMessage[] = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemMessage = msg.content;
        } else if (msg.role === 'user' || msg.role === 'assistant') {
          conversationMessages.push({
            role: msg.role,
            content: msg.content,
          });
        }
      }

      const requestBody: any = {
        model: this.config.model,
        messages: conversationMessages,
        max_tokens: this.config.maxTokens || 256,
        temperature: this.config.temperature || 0.7,
        top_p: this.config.topP || 0.9,
      };

      // Add system message if present
      if (systemMessage) {
        requestBody.system = systemMessage;
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeout || 30000
      );

      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.config.apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
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
            'Invalid or expired Anthropic API key'
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
            'Anthropic server error. Please try again later.'
          );
        } else {
          throw createServiceError(
            'llama',
            'API_ERROR',
            `Anthropic API error: ${response.status} ${errorData.error?.message || ''}`
          );
        }
      }

      const data: AnthropicResponse = await response.json();

      if (!data.content || data.content.length === 0) {
        throw createServiceError(
          'llama',
          'NO_RESPONSE',
          'No response generated from Anthropic'
        );
      }

      // Get text content from the first content block
      const textContent = data.content.find((c) => c.type === 'text')?.text;

      if (!textContent || !textContent.trim()) {
        throw createServiceError(
          'llama',
          'EMPTY_RESPONSE',
          'Empty response from Anthropic'
        );
      }

      return textContent.trim();
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
        'Failed to connect to Anthropic API',
        error
      );
    }
  }
}
