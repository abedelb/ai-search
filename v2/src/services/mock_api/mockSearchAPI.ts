import { SlideMetadata, DocumentMetadata, FilterOptions, SearchFilters, Presentation } from '../../types';
import { SearchAPI } from '../api_client/types';
import searchData from '../fake_data/search_results.json';

interface SearchDocument {
  id: string;
  title: string;
  pptxUrl: string;
  metadata: {
    clientName: string;
    industry: string;
    region: string;
    creationDate: string;
    fileType: string;
  };
  slides: Array<{
    slideNumber: number;
    title: string;
    relevanceScore: number;
    tags: string[];
  }>;
}

export class MockSearchAPI implements SearchAPI {
  private documents: SearchDocument[] = searchData.documents;
  private filterOptions: FilterOptions = searchData.filterOptions;

  async searchSlides(query: string, filters: SearchFilters): Promise<SlideMetadata[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    let filteredDocs = this.applyFilters(this.documents, filters);

    if (query) {
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.metadata.industry.toLowerCase().includes(query.toLowerCase()) ||
        doc.metadata.clientName.toLowerCase().includes(query.toLowerCase()) ||
        doc.slides.some(slide =>
          slide.title.toLowerCase().includes(query.toLowerCase()) ||
          slide.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }

    const slides: SlideMetadata[] = [];
    filteredDocs.forEach(doc => {
      doc.slides.forEach(slide => {
        slides.push({
          id: `${doc.id}-slide-${slide.slideNumber}`,
          title: slide.title,
          documentName: doc.title,
          documentId: doc.id,
          slideNumber: slide.slideNumber,
          creationDate: doc.metadata.creationDate,
          industry: doc.metadata.industry,
          region: doc.metadata.region,
          clientName: doc.metadata.clientName,
          tags: slide.tags,
          pptxSignedUrl: doc.pptxUrl,
        });
      });
    });

    // Sort by relevance score (highest first)
    slides.sort((a, b) => {
      const scoreA = this.getSlideRelevanceScore(a.documentId, a.slideNumber);
      const scoreB = this.getSlideRelevanceScore(b.documentId, b.slideNumber);
      return scoreB - scoreA;
    });

    return slides;
  }

  async searchDocuments(query: string, filters: SearchFilters): Promise<DocumentMetadata[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    let filteredDocs = this.applyFilters(this.documents, filters);

    if (query) {
      filteredDocs = filteredDocs.filter(doc =>
        doc.title.toLowerCase().includes(query.toLowerCase()) ||
        doc.metadata.industry.toLowerCase().includes(query.toLowerCase()) ||
        doc.metadata.clientName.toLowerCase().includes(query.toLowerCase())
      );
    }

    return filteredDocs.map(doc => ({
      id: doc.id,
      title: doc.title,
      creationDate: doc.metadata.creationDate,
      industry: doc.metadata.industry,
      region: doc.metadata.region,
      clientName: doc.metadata.clientName,
      fileType: doc.metadata.fileType,
      hits: doc.slides.length,
    }));
  }

  async getFilterOptions(): Promise<FilterOptions> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.filterOptions;
  }

  async getPresentation(documentId: string): Promise<Presentation> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const doc = this.documents.find(d => d.id === documentId);

    if (!doc) {
      throw new Error('Presentation not found');
    }

    return {
      id: doc.id,
      title: doc.title,
      pptxSignedUrl: doc.pptxUrl,
      metadata: doc.metadata,
      slides: doc.slides.map(slide => ({
        id: `${doc.id}-slide-${slide.slideNumber}`,
        slideNumber: slide.slideNumber,
        title: slide.title,
        pptxSignedUrl: doc.pptxUrl,
        isRelevant: slide.relevanceScore > 0.7,
        relevanceScore: slide.relevanceScore,
      })),
    };
  }

  private applyFilters(docs: SearchDocument[], filters: SearchFilters): SearchDocument[] {
    let filtered = [...docs];

    if (filters.clients.length > 0) {
      filtered = filtered.filter(d => filters.clients.includes(d.metadata.clientName));
    }
    if (filters.regions.length > 0) {
      filtered = filtered.filter(d => filters.regions.includes(d.metadata.region));
    }
    if (filters.industries.length > 0) {
      filtered = filtered.filter(d => filters.industries.includes(d.metadata.industry));
    }

    return filtered;
  }

  private getSlideRelevanceScore(documentId: string, slideNumber: number): number {
    const doc = this.documents.find(d => d.id === documentId);
    if (!doc) return 0;

    const slide = doc.slides.find(s => s.slideNumber === slideNumber);
    return slide?.relevanceScore || 0;
  }
}
