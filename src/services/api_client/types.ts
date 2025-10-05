import { SlideMetadata, DocumentMetadata, FilterOptions, SearchFilters, Presentation, ChatMessage } from '../../types';

export interface SearchAPI {
  searchSlides(query: string, filters: SearchFilters): Promise<SlideMetadata[]>;
  searchDocuments(query: string, filters: SearchFilters): Promise<DocumentMetadata[]>;
  getFilterOptions(): Promise<FilterOptions>;
  getPresentation(documentId: string): Promise<Presentation>;
}

export interface ChatAPI {
  sendMessage(message: string, sessionId?: string): Promise<ChatMessage>;
}

export interface SearchSlidesRequest {
  query: string;
  filters: SearchFilters;
}

export interface SearchSlidesResponse {
  slides: SlideMetadata[];
}

export interface SearchDocumentsRequest {
  query: string;
  filters: SearchFilters;
}

export interface SearchDocumentsResponse {
  documents: DocumentMetadata[];
}

export interface FilterOptionsResponse {
  clients: string[];
  regions: string[];
  industries: string[];
}

export interface PresentationSlide {
  id: string;
  title: string;
  slideNumber: number;
  previewUrl: string;
  content?: string;
}

export interface PresentationResponse {
  id: string;
  title: string;
  metadata: {
    clientName: string;
    industry: string;
    region: string;
    creationDate: string;
  };
  slides: PresentationSlide[];
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface SlideReference {
  id: string;
  documentId: string;
  slideNumber: number;
}

export interface ChatResponse {
  id: string;
  role: 'assistant';
  content: string;
  slides?: SlideReference[];
  timestamp: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
