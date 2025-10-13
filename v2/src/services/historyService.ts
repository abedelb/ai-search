import { ChatSession, ChatMessage, SearchHistoryItem, SearchFilters } from '../types';

interface StoredChatSession {
  id: string;
  sessionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface StoredChatMessage {
  id: string;
  chatSessionId: string;
  role: 'user' | 'assistant';
  content: string;
  slides: any[];
  createdAt: string;
}

interface StoredSearchHistoryItem {
  id: string;
  sessionId: string;
  query: string;
  searchMode: 'slides' | 'documents';
  filters: SearchFilters;
  resultCount: number;
  createdAt: string;
}

class HistoryService {
  private sessionId: string;
  private chatSessionsKey = 'chat_sessions';
  private chatMessagesKey = 'chat_messages';
  private searchHistoryKey = 'search_history';

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('user_session_id');
    if (!sessionId) {
      sessionId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('user_session_id', sessionId);
    }
    return sessionId;
  }

  private generateChatTitle(firstMessage: string): string {
    const maxLength = 50;
    if (!firstMessage) {
      return 'New Chat';
    }
    const cleaned = firstMessage.trim();
    if (!cleaned) {
      return 'New Chat';
    }
    if (cleaned.length <= maxLength) {
      return cleaned;
    }
    return cleaned.substring(0, maxLength - 3) + '...';
  }

  private getAllChatSessions(): StoredChatSession[] {
    const data = localStorage.getItem(this.chatSessionsKey);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveChatSessions(sessions: StoredChatSession[]): void {
    localStorage.setItem(this.chatSessionsKey, JSON.stringify(sessions));
  }

  private getAllChatMessages(): StoredChatMessage[] {
    const data = localStorage.getItem(this.chatMessagesKey);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveChatMessages(messages: StoredChatMessage[]): void {
    localStorage.setItem(this.chatMessagesKey, JSON.stringify(messages));
  }

  private getAllSearchHistory(): StoredSearchHistoryItem[] {
    const data = localStorage.getItem(this.searchHistoryKey);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveSearchHistoryItems(items: StoredSearchHistoryItem[]): void {
    localStorage.setItem(this.searchHistoryKey, JSON.stringify(items));
  }

  async createChatSession(firstUserMessage: string = ''): Promise<string> {
    const title = this.generateChatTitle(firstUserMessage);
    const allSessions = this.getAllChatSessions();

    const newSession: StoredChatSession = {
      id: `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      title,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageCount: 0,
    };

    allSessions.push(newSession);
    this.saveChatSessions(allSessions);

    return newSession.id;
  }

  async saveChatMessage(
    chatSessionId: string,
    message: ChatMessage
  ): Promise<void> {
    const allMessages = this.getAllChatMessages();

    const newMessage: StoredChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatSessionId,
      role: message.role,
      content: message.content,
      slides: message.slides || [],
      createdAt: new Date().toISOString(),
    };

    allMessages.push(newMessage);
    this.saveChatMessages(allMessages);

    const allSessions = this.getAllChatSessions();
    const session = allSessions.find(s => s.id === chatSessionId);
    if (session) {
      session.messageCount = allMessages.filter(m => m.chatSessionId === chatSessionId).length;
      session.updatedAt = new Date().toISOString();
      this.saveChatSessions(allSessions);
    }
  }

  async getChatSessions(): Promise<ChatSession[]> {
    const allSessions = this.getAllChatSessions();
    return allSessions
      .filter(session => session.sessionId === this.sessionId)
      .map(session => ({
        id: session.id,
        sessionId: session.sessionId,
        title: session.title,
        createdAt: new Date(session.createdAt),
        updatedAt: new Date(session.updatedAt),
        messageCount: session.messageCount,
      }))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getChatMessages(chatSessionId: string): Promise<ChatMessage[]> {
    const allMessages = this.getAllChatMessages();
    return allMessages
      .filter(msg => msg.chatSessionId === chatSessionId)
      .map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        slides: msg.slides,
        timestamp: new Date(msg.createdAt),
      }))
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async deleteChatSession(chatSessionId: string): Promise<void> {
    const allSessions = this.getAllChatSessions();
    const filteredSessions = allSessions.filter(s => s.id !== chatSessionId);
    this.saveChatSessions(filteredSessions);

    const allMessages = this.getAllChatMessages();
    const filteredMessages = allMessages.filter(m => m.chatSessionId !== chatSessionId);
    this.saveChatMessages(filteredMessages);
  }

  async updateChatSessionTitle(chatSessionId: string, title: string): Promise<void> {
    const allSessions = this.getAllChatSessions();
    const session = allSessions.find(s => s.id === chatSessionId);
    if (session) {
      session.title = title;
      session.updatedAt = new Date().toISOString();
      this.saveChatSessions(allSessions);
    }
  }

  async saveSearchHistory(
    query: string,
    searchMode: 'slides' | 'documents',
    filters: SearchFilters,
    resultCount: number
  ): Promise<void> {
    if (!query.trim()) return;

    const allHistory = this.getAllSearchHistory();

    const newItem: StoredSearchHistoryItem = {
      id: `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      query,
      searchMode,
      filters,
      resultCount,
      createdAt: new Date().toISOString(),
    };

    allHistory.push(newItem);
    this.saveSearchHistoryItems(allHistory);
  }

  async getSearchHistory(limit: number = 50): Promise<SearchHistoryItem[]> {
    const allHistory = this.getAllSearchHistory();
    return allHistory
      .filter(item => item.sessionId === this.sessionId)
      .map(item => ({
        id: item.id,
        sessionId: item.sessionId,
        query: item.query,
        searchMode: item.searchMode,
        filters: item.filters,
        resultCount: item.resultCount,
        createdAt: new Date(item.createdAt),
      }))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async deleteSearchHistoryItem(id: string): Promise<void> {
    const allHistory = this.getAllSearchHistory();
    const filtered = allHistory.filter(item => item.id !== id);
    this.saveSearchHistoryItems(filtered);
  }

  async clearSearchHistory(): Promise<void> {
    const allHistory = this.getAllSearchHistory();
    const filtered = allHistory.filter(item => item.sessionId !== this.sessionId);
    this.saveSearchHistoryItems(filtered);
  }
}

export const historyService = new HistoryService();
