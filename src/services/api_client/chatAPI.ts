import { ChatMessage } from '../../types';
import { ChatAPI } from './types';

export class RealChatAPI implements ChatAPI {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(message: string, sessionId?: string): Promise<ChatMessage> {
    const response = await fetch(`${this.baseUrl}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message, sessionId }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Failed to send message' } }));
      throw new Error(error.error?.message || 'Failed to send message');
    }

    return response.json();
  }
}
