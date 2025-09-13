import { BaseOnlineLLMProvider } from './BaseOnlineLLMProvider';
import type { ConversationMessage, GoogleConfig } from '../../types';
import { createServiceError } from '../../types';

interface GoogleContent {
  role: 'user' | 'model';
  parts: Array<{
    text: string;
  }>;
}

interface GoogleGenerateRequest {
  contents: GoogleContent[];
  systemInstruction?: {
    parts: Array<{
      text: string;
    }>;
  };
  generationConfig: {
    maxOutputTokens: number;
    temperature: number;
    topP: number;
  };
}

interface GoogleResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
      role: string;
    };
    finishReason: string;
    index: number;
    safetyRatings?: Array<{
      category: string;
      probability: string;
    }>;
  }>;
  promptFeedback?: {
    safetyRatings: Array<{
      category: string;
      probability: string;
    }>;
  };
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GoogleProvider extends BaseOnlineLLMProvider {
  private baseUrl: string;

  constructor(config: GoogleConfig) {
    super(config);
    this.baseUrl =
      config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  protected async validateApiKey(): Promise<void> {
    if (!this.config.apiKey) {
      throw createServiceError(
        'llama',
        'MISSING_API_KEY',
        'Google API key is required'
      );
    }

    try {
      // Test API key by listing models
      const response = await fetch(
        `${this.baseUrl}/models?key=${this.config.apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        if (response.status === 400) {
          throw createServiceError(
            'llama',
            'INVALID_API_KEY',
            'Invalid Google API key'
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
            `Google API error: ${response.status}`
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
        'Failed to connect to Google API',
        error
      );
    }
  }

  protected async callProvider(
    messages: ConversationMessage[]
  ): Promise<string> {
    try {
      // Extract system message and convert conversation messages
      let systemInstruction: string | undefined;
      const contents: GoogleContent[] = [];

      for (const msg of messages) {
        if (msg.role === 'system') {
          systemInstruction = msg.content;
        } else if (msg.role === 'user') {
          contents.push({
            role: 'user',
            parts: [{ text: msg.content }],
          });
        } else if (msg.role === 'assistant') {
          contents.push({
            role: 'model',
            parts: [{ text: msg.content }],
          });
        }
      }

      const requestBody: GoogleGenerateRequest = {
        contents,
        generationConfig: {
          maxOutputTokens: this.config.maxTokens || 256,
          temperature: this.config.temperature || 0.7,
          topP: this.config.topP || 0.9,
        },
      };

      // Add system instruction if present
      if (systemInstruction) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstruction }],
        };
      }

      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        this.config.timeout || 30000
      );

      const response = await fetch(
        `${this.baseUrl}/models/${this.config.model}:generateContent?key=${this.config.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        }
      );

      clearTimeout(timeout);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        if (response.status === 400) {
          if (errorData.error?.message?.includes('API_KEY')) {
            throw createServiceError(
              'llama',
              'INVALID_API_KEY',
              'Invalid or expired Google API key'
            );
          }
          throw createServiceError(
            'llama',
            'INVALID_REQUEST',
            `Invalid request: ${errorData.error?.message || 'Unknown error'}`
          );
        } else if (response.status === 429) {
          throw createServiceError(
            'llama',
            'RATE_LIMIT',
            'Rate limit exceeded. Please try again later.'
          );
        } else if (response.status >= 500) {
          throw createServiceError(
            'llama',
            'SERVER_ERROR',
            'Google server error. Please try again later.'
          );
        } else {
          throw createServiceError(
            'llama',
            'API_ERROR',
            `Google API error: ${response.status} ${errorData.error?.message || ''}`
          );
        }
      }

      const data: GoogleResponse = await response.json();

      if (!data.candidates || data.candidates.length === 0) {
        throw createServiceError(
          'llama',
          'NO_RESPONSE',
          'No response generated from Google'
        );
      }

      const candidate = data.candidates[0];

      // Check for safety filtering
      if (candidate?.finishReason === 'SAFETY') {
        throw createServiceError(
          'llama',
          'SAFETY_FILTERED',
          'Response was filtered due to safety concerns'
        );
      }

      const textParts = candidate?.content?.parts?.filter((part) => part.text);

      if (!textParts || textParts.length === 0) {
        throw createServiceError(
          'llama',
          'EMPTY_RESPONSE',
          'Empty response from Google'
        );
      }

      // Combine all text parts
      const assistantMessage = textParts
        .map((part) => part.text)
        .join('')
        .trim();

      if (!assistantMessage) {
        throw createServiceError(
          'llama',
          'EMPTY_RESPONSE',
          'Empty response from Google'
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
        'Failed to connect to Google API',
        error
      );
    }
  }
}
