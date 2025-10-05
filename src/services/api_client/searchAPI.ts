import { SlideMetadata, DocumentMetadata, FilterOptions, SearchFilters, Presentation } from '../../types';
import { SearchAPI } from './types';

export class RealSearchAPI implements SearchAPI {
  private baseUrl: string;

  constructor(baseUrl: string = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1') {
    this.baseUrl = baseUrl;
  }

  async searchSlides(query: string, filters: SearchFilters): Promise<SlideMetadata[]> {
    const response = await fetch(`${this.baseUrl}/slides/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, filters }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Failed to search slides' } }));
      throw new Error(error.error?.message || 'Failed to search slides');
    }

    const data = await response.json();
    return data.slides || data;
  }

  async searchDocuments(query: string, filters: SearchFilters): Promise<DocumentMetadata[]> {
    const response = await fetch(`${this.baseUrl}/documents/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, filters }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: 'Failed to search documents' } }));
      throw new Error(error.error?.message || 'Failed to search documents');
    }

    const data = await response.json();
    return data.documents || data;
  }

  async getFilterOptions(): Promise<FilterOptions> {
    const response = await fetch(`${this.baseUrl}/filters`);

    if (!response.ok) {
      throw new Error('Failed to get filter options');
    }

    return response.json();
  }

  async getPresentation(documentId: string): Promise<Presentation> {
    const response = await fetch(`${this.baseUrl}/presentations/${documentId}`);

    if (!response.ok) {
      throw new Error('Failed to get presentation');
    }

    return response.json();
  }
}
