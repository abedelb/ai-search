import { useState } from 'react';

export const useSlideFeedback = () => {
  const [feedbackSlideId, setFeedbackSlideId] = useState<string | null>(null);
  const [thumbUpSlides, setThumbUpSlides] = useState<Set<string>>(new Set());
  const [thumbDownSlides, setThumbDownSlides] = useState<Set<string>>(new Set());

  const handleThumbUp = (slideId: string) => {
    const newThumbUp = new Set(thumbUpSlides);
    const newThumbDown = new Set(thumbDownSlides);

    if (thumbUpSlides.has(slideId)) {
      newThumbUp.delete(slideId);
    } else {
      newThumbUp.add(slideId);
      newThumbDown.delete(slideId);
    }

    setThumbUpSlides(newThumbUp);
    setThumbDownSlides(newThumbDown);
  };

  const handleThumbDown = (slideId: string) => {
    const newThumbUp = new Set(thumbUpSlides);
    const newThumbDown = new Set(thumbDownSlides);

    if (thumbDownSlides.has(slideId)) {
      newThumbDown.delete(slideId);
      setFeedbackSlideId(null);
    } else {
      newThumbDown.add(slideId);
      newThumbUp.delete(slideId);
      setFeedbackSlideId(slideId);
    }

    setThumbUpSlides(newThumbUp);
    setThumbDownSlides(newThumbDown);
  };

  return {
    feedbackSlideId,
    setFeedbackSlideId,
    thumbUpSlides,
    thumbDownSlides,
    handleThumbUp,
    handleThumbDown,
  };
};
