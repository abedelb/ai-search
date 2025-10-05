import { SlideMetadata, DocumentMetadata, FilterOptions, SearchFilters, Presentation } from '../../types';
import { SearchAPI } from '../api_client/types';
import slidesData from '../fake_data/slides.json';
import documentsData from '../fake_data/documents.json';
import filtersData from '../fake_data/filters.json';
import presentationsData from '../fake_data/presentations.json';

export class MockSearchAPI implements SearchAPI {
  private allSlides: SlideMetadata[] = slidesData.slides;
  private allDocuments: DocumentMetadata[] = documentsData.documents;
  private filterOptions: FilterOptions = filtersData;
  private presentations: Presentation[] = presentationsData.presentations;

  private getDocumentNameMap(): Map<string, string> {
    const map = new Map<string, string>();
    this.presentations.forEach(pres => {
      map.set(pres.id, pres.title);
    });
    return map;
  }

  async searchSlides(query: string, filters: SearchFilters): Promise<SlideMetadata[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    const docNameMap = this.getDocumentNameMap();
    let slides = [...this.allSlides].map(slide => ({
      ...slide,
      documentName: docNameMap.get(slide.documentId) || slide.documentName
    }));

    if (filters.clients.length > 0) {
      slides = slides.filter(s => filters.clients.includes(s.clientName));
    }
    if (filters.regions.length > 0) {
      slides = slides.filter(s => filters.regions.includes(s.region));
    }
    if (filters.industries.length > 0) {
      slides = slides.filter(s => filters.industries.includes(s.industry));
    }

    if (query) {
      slides = slides.filter(s =>
        s.title.toLowerCase().includes(query.toLowerCase()) ||
        s.industry.toLowerCase().includes(query.toLowerCase()) ||
        s.clientName.toLowerCase().includes(query.toLowerCase())
      );
    }

    return slides;
  }

  async searchDocuments(query: string, filters: SearchFilters): Promise<DocumentMetadata[]> {
    await new Promise(resolve => setTimeout(resolve, 800));

    let docs = [...this.allDocuments];

    if (filters.clients.length > 0) {
      docs = docs.filter(d => filters.clients.includes(d.clientName));
    }
    if (filters.regions.length > 0) {
      docs = docs.filter(d => filters.regions.includes(d.region));
    }
    if (filters.industries.length > 0) {
      docs = docs.filter(d => filters.industries.includes(d.industry));
    }

    if (query) {
      docs = docs.filter(d =>
        d.title.toLowerCase().includes(query.toLowerCase()) ||
        d.industry.toLowerCase().includes(query.toLowerCase()) ||
        d.clientName.toLowerCase().includes(query.toLowerCase())
      );
    }

    return docs;
  }

  async getFilterOptions(): Promise<FilterOptions> {
    await new Promise(resolve => setTimeout(resolve, 300));
    return this.filterOptions;
  }

  async getPresentation(documentId: string): Promise<Presentation> {
    await new Promise(resolve => setTimeout(resolve, 600));

    const presentation = this.presentations.find(p => p.id === documentId);

    if (!presentation) {
      throw new Error('Presentation not found');
    }

    return presentation;
  }
}
