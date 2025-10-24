import React, { useState, useMemo } from 'react';
import { FileText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { SlideMetadata } from '../../../types';
import { SlideCard } from '../../../ui/cards/SlideCard';
import { GridContainer } from '../../../ui/layout/GridContainer';
import { EmptyState } from '../../../ui/widgets/EmptyState';

interface SlideGridProps {
  slides: SlideMetadata[];
  loading: boolean;
  thumbUpSlides: Set<string>;
  thumbDownSlides: Set<string>;
  onThumbUp: (slideId: string) => void;
  onThumbDown: (slideId: string) => void;
  onSlideClick?: (slide: SlideMetadata) => void;
  itemsPerPage?: number;
  groupByDocument?: boolean;
}

export const SlideGrid: React.FC<SlideGridProps> = React.memo(({
  slides,
  loading,
  thumbUpSlides,
  thumbDownSlides,
  onThumbUp,
  onThumbDown,
  onSlideClick,
  itemsPerPage = 12,
  groupByDocument = true,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (documentId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(documentId)) {
        newSet.delete(documentId);
      } else {
        newSet.add(documentId);
      }
      return newSet;
    });
  };

  const groupedSlides = useMemo(() => {
    if (!groupByDocument) {
      return null;
    }

    const groups = new Map<string, { documentName: string; slides: SlideMetadata[] }>();

    slides.forEach(slide => {
      if (!groups.has(slide.documentId)) {
        groups.set(slide.documentId, {
          documentName: slide.documentName,
          slides: []
        });
      }
      groups.get(slide.documentId)!.slides.push(slide);
    });

    groups.forEach(group => {
      group.slides.sort((a, b) => a.slideNumber - b.slideNumber);
    });

    return Array.from(groups.entries());
  }, [slides, groupByDocument]);

  const totalPages = Math.ceil(slides.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  const currentSlides = slides.slice(startIndex, endIndex);

  const currentGroupedSlides = useMemo(() => {
    if (!groupByDocument || !groupedSlides) {
      return null;
    }

    const groups = new Map<string, { documentName: string; slides: SlideMetadata[] }>();

    currentSlides.forEach(slide => {
      if (!groups.has(slide.documentId)) {
        groups.set(slide.documentId, {
          documentName: slide.documentName,
          slides: []
        });
      }
      groups.get(slide.documentId)!.slides.push(slide);
    });

    groups.forEach(group => {
      group.slides.sort((a, b) => a.slideNumber - b.slideNumber);
    });

    return Array.from(groups.entries());
  }, [currentSlides, groupByDocument, groupedSlides]);

  const totalSlides = slides.length;

  if (slides.length === 0 && !loading) {
    return (
      <EmptyState
        icon={FileText}
        title="No slides found"
        description="Try adjusting your search or filters"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-600 pb-2 border-b border-gray-200">
        <div>
          Showing {startIndex + 1}-{Math.min(endIndex, totalSlides)} of {totalSlides} slides
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

      {groupByDocument && currentGroupedSlides ? (
        currentGroupedSlides.map(([documentId, group]) => {
          const isCollapsed = collapsedGroups.has(documentId);

          return (
            <div key={documentId} className="space-y-3">
              <button
                onClick={() => toggleGroup(documentId)}
                className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-[#00915A] hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  {isCollapsed ? (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {group.documentName}
                  </h3>
                </div>
                <span className="text-sm text-gray-500">
                  {group.slides.length} slides
                </span>
              </button>

              {!isCollapsed && (
                <GridContainer>
                  {group.slides.map((slide) => (
                    <SlideCard
                      key={slide.id}
                      slide={slide}
                      onSlideClick={onSlideClick}
                      onThumbUp={onThumbUp}
                      onThumbDown={onThumbDown}
                      isThumbUpActive={thumbUpSlides.has(slide.id)}
                      isThumbDownActive={thumbDownSlides.has(slide.id)}
                    />
                  ))}
                </GridContainer>
              )}
            </div>
          );
        })
      ) : (
        <GridContainer>
          {currentSlides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              onSlideClick={onSlideClick}
              onThumbUp={onThumbUp}
              onThumbDown={onThumbDown}
              isThumbUpActive={thumbUpSlides.has(slide.id)}
              isThumbDownActive={thumbDownSlides.has(slide.id)}
            />
          ))}
        </GridContainer>
      )}

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
});
