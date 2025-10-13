import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Download } from 'lucide-react';

interface PPTXSlideViewerProps {
  pptxUrl: string;
  slideNumber: number;
  title: string;
  onClose: () => void;
  totalSlides?: number;
}

export const PPTXSlideViewer: React.FC<PPTXSlideViewerProps> = ({
  pptxUrl,
  slideNumber,
  title,
  onClose,
  totalSlides = 1,
}) => {
  const [currentSlide, setCurrentSlide] = useState(slideNumber);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slideImages, setSlideImages] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const slideRefs = useRef<{ [key: number]: HTMLButtonElement | null }>({});

  useEffect(() => {
    loadPresentation();
  }, [pptxUrl]);

  useEffect(() => {
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
  }, [currentSlide]);

  useEffect(() => {
    // Scroll to current slide in the sidebar
    if (slideRefs.current[currentSlide]) {
      slideRefs.current[currentSlide]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentSlide]);

  const loadPresentation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(pptxUrl);

      if (!response.ok) {
        throw new Error('Failed to load presentation file');
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();

      const images: string[] = [];
      for (let i = 0; i < totalSlides; i++) {
        images.push(`data:image/svg+xml,${encodeURIComponent(
          generateSlideSVG(i + 1, title)
        )}`);
      }

      setSlideImages(images);
      setLoading(false);
    } catch (err) {
      console.error('Error loading presentation:', err);
      setError('Unable to load presentation. The file may not be available.');
      setLoading(false);
    }
  };

  const generateSlideSVG = (slideNum: number, presentationTitle: string): string => {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
        <defs>
          <linearGradient id="bg-gradient-${slideNum}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:rgb(249,250,251);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(243,244,246);stop-opacity:1" />
          </linearGradient>
          <linearGradient id="header-gradient-${slideNum}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:rgb(0,145,90);stop-opacity:1" />
            <stop offset="100%" style="stop-color:rgb(0,115,72);stop-opacity:1" />
          </linearGradient>
        </defs>

        <!-- Background -->
        <rect width="1280" height="720" fill="url(#bg-gradient-${slideNum})"/>

        <!-- Header Bar -->
        <rect width="1280" height="80" fill="url(#header-gradient-${slideNum})"/>

        <!-- Title -->
        <text x="60" y="50" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="600" fill="white">
          ${presentationTitle}
        </text>

        <!-- Slide Number Badge -->
        <circle cx="1220" cy="40" r="25" fill="rgba(255,255,255,0.2)"/>
        <text x="1220" y="47" font-family="system-ui" font-size="18" font-weight="700" fill="white" text-anchor="middle">
          ${slideNum}
        </text>

        <!-- Content Area -->
        <rect x="60" y="120" width="1160" height="520" rx="12" fill="white" opacity="0.9"/>

        <!-- Slide Title -->
        <text x="640" y="200" font-family="system-ui" font-size="48" font-weight="700" fill="rgb(17,24,39)" text-anchor="middle">
          Slide ${slideNum}
        </text>

        <!-- Content Lines -->
        <rect x="120" y="260" width="1040" height="8" rx="4" fill="rgb(229,231,235)"/>
        <rect x="120" y="300" width="900" height="8" rx="4" fill="rgb(229,231,235)"/>
        <rect x="120" y="340" width="950" height="8" rx="4" fill="rgb(229,231,235)"/>
        <rect x="120" y="380" width="800" height="8" rx="4" fill="rgb(229,231,235)"/>

        <!-- Visual Elements -->
        <circle cx="240" cy="500" r="60" fill="rgb(59,130,246)" opacity="0.1"/>
        <circle cx="640" cy="500" r="60" fill="rgb(16,185,129)" opacity="0.1"/>
        <circle cx="1040" cy="500" r="60" fill="rgb(249,115,22)" opacity="0.1"/>

        <!-- Footer -->
        <text x="640" y="690" font-family="system-ui" font-size="14" fill="rgb(156,163,175)" text-anchor="middle">
          ${presentationTitle} | Slide ${slideNum} of ${totalSlides}
        </text>
      </svg>
    `;
  };

  const handlePrevious = () => {
    if (currentSlide > 1) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleNext = () => {
    if (currentSlide < totalSlides) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pptxUrl;
    link.download = pptxUrl.split('/').pop() || 'presentation.pptx';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/95 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gray-800/60 border-b border-gray-700/50 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-white truncate">{title}</h2>
            <p className="text-sm text-white/60 mt-0.5">
              Slide {currentSlide} of {totalSlides}
            </p>
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all duration-300"
              aria-label="Download presentation"
            >
              <Download className="w-4 h-4 text-white" />
              <span className="text-sm font-medium text-white">Download</span>
            </button>

            <button
              onClick={onClose}
              className="flex items-center justify-center w-10 h-10 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-300 active:scale-95"
              aria-label="Close preview"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-black">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-white animate-spin" />
              <p className="text-white font-medium">Loading presentation...</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 max-w-md text-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Preview Unavailable</h3>
              <p className="text-white/70">{error}</p>
              <button
                onClick={loadPresentation}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-300"
              >
                Try Again
              </button>
            </div>
          ) : slideImages[currentSlide - 1] ? (
            <>
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-shrink-0 w-48 bg-gray-800/60 border-r border-gray-700/50 overflow-y-auto overflow-x-hidden">
                  <div className="flex flex-col gap-2 p-3">
                    {slideImages.map((img, index) => (
                      <button
                        key={index}
                        ref={(el) => (slideRefs.current[index + 1] = el)}
                        onClick={() => setCurrentSlide(index + 1)}
                        className={`flex-shrink-0 w-full aspect-video rounded-lg overflow-hidden border-2 transition-all duration-300 ${
                          currentSlide === index + 1
                            ? 'border-[#00915A] shadow-lg shadow-[#00915A]/50 scale-105'
                            : 'border-white/20 hover:border-white/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`Slide ${index + 1}`}
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
                      src={slideImages[currentSlide - 1]}
                      alt={`Slide ${currentSlide}`}
                      className="w-full h-full object-contain shadow-2xl rounded-lg"
                    />

                    <button
                      onClick={handleNext}
                      disabled={currentSlide === totalSlides}
                      className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed bg-white/10 text-white hover:bg-white/20 disabled:hover:bg-white/10 backdrop-blur-sm"
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>

                    <div className="absolute bottom-2 right-2 px-3 py-1.5 rounded-md bg-gray-900/90 backdrop-blur-sm text-white text-xs font-semibold border border-gray-700/50">
                      Slide {currentSlide}/{totalSlides}
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
