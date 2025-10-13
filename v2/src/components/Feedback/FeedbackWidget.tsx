import React from 'react';
import { ThumbsUp, ThumbsDown, X, MessageSquare, Star } from 'lucide-react';
import { feedbackService } from '../../services/feedbackService';

interface FeedbackWidgetProps {
  contextType: 'search_results' | 'ai_response' | 'slide_view' | 'general' | 'document_search' | 'slide_search';
  contextId?: string;
  metadata?: Record<string, any>;
  onClose?: () => void;
  compact?: boolean;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({
  contextType,
  contextId,
  metadata,
  onClose,
  compact = false,
}) => {
  const [stage, setStage] = React.useState<'initial' | 'rating' | 'text' | 'submitted'>('initial');
  const [foundWhat, setFoundWhat] = React.useState<boolean | null>(null);
  const [rating, setRating] = React.useState<number>(0);
  const [feedbackText, setFeedbackText] = React.useState('');
  const [hoveredStar, setHoveredStar] = React.useState<number>(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleInitialFeedback = async (found: boolean) => {
    setFoundWhat(found);

    if (found) {
      setIsSubmitting(true);
      try {
        await feedbackService.submitFeedback({
          contextType,
          contextId,
          foundWhatLookingFor: true,
          metadata,
        });
        setStage('submitted');
        setTimeout(() => onClose?.(), 2000);
      } catch (error) {
        console.error('Failed to submit feedback:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setStage('rating');
    }
  };

  const handleRatingSubmit = () => {
    if (rating > 0) {
      setStage('text');
    }
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        contextType,
        contextId,
        foundWhatLookingFor: foundWhat || false,
        rating: rating || undefined,
        feedbackText: feedbackText || undefined,
        metadata,
      });
      setStage('submitted');
      setTimeout(() => onClose?.(), 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await feedbackService.submitFeedback({
        contextType,
        contextId,
        foundWhatLookingFor: foundWhat || false,
        rating: rating || undefined,
        metadata,
      });
      setStage('submitted');
      setTimeout(() => onClose?.(), 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stage === 'submitted') {
    return (
      <div className="glass-panel rounded-2xl p-4 shadow-soft border-2 border-primary-200 animate-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <ThumbsUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-neutral-900">Thank you for your feedback!</p>
            <p className="text-xs text-neutral-600">Your input helps us improve</p>
          </div>
        </div>
      </div>
    );
  }

  if (compact && stage === 'initial') {
    return (
      <div className="glass-panel rounded-xl p-3 shadow-soft animate-in">
        <div className="flex items-center gap-2">
          <p className="text-xs text-neutral-700 font-medium">Helpful?</p>
          <button
            onClick={() => handleInitialFeedback(true)}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100 hover:bg-primary-100 hover:text-primary-600 transition-all duration-300 active:scale-95 disabled:opacity-50"
            aria-label="Yes, helpful"
          >
            <ThumbsUp className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleInitialFeedback(false)}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100 hover:bg-red-100 hover:text-red-600 transition-all duration-300 active:scale-95 disabled:opacity-50"
            aria-label="No, not helpful"
          >
            <ThumbsDown className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 transition-all duration-300 active:scale-95 ml-auto"
              aria-label="Close feedback"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-soft max-w-md animate-in">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 transition-all duration-300 active:scale-95"
          aria-label="Close feedback"
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {stage === 'initial' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Quick Feedback</h3>
            <p className="text-sm text-neutral-600">Did you find what you were looking for?</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleInitialFeedback(true)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 transition-all duration-300 active:scale-95 shadow-soft hover:shadow-glow disabled:opacity-50"
            >
              <ThumbsUp className="w-5 h-5" />
              <span>Yes</span>
            </button>
            <button
              onClick={() => handleInitialFeedback(false)}
              disabled={isSubmitting}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium bg-white text-neutral-700 hover:bg-neutral-50 border-2 border-neutral-200 hover:border-neutral-300 transition-all duration-300 active:scale-95 shadow-soft disabled:opacity-50"
            >
              <ThumbsDown className="w-5 h-5" />
              <span>No</span>
            </button>
          </div>
        </div>
      )}

      {stage === 'rating' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">How can we improve?</h3>
            <p className="text-sm text-neutral-600">Rate your experience (1-5 stars)</p>
          </div>
          <div className="flex gap-2 justify-center py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="transition-all duration-200 hover:scale-110 active:scale-95"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= (hoveredStar || rating)
                      ? 'fill-primary-500 text-primary-500'
                      : 'text-neutral-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleRatingSubmit}
              disabled={rating === 0 || isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:from-neutral-300 disabled:to-neutral-400 text-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {stage === 'text' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-1">Tell us more</h3>
            <p className="text-sm text-neutral-600">What were you looking for? (Optional)</p>
          </div>
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            placeholder="Share your thoughts..."
            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-neutral-200 rounded-xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all text-sm resize-none"
            rows={3}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm"
            >
              Skip
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-gradient-to-br from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 transition-all duration-300 active:scale-95 disabled:opacity-50 text-sm"
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
