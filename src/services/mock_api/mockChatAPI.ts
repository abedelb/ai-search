import { ChatMessage } from '../../types';
import { ChatAPI } from '../api_client/types';
import chatResponsesData from '../fake_data/chat_responses.json';

export class MockChatAPI implements ChatAPI {
  private responses = chatResponsesData.responses;

  async sendMessage(message: string): Promise<ChatMessage> {
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responseIndex = Math.floor(Math.random() * this.responses.length);
    const responseData = this.responses[responseIndex];

    return {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: responseData.content,
      slides: responseData.slides,
      timestamp: new Date(),
    };
  }
}
