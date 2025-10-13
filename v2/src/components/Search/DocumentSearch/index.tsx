import React, { useState } from 'react';
import { FeedbackContainer } from '../../Feedback/FeedbackContainer';
import { SlidePreviewModal } from '../../Preview/SlidePreviewModal';
import { useDocumentSearch } from './useDocumentSearch';
import { useDocumentFeedback } from './useDocumentFeedback';
import { DocumentList } from './DocumentList';
import { DocumentMetadata, FilterOptions, SearchFilters } from '../../../types';

interface DocumentSearchProps {
  externalQuery?: string;
  externalFilters?: SearchFilters;
  externalFilterOptions?: FilterOptions;
  itemsPerPage?: number;
}

export const DocumentSearch: React.FC<DocumentSearchProps> = ({
  externalQuery,
  externalFilters,
  externalFilterOptions,
  itemsPerPage = 10,
}) => {
  const {
    documents,
    loading,
  } = useDocumentSearch(externalQuery, externalFilters);

  const {
    feedbackDocId,
    setFeedbackDocId,
    thumbUpDocs,
    thumbDownDocs,
    handleThumbUp,
    handleThumbDown,
  } = useDocumentFeedback();

  const [previewDoc, setPreviewDoc] = useState<DocumentMetadata | null>(null);

  const handleDocClick = (doc: DocumentMetadata) => {
    setPreviewDoc(doc);
  };

  return (
    <>
      <DocumentList
        documents={documents}
        loading={loading}
        thumbUpDocs={thumbUpDocs}
        thumbDownDocs={thumbDownDocs}
        onThumbUp={handleThumbUp}
        onThumbDown={handleThumbDown}
        onDocClick={handleDocClick}
        itemsPerPage={itemsPerPage}
      />

      {previewDoc && (
        <SlidePreviewModal
          documentId={previewDoc.id}
          initialSlideNumber={1}
          onClose={() => setPreviewDoc(null)}
        />
      )}

      {feedbackDocId && (
        <FeedbackContainer
          contextType="document_search"
          contextId={feedbackDocId}
          metadata={{
            query: externalQuery || '',
            filters: externalFilters || { clients: [], regions: [], industries: [] },
            documentTitle: documents.find(d => d.id === feedbackDocId)?.title,
          }}
          onClose={() => setFeedbackDocId(null)}
        />
      )}
    </>
  );
};
