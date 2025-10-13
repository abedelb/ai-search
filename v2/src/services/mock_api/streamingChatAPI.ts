import { SlideMetadata } from '../../types';
import searchData from '../fake_data/search_results.json';
import ragData from '../fake_data/rag_results.json';

interface RAGSlideReference {
  documentId: string;
  slideNumber: number;
  relevanceScore: number;
  reason: string;
}

const getSlidesFromReferences = (references: RAGSlideReference[]): SlideMetadata[] => {
  const slides: SlideMetadata[] = [];

  references.forEach(ref => {
    const doc = searchData.documents.find(d => d.id === ref.documentId);
    if (!doc) return;

    const slide = doc.slides.find(s => s.slideNumber === ref.slideNumber);
    if (!slide) return;

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

  return slides;
};

const findBestRAGMatch = (query: string) => {
  const lowerQuery = query.toLowerCase();

  // Try to find exact or close match
  for (const conversation of ragData.conversations) {
    if (lowerQuery.includes(conversation.query.toLowerCase()) ||
        conversation.query.toLowerCase().includes(lowerQuery)) {
      return conversation.response;
    }
  }

  // Check for keyword matches
  const keywords = lowerQuery.split(' ').filter(word => word.length > 4);
  for (const conversation of ragData.conversations) {
    const convKeywords = conversation.query.toLowerCase().split(' ');
    const matchCount = keywords.filter(kw =>
      convKeywords.some(ck => ck.includes(kw) || kw.includes(ck))
    ).length;

    if (matchCount >= 2) {
      return conversation.response;
    }
  }

  // Fallback to random conversation
  const randomIndex = Math.floor(Math.random() * ragData.conversations.length);
  return ragData.conversations[randomIndex].response;
};

export type AgentStep = 'reasoning' | 'searching' | 'analyzing' | 'summarizing' | 'complete';

export interface StreamChunk {
  type: 'step' | 'step_content' | 'step_complete' | 'content' | 'citation' | 'complete';
  step?: AgentStep;
  content?: string;
  stepTitle?: string;
  citation?: {
    slideId: string;
    documentId: string;
    slideNumber: number;
    citationNumber: number;
  };
  slides?: SlideMetadata[];
}

export interface StreamingChatAPI {
  streamMessage(
    message: string,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void>;
}

const agentSteps: {
  step: AgentStep;
  title: string;
  duration: number;
  generateContent: (query: string) => string[];
}[] = [
  {
    step: 'reasoning',
    title: 'Understanding your question',
    duration: 2000,
    generateContent: (query) => [
      `Breaking down the query: "${query}"`,
      'Identifying key entities: technology sector, market trends, growth potential',
      'Determining search strategy: presentations, market analysis, financial reports',
      'Planning response structure: market overview, key metrics, regional breakdown'
    ]
  },
  {
    step: 'searching',
    title: 'Searching knowledge base',
    duration: 2500,
    generateContent: () => [
      'Searching presentations: "technology sector" OR "tech market"',
      'Found 127 relevant slides across 23 documents',
      'Filtering by recency: last 18 months',
      'Ranking by relevance score and document authority'
    ]
  },
  {
    step: 'analyzing',
    title: 'Analyzing relevant content',
    duration: 2200,
    generateContent: () => [
      'Extracting data points from top 15 slides',
      'Identifying patterns: consistent growth trend, cloud adoption key driver',
      'Cross-referencing statistics across multiple sources',
      'Validating findings against industry benchmarks'
    ]
  },
  {
    step: 'summarizing',
    title: 'Synthesizing insights',
    duration: 1800,
    generateContent: () => [
      'Organizing findings into coherent structure',
      'Adding source citations for key claims',
      'Ensuring response addresses all aspects of query',
      'Formatting final answer with supporting evidence'
    ]
  },
];

export class MockStreamingChatAPI implements StreamingChatAPI {
  async streamMessage(
    message: string,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void> {
    // Check if aborted before starting
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    // Add small initial delay to ensure UI is ready
    await this.delay(100, signal);

    // Simulate agent steps with detailed content
    for (const { step, title, duration, generateContent } of agentSteps) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      // Start step
      onChunk({ type: 'step', step, stepTitle: title });

      // Stream step content
      const stepDetails = generateContent(message);
      for (const detail of stepDetails) {
        if (signal?.aborted) {
          throw new DOMException('Aborted', 'AbortError');
        }
        onChunk({ type: 'step_content', step, content: detail });
        await this.delay(duration / stepDetails.length, signal);
      }

      // Complete step
      onChunk({ type: 'step_complete', step });
      await this.delay(200, signal);
    }

    // Get RAG response based on query
    const ragResponse = findBestRAGMatch(message);

    // Get slides from RAG references
    const slides = getSlidesFromReferences(ragResponse.relevantSlides);

    // Stream the response content
    await this.streamText(ragResponse.answer, onChunk, signal);

    // Send citation data based on relevantSlides order
    ragResponse.relevantSlides.forEach((ref, index) => {
      const slide = slides[index];
      if (slide) {
        onChunk({
          type: 'citation',
          citation: {
            slideId: slide.id,
            documentId: slide.documentId,
            slideNumber: slide.slideNumber,
            citationNumber: index + 1,
          },
        });
      }
    });

    // Send completion with all slides
    onChunk({
      type: 'complete',
      slides,
    });
  }

  private async streamText(
    text: string,
    onChunk: (chunk: StreamChunk) => void,
    signal?: AbortSignal
  ): Promise<void> {
    const words = text.split(' ');

    for (const word of words) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      onChunk({
        type: 'content',
        content: word + ' ',
      });

      // Random delay between 30-80ms for realistic streaming
      await this.delay(Math.random() * 50 + 30, signal);
    }
  }

  private delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(resolve, ms);

      if (signal) {
        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new DOMException('Aborted', 'AbortError'));
        });
      }
    });
  }
}
