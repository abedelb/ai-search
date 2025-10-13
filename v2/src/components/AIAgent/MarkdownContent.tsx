import React from 'react';
import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

interface Citation {
  slideId: string;
  documentId: string;
  slideNumber: number;
  citationNumber: number;
}

interface MarkdownContentProps {
  content: string;
  citations: Citation[];
  messageId: string;
  isStreaming?: boolean;
  hasActiveStep?: boolean;
  onCitationClick: (citation: Citation) => void;
}

export const MarkdownContent: React.FC<MarkdownContentProps> = ({
  content,
  citations,
  messageId,
  isStreaming,
  hasActiveStep,
  onCitationClick,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const processedContent = React.useMemo(() => {
    return content.replace(/(\[\d+\])/g, (match) => {
      const citationNum = parseInt(match.match(/\d+/)![0]);
      return `<sup class="citation-marker" data-citation="${citationNum}">${match}</sup>`;
    });
  }, [content]);

  const htmlContent = React.useMemo(() => {
    return marked.parse(processedContent) as string;
  }, [processedContent]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const citationButtons = container.querySelectorAll('.citation-marker');
    const handlers: Array<{ element: Element; handler: EventListener }> = [];

    citationButtons.forEach((button) => {
      const citationNum = parseInt(button.getAttribute('data-citation') || '0');
      const citation = citations.find(c => c.citationNumber === citationNum);

      if (citation) {
        const handler = (e: Event) => {
          e.preventDefault();
          onCitationClick(citation);
        };
        button.addEventListener('click', handler);
        handlers.push({ element: button, handler });
      }
    });

    return () => {
      handlers.forEach(({ element, handler }) => {
        element.removeEventListener('click', handler);
      });
    };
  }, [citations, onCitationClick]);

  return (
    <div ref={containerRef} className="prose prose-neutral max-w-none">
      <div
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        className="markdown-content"
      />
      {isStreaming && !hasActiveStep && (
        <span className="inline-block w-2 h-4 bg-primary-600 animate-pulse ml-1" />
      )}
    </div>
  );
};
