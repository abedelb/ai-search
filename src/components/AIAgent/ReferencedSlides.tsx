import React from 'react';
import { SlideMetadata } from '../../types';
import { SlideCard } from '../../ui/cards/SlideCard';
import { GridContainer } from '../../ui/layout/GridContainer';

interface ReferencedSlidesProps {
  slides: SlideMetadata[];
  thumbUpSlides: Set<string>;
  thumbDownSlides: Set<string>;
  onThumbUp: (slideId: string) => void;
  onThumbDown: (slideId: string) => void;
  onSlideClick: (slide: SlideMetadata) => void;
}

export const ReferencedSlides: React.FC<ReferencedSlidesProps> = ({
  slides,
  thumbUpSlides,
  thumbDownSlides,
  onThumbUp,
  onThumbDown,
  onSlideClick,
}) => {
  if (slides.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
        Referenced Slides ({slides.length})
      </p>
      <GridContainer>
        {slides.map((slide) => (
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
    </div>
  );
};
