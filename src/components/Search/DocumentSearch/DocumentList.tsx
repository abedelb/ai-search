import React, { useState } from 'react';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { DocumentMetadata } from '../../../types';
import { DocumentCard } from '../../../ui/cards/DocumentCard';
import { EmptyState } from '../../../ui/widgets/EmptyState';

interface DocumentListProps {
  documents: DocumentMetadata[];
  loading: boolean;
  thumbUpDocs: Set<string>;
  thumbDownDocs: Set<string>;
  onThumbUp: (docId: string) => void;
  onThumbDown: (docId: string) => void;
  onDocClick: (doc: DocumentMetadata) => void;
  itemsPerPage?: number;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  loading,
  thumbUpDocs,
  thumbDownDocs,
  onThumbUp,
  onThumbDown,
  onDocClick,
  itemsPerPage = 10,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(documents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentDocs = documents.slice(startIndex, endIndex);

  if (documents.length === 0 && !loading) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents found"
        description="Try adjusting your search or filters"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-600 pb-2 border-b border-gray-200">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, documents.length)} of {documents.length} documents
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="min-w-[80px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        {currentDocs.map((doc) => (
          <DocumentCard
            key={doc.id}
            document={doc}
            onClick={onDocClick}
            onThumbUp={onThumbUp}
            onThumbDown={onThumbDown}
            isThumbUpActive={thumbUpDocs.has(doc.id)}
            isThumbDownActive={thumbDownDocs.has(doc.id)}
          />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
