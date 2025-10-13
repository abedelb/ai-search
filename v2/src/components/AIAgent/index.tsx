import React, { useState, useEffect } from 'react';
import { SlidePreviewModal } from '../Preview/SlidePreviewModal';
import { FeedbackWidget } from '../Feedback/FeedbackWidget';
import { FilterPanel } from '../Filter/FilterPanel';
import { historyService } from '../../services/historyService';
import { searchAPI } from '../../services/api_client';
import { ChatHeader } from './ChatHeader';
import { EmptyChat } from './EmptyChat';
import { MessageBubble } from './MessageBubble';
import { ReferencedSlides } from './ReferencedSlides';
import { ChatInput } from './ChatInput';
import { useAIChat } from './useAIChat';
import { useSlideFeedback } from './useSlideFeedback';
import { Citation } from './types';
import { FilterOptions, SearchFilters } from '../../types';

interface AIAgentProps {
  currentSessionId: string | null;
  onSessionIdChange: (sessionId: string | null) => void;
  filtersOpen: boolean;
  filterPanelWidth?: number;
  onFilterPanelWidthChange?: (width: number) => void;
}

export const AIAgent: React.FC<AIAgentProps> = ({
  currentSessionId,
  onSessionIdChange,
  filtersOpen,
  filterPanelWidth = 320,
  onFilterPanelWidthChange,
}) => {
  const {
    messages,
    input,
    setInput,
    isStreaming,
    expandedSteps,
    messagesEndRef,
    toggleStep,
    handleStopStreaming,
    sendMessage,
  } = useAIChat(currentSessionId);

  const {
    thumbUpSlides,
    thumbDownSlides,
    feedbackSlideId,
    setFeedbackSlideId,
    handleThumbUp,
    handleThumbDown,
  } = useSlideFeedback();

  const [previewSlide, setPreviewSlide] = useState<{ documentId: string; slideNumber: number } | null>(null);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    clients: [],
    regions: [],
    industries: [],
  });
  const [filters, setFilters] = useState<SearchFilters>({
    clients: [],
    regions: [],
    industries: [],
  });

  useEffect(() => {
    loadFilterOptions();
  }, []);

  const loadFilterOptions = async () => {
    const options = await searchAPI.getFilterOptions();
    setFilterOptions(options);
  };

  const handleCitationClick = (citation: Citation) => {
    setPreviewSlide({
      documentId: citation.documentId,
      slideNumber: citation.slideNumber,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await historyService.createChatSession(input);
      onSessionIdChange(sessionId);
    }

    const userMessageId = `user-${Date.now()}`;
    const assistantMessageId = `assistant-${Date.now()}`;

    await sendMessage(sessionId, userMessageId, assistantMessageId, setFeedbackMessageId, filters);
  };

  const ResizableFilterPanel: React.FC = () => {
    const [isResizing, setIsResizing] = React.useState(false);
    const startXRef = React.useRef<number>(0);
    const startWidthRef = React.useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = filterPanelWidth;
      e.preventDefault();
    };

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isResizing && onFilterPanelWidthChange) {
          const delta = e.clientX - startXRef.current;
          const newWidth = Math.min(Math.max(250, startWidthRef.current + delta), 600);
          onFilterPanelWidthChange(newWidth);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }, [isResizing]);

    return (
      <div className="relative flex-shrink-0" style={{ width: `${filterPanelWidth}px` }}>
        <FilterPanel
          filterOptions={filterOptions}
          activeFilters={filters}
          onFilterChange={setFilters}
        />
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize group hover:bg-primary-400/50 transition-colors z-50"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-16 bg-primary-500 rounded-l opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full w-full">
      {filtersOpen && <ResizableFilterPanel />}
      <div className="flex-1 flex flex-col h-full w-full bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      <ChatHeader />

      <div className="flex-1 overflow-y-auto scrollbar-primary w-full">
        <div className="px-8 py-8 space-y-6 w-full">
          {messages.length === 0 && (
            <EmptyChat onSuggestionClick={setInput} />
          )}

          {messages.map((message) => (
            <div key={message.id} className="w-full">
              <MessageBubble
                message={message}
                expandedSteps={expandedSteps}
                onToggleStep={toggleStep}
                onCitationClick={handleCitationClick}
              />

              {message.role === 'assistant' && message.slides && !message.isStreaming && (
                <ReferencedSlides
                  slides={message.slides}
                  thumbUpSlides={thumbUpSlides}
                  thumbDownSlides={thumbDownSlides}
                  onThumbUp={handleThumbUp}
                  onThumbDown={handleThumbDown}
                  onSlideClick={(slide) =>
                    setPreviewSlide({
                      documentId: slide.documentId,
                      slideNumber: slide.slideNumber,
                    })
                  }
                />
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <ChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onStop={handleStopStreaming}
        isStreaming={isStreaming}
      />

      {previewSlide && (
        <SlidePreviewModal
          documentId={previewSlide.documentId}
          initialSlideNumber={previewSlide.slideNumber}
          onClose={() => setPreviewSlide(null)}
        />
      )}

      {feedbackMessageId && (
        <div className="fixed bottom-24 right-6 z-40">
          <FeedbackWidget
            contextType="ai_response"
            contextId={feedbackMessageId}
            metadata={{
              messageCount: messages.length,
              hadSources: messages.find(m => m.id === feedbackMessageId)?.slides?.length || 0,
            }}
            onClose={() => setFeedbackMessageId(null)}
            compact
          />
        </div>
      )}

      {feedbackSlideId && (
        <div className="fixed bottom-24 right-6 z-40">
          <FeedbackWidget
            contextType="slide_view"
            contextId={feedbackSlideId}
            onClose={() => setFeedbackSlideId(null)}
            compact
          />
        </div>
      )}
      </div>
    </div>
  );
};
