import React from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Building2, Globe as Globe2, User, Loader2 } from 'lucide-react';
import { Presentation } from '../../types';
import { searchAPI } from '../../services/api_client';

interface SlidePreviewModalProps {
  documentId: string;
  initialSlideNumber: number;
  onClose: () => void;
}

export const SlidePreviewModal: React.FC<SlidePreviewModalProps> = ({
  documentId,
  initialSlideNumber,
  onClose,
}) => {
  const [presentation, setPresentation] = React.useState<Presentation | null>(null);
  const [currentSlide, setCurrentSlide] = React.useState(initialSlideNumber);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    loadPresentation();
  }, [documentId]);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentSlide, presentation]);

  const loadPresentation = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchAPI.getPresentation(documentId);
      setPresentation(data);
    } catch (err) {
      setError('Failed to load presentation');
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (presentation && currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (presentation && currentSlide < presentation.slides.length) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const currentSlideData = presentation?.slides.find(s => s.slideNumber === currentSlide);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-black/40 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="h-5 w-64 bg-white/20 rounded animate-pulse" />
            ) : presentation ? (
              <div className="flex items-center gap-3 text-xs text-white/80">
                <h2 className="font-semibold text-white text-sm truncate">
                  {presentation.title}
                </h2>
                <span className="text-white/60">•</span>
                <span>{presentation.metadata.clientName}</span>
                <span className="text-white/60">•</span>
                <span>{presentation.metadata.industry}</span>
              </div>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="ml-4 w-8 h-8 rounded-lg flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all duration-300 active:scale-95 flex-shrink-0"
            aria-label="Close preview"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-2 bg-black overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-medium">Loading presentation...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-red-500 flex items-center justify-center">
                <X className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-semibold text-lg">{error}</p>
              <button
                onClick={loadPresentation}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : currentSlideData ? (
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={currentSlideData.previewUrl}
                alt={currentSlideData.title}
                className="w-full h-full object-contain"
              />
            </div>
          ) : null}
        </div>

        {presentation && !loading && !error && (
          <div className="px-4 py-2 bg-black/40 border-t border-white/10 flex items-center justify-between flex-shrink-0">
            <button
              onClick={handlePrevious}
              disabled={currentSlide === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-white/10 text-white hover:bg-white/20 disabled:hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center gap-3 text-xs text-white">
              <span className="font-semibold">
                Slide {currentSlide} / {presentation.slides.length}
              </span>
              {currentSlideData && (
                <>
                  <span className="text-white/60">•</span>
                  <span className="text-white/80 max-w-md truncate">
                    {currentSlideData.title}
                  </span>
                </>
              )}
            </div>

            <button
              onClick={handleNext}
              disabled={currentSlide === presentation.slides.length}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-white/10 text-white hover:bg-white/20 disabled:hover:bg-white/10"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
