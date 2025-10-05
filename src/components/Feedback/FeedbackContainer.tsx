import React from 'react';
import { FeedbackWidget } from './FeedbackWidget';

interface FeedbackContainerProps {
  contextType: 'search_results' | 'ai_response' | 'slide_view' | 'general' | 'slide_search' | 'document_search';
  contextId: string;
  metadata: Record<string, any>;
  onClose: () => void;
}

export const FeedbackContainer: React.FC<FeedbackContainerProps> = ({
  contextType,
  contextId,
  metadata,
  onClose,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <FeedbackWidget
        contextType={contextType}
        contextId={contextId}
        metadata={metadata}
        onClose={onClose}
        compact
      />
    </div>
  );
};
