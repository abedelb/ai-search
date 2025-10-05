import { useState } from 'react';

export const useSlideFeedback = () => {
  const [thumbUpSlides, setThumbUpSlides] = useState<Set<string>>(new Set());
  const [thumbDownSlides, setThumbDownSlides] = useState<Set<string>>(new Set());
  const [feedbackSlideId, setFeedbackSlideId] = useState<string | null>(null);

  const handleThumbUp = (slideId: string) => {
    setThumbUpSlides(prev => new Set(prev).add(slideId));
    setThumbDownSlides(prev => {
      const next = new Set(prev);
      next.delete(slideId);
      return next;
    });
  };

  const handleThumbDown = (slideId: string) => {
    setThumbDownSlides(prev => new Set(prev).add(slideId));
    setThumbUpSlides(prev => {
      const next = new Set(prev);
      next.delete(slideId);
      return next;
    });
    setFeedbackSlideId(slideId);
  };

  return {
    thumbUpSlides,
    thumbDownSlides,
    feedbackSlideId,
    setFeedbackSlideId,
    handleThumbUp,
    handleThumbDown,
  };
};
