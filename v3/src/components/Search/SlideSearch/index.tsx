import React, { useState } from 'react';
import { FeedbackContainer } from '../../Feedback/FeedbackContainer';
import { SlidePreviewModal } from '../../Preview/SlidePreviewModal';
import { useSlideSearch } from './useSlideSearch';
import { useSlideFeedback } from '../../../hooks/useSlideFeedback';
import { SlideGrid } from './SlideGrid';
import { SlideMetadata, FilterOptions, SearchFilters } from '../../../types';

interface SlideSearchProps {
  externalQuery?: string;
  externalFilters?: SearchFilters;
  externalFilterOptions?: FilterOptions;
  itemsPerPage?: number;
  groupByDocument?: boolean;
}

export const SlideSearch: React.FC<SlideSearchProps> = React.memo(({
  externalQuery,
  externalFilters,
  externalFilterOptions,
  itemsPerPage = 12,
  groupByDocument = false,
}) => {
  const {
    slides,
    loading,
  } = useSlideSearch(externalQuery, externalFilters);

  const {
    feedbackSlideId,
    setFeedbackSlideId,
    thumbUpSlides,
    thumbDownSlides,
    handleThumbUp,
    handleThumbDown,
  } = useSlideFeedback();

  const [previewSlide, setPreviewSlide] = useState<{
    documentId: string;
    slideNumber: number;
  } | null>(null);

  const handleSlideClick = (slide: SlideMetadata) => {
    setPreviewSlide({
      documentId: slide.documentId,
      slideNumber: slide.slideNumber,
    });
  };

  return (
    <>
      <SlideGrid
        slides={slides}
        loading={loading}
        thumbUpSlides={thumbUpSlides}
        thumbDownSlides={thumbDownSlides}
        onThumbUp={handleThumbUp}
        onThumbDown={handleThumbDown}
        onSlideClick={handleSlideClick}
        itemsPerPage={itemsPerPage}
        groupByDocument={groupByDocument}
      />

      {feedbackSlideId && (
        <FeedbackContainer
          contextType="slide_search"
          contextId={feedbackSlideId}
          metadata={{
            query: externalQuery || '',
            filters: externalFilters || { clients: [], regions: [], industries: [] },
            slideTitle: slides.find(s => s.id === feedbackSlideId)?.title,
          }}
          onClose={() => setFeedbackSlideId(null)}
        />
      )}

      {previewSlide && (
        <SlidePreviewModal
          documentId={previewSlide.documentId}
          initialSlideNumber={previewSlide.slideNumber}
          onClose={() => setPreviewSlide(null)}
        />
      )}
    </>
  );
});
