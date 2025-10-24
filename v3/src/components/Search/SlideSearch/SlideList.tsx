import React, { useState } from 'react';
import { SlideCard } from '../../../ui/cards/SlideCard';
import { GridContainer } from '../../../ui/layout/GridContainer';
import { EmptyState } from '../../../ui/widgets/EmptyState';
import { LoadingSpinner } from '../../../ui/widgets/LoadingSpinner';
import { SlideMetadata } from '../../../types';
import { ChevronLeft, ChevronRight, FileQuestion } from 'lucide-react';

interface SlideListProps {
  slides: SlideMetadata[];
  loading: boolean;
  thumbUpSlides: Set<string>;
  thumbDownSlides: Set<string>;
  onThumbUp: (slideId: string) => void;
  onThumbDown: (slideId: string) => void;
  onSlideClick: (slide: SlideMetadata) => void;
  itemsPerPage?: number;
  groupByDocument?: boolean;
}

export const SlideList: React.FC<SlideListProps> = ({
  slides,
  loading,
  thumbUpSlides,
  thumbDownSlides,
  onThumbUp,
  onThumbDown,
  onSlideClick,
  itemsPerPage = 12,
  groupByDocument = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(slides.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSlides = slides.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingSpinner text="Searching slides..." />;
  }

  if (slides.length === 0) {
    return (
      <EmptyState
        icon={FileQuestion}
        title="No slides found"
        description="Try adjusting your search query or filters"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {startIndex + 1}-{Math.min(endIndex, slides.length)} of {slides.length} slides
        </p>
      </div>

      <GridContainer>
        {currentSlides.map((slide) => (
          <SlideCard
            key={slide.id}
            slide={slide}
            thumbUp={thumbUpSlides.has(slide.id)}
            thumbDown={thumbDownSlides.has(slide.id)}
            onThumbUp={() => onThumbUp(slide.id)}
            onThumbDown={() => onThumbDown(slide.id)}
            onClick={() => onSlideClick(slide)}
          />
        ))}
      </GridContainer>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="px-4 py-2 text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};
