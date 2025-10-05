import { FeedbackData } from '../types';

interface StoredFeedback extends Omit<FeedbackData, 'sessionId'> {
  id: string;
  sessionId: string;
  createdAt: string;
}

class FeedbackService {
  private sessionId: string;
  private storageKey = 'feedback_data';

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('feedback_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('feedback_session_id', sessionId);
    }
    return sessionId;
  }

  private getAllFeedback(): StoredFeedback[] {
    const data = localStorage.getItem(this.storageKey);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private saveFeedback(feedback: StoredFeedback[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(feedback));
  }

  async submitFeedback(data: Omit<FeedbackData, 'sessionId'>): Promise<void> {
    const allFeedback = this.getAllFeedback();

    const newFeedback: StoredFeedback = {
      id: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      sessionId: this.sessionId,
      contextType: data.contextType,
      contextId: data.contextId,
      foundWhatLookingFor: data.foundWhatLookingFor,
      rating: data.rating,
      feedbackText: data.feedbackText,
      metadata: data.metadata || {},
      createdAt: new Date().toISOString(),
    };

    allFeedback.push(newFeedback);
    this.saveFeedback(allFeedback);
  }

  async hasFeedbackForContext(contextType: string, contextId: string): Promise<boolean> {
    const allFeedback = this.getAllFeedback();
    return allFeedback.some(
      feedback =>
        feedback.sessionId === this.sessionId &&
        feedback.contextType === contextType &&
        feedback.contextId === contextId
    );
  }
}

export const feedbackService = new FeedbackService();
