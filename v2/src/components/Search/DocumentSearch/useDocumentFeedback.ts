import { useState } from 'react';

export const useDocumentFeedback = () => {
  const [feedbackDocId, setFeedbackDocId] = useState<string | null>(null);
  const [thumbUpDocs, setThumbUpDocs] = useState<Set<string>>(new Set());
  const [thumbDownDocs, setThumbDownDocs] = useState<Set<string>>(new Set());

  const handleThumbUp = (docId: string) => {
    setThumbUpDocs(prev => new Set(prev).add(docId));
    setThumbDownDocs(prev => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
  };

  const handleThumbDown = (docId: string) => {
    setThumbDownDocs(prev => new Set(prev).add(docId));
    setThumbUpDocs(prev => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
    setFeedbackDocId(docId);
  };

  return {
    feedbackDocId,
    setFeedbackDocId,
    thumbUpDocs,
    thumbDownDocs,
    handleThumbUp,
    handleThumbDown,
  };
};
