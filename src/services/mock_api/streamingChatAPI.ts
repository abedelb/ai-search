import { ChatMessage, SlideMetadata } from '../../types';
import slidesData from '../fake_data/slides.json';

const getRandomSlides = (count: number = 3): SlideMetadata[] => {
  const slides = slidesData.slides;
  const shuffled = [...slides].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
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

const responseTemplates = [
  `Based on my analysis of the presentations, here are the **key insights**:

## Market Overview

The technology sector demonstrates **strong growth potential** with several compelling indicators:

- **Projected CAGR**: 12.5% over the next five years [1]
- **Primary Growth Driver**: Cloud adoption and digital transformation initiatives [2]
- **Market Leadership**: Focus on innovative solutions and platform ecosystems

## Regional Analysis

| Region | Market Share | Growth Rate |
|--------|--------------|-------------|
| North America | 45% | High |
| Europe | 30% | Moderate |
| Asia-Pacific | 25% | Accelerating |

*Source: Market analysis presentations* [3]

## Key Considerations

> Important: Regulatory compliance and cybersecurity remain critical challenges across all segments.

The competitive landscape continues to evolve with increased focus on:
1. Digital transformation
2. Cloud infrastructure
3. Data security
4. Sustainable practices`,

  `I've analyzed the relevant presentations and found **significant insights** about current trends:

## Revenue Performance

The sector shows **consistent growth** with impressive metrics:

- Year-over-year growth: **15-18%** sustained over multiple quarters [1]
- Customer acquisition costs: **Decreased by 23%** through digital marketing [2]
- Operational efficiency: Strong improvement in key metrics

## Competitive Landscape

The market is experiencing **dynamic changes**:

### New Market Entrants
- Three new competitors disrupting traditional business models
- Focus on innovative, technology-driven solutions
- Challenging incumbent market positions [3]

### Strategic Activity
> **Q3-Q4 Outlook**: Expect increased M&A activity and strategic partnerships

## Key Takeaways

✓ Strong revenue momentum continues\n✓ Marketing efficiency gains realized\n✓ Competitive dynamics intensifying\n✓ Strategic consolidation expected`,

  `After reviewing the slides, I can provide **comprehensive insights** on the current market dynamics:

## Market Trends

The investment landscape is shifting significantly:

### ESG Focus
- **Sustainability**: Primary consideration in investment decisions [1]
- **ESG Integration**: Systematic approach to environmental and social factors
- Market leaders adapting strategies to meet stakeholder expectations

## Consumer Behavior

Analysis reveals **changing preferences**:

| Trend | Impact | Priority |
|-------|--------|----------|
| Personalization | High | Critical |
| Digital Experience | High | Critical |
| Sustainability | Growing | Important |

*Consumer insights from recent research* [2]

## Operational Performance

Portfolio companies demonstrate **strong execution**:

- Margin expansion: **4-6%** across the portfolio [3]
- Efficiency improvements through operational excellence
- Technology enablement driving productivity

## Risk Assessment

> Risk Level: **Moderate** - Well-managed through diversification strategies

The portfolio maintains balanced exposure with effective risk mitigation measures in place.`
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

    // Generate slides for citations
    const slides = getRandomSlides(3);

    // Stream the response content with markdown
    const template = responseTemplates[Math.floor(Math.random() * responseTemplates.length)];

    // Find and process citations in the markdown
    const citationPattern = /\[(\d+)\]/g;
    const matches = Array.from(template.matchAll(citationPattern));

    // Stream the entire markdown content with citation tracking
    await this.streamText(template, onChunk, signal);

    // Send citation data
    matches.forEach((match, index) => {
      const citationNum = parseInt(match[1]);
      const slideIndex = (citationNum - 1) % slides.length;
      const slide = slides[slideIndex];

      onChunk({
        type: 'citation',
        citation: {
          slideId: slide.id,
          documentId: slide.documentId,
          slideNumber: slide.slideNumber,
          citationNumber: citationNum,
        },
      });
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
