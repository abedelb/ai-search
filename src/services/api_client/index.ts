import { SearchAPI, ChatAPI } from './types';
import { RealSearchAPI } from './searchAPI';
import { RealChatAPI } from './chatAPI';
import { MockSearchAPI } from '../mock_api/mockSearchAPI';
import { MockChatAPI } from '../mock_api/mockChatAPI';
import { MockStreamingChatAPI } from '../mock_api/streamingChatAPI';
import type { StreamingChatAPI } from '../mock_api/streamingChatAPI';

const USE_MOCK_API = true;

export const searchAPI: SearchAPI = USE_MOCK_API
  ? new MockSearchAPI()
  : new RealSearchAPI();

export const chatAPI: ChatAPI = USE_MOCK_API
  ? new MockChatAPI()
  : new RealChatAPI();

export const streamingChatAPI: StreamingChatAPI = new MockStreamingChatAPI();

export { type StreamChunk, type AgentStep } from '../mock_api/streamingChatAPI';
export * from './types';
