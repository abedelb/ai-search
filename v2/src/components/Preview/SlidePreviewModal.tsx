import React from 'react';
import { X, ChevronLeft, ChevronRight, Calendar, Building2, Globe as Globe2, User, Loader2 } from 'lucide-react';
import { Presentation } from '../../types';
import { searchAPI } from '../../services/api_client';
import { PPTXSlideViewer } from './PPTXSlideViewer';
import { generateSlideThumbnail } from '../../utils/slidePreview';

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
  const slideRefs = React.useRef<{ [key: number]: HTMLButtonElement | null }>({});

  React.useEffect(() => {
    loadPresentation();
  }, [documentId]);

  React.useEffect(() => {
    // Scroll to current slide in the sidebar
    if (slideRefs.current[currentSlide]) {
      slideRefs.current[currentSlide]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentSlide]);

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

  if (presentation?.pptxSignedUrl) {
    return (
      <PPTXSlideViewer
        pptxUrl={presentation.pptxSignedUrl}
        slideNumber={currentSlide}
        title={presentation.title}
        totalSlides={presentation.slides.length}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm animate-in">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/60 border-b border-gray-700/50 flex-shrink-0">
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

        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-medium">Loading presentation...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
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
          ) : currentSlideData && presentation ? (
            <>
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-shrink-0 w-48 bg-gray-800/60 border-r border-gray-700/50 overflow-y-auto overflow-x-hidden">
                  <div className="flex flex-col gap-2 p-3">
                    {presentation.slides.map((slide) => (
                      <button
                        key={slide.id}
                        ref={(el) => (slideRefs.current[slide.slideNumber] = el)}
                        onClick={() => setCurrentSlide(slide.slideNumber)}
                        className={`flex-shrink-0 w-full aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                          currentSlide === slide.slideNumber
                            ? 'border-[#00915A] shadow-lg shadow-[#00915A]/50 scale-105'
                            : slide.isRelevant
                            ? 'border-[#00915A]/40 hover:border-[#00915A]/60 opacity-85 hover:opacity-100 animate-glow-pulse'
                            : 'border-white/20 hover:border-white/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={generateSlideThumbnail(slide.slideNumber, presentation.title)}
                          alt={`Slide ${slide.slideNumber}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
                  <div className="relative w-full h-full max-w-6xl max-h-full flex items-center justify-center">
                    <button
                      onClick={handlePrevious}
                      disabled={currentSlide === 1}
                      className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-white/10 text-white hover:bg-white/20 disabled:hover:bg-white/10 backdrop-blur-sm"
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>

                    <img
                      src={generateSlideThumbnail(currentSlideData.slideNumber, presentation.title)}
                      alt={`Slide ${currentSlideData.slideNumber}`}
                      className="w-full h-full object-contain"
                    />

                    <button
                      onClick={handleNext}
                      disabled={currentSlide === presentation.slides.length}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-white/10 text-white hover:bg-white/20 disabled:hover:bg-white/10 backdrop-blur-sm"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-md bg-gray-900/90 backdrop-blur-sm text-white text-xs font-semibold border border-gray-700/50">
                      Slide {currentSlide}/{presentation.slides.length}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
