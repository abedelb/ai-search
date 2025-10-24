export interface SlideMetadata {
  id: string;
  title: string;
  documentName: string;
  documentId: string;
  slideNumber: number;
  creationDate: string;
  industry: string;
  region: string;
  clientName: string;
  pptxSignedUrl?: string;
  previewUrl?: string;
  tags?: string[];
}

export interface PresentationSlide {
  id: string;
  slideNumber: number;
  title: string;
  pptxSignedUrl?: string;
  previewUrl?: string;
  isRelevant?: boolean;
  relevanceScore?: number;
}

export interface Presentation {
  id: string;
  title: string;
  pptxSignedUrl: string;
  slides: PresentationSlide[];
  metadata: {
    clientName: string;
    industry: string;
    region: string;
    creationDate: string;
  };
}

export interface DocumentMetadata {
  id: string;
  title: string;
  creationDate: string;
  industry: string;
  region: string;
  clientName: string;
  fileType: string;
  hits: number;
}

export interface FilterOptions {
  clients: string[];
  regions: string[];
  industries: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  slides?: SlideMetadata[];
  timestamp: Date;
}

export interface SearchFilters {
  clients: string[];
  regions: string[];
  industries: string[];
}

export interface FeedbackData {
  sessionId: string;
  contextType: 'search_results' | 'ai_response' | 'slide_view' | 'general';
  contextId?: string;
  foundWhatLookingFor?: boolean;
  rating?: number;
  feedbackText?: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  sessionId: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}

export interface ChatMessageRecord {
  id: string;
  chatSessionId: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: {
    slides?: SlideMetadata[];
  };
  createdAt: Date;
}

export interface SearchHistoryItem {
  id: string;
  sessionId: string;
  query: string;
  searchMode: 'slides' | 'documents';
  filters: SearchFilters;
  resultCount: number;
  createdAt: Date;
}
