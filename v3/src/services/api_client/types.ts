import { SlideMetadata, DocumentMetadata, FilterOptions, SearchFilters, Presentation } from '../../types';

export interface SearchAPI {
  searchSlides(query: string, filters: SearchFilters): Promise<SlideMetadata[]>;
  searchDocuments(query: string, filters: SearchFilters): Promise<DocumentMetadata[]>;
  getFilterOptions(): Promise<FilterOptions>;
  getPresentation(documentId: string): Promise<Presentation>;
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
  pptxSignedUrl?: string;
  content?: string;
}

export interface PresentationResponse {
  id: string;
  title: string;
  pptxSignedUrl: string;
  metadata: {
    clientName: string;
    industry: string;
    region: string;
    creationDate: string;
  };
  slides: PresentationSlide[];
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}
