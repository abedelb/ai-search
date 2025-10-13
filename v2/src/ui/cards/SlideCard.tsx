import React from 'react';
import { Calendar, Building2, Globe as Globe2, User, ThumbsUp, ThumbsDown } from 'lucide-react';
import { SlideMetadata } from '../../types';
import { generateSlideThumbnail } from '../../utils/slidePreview';

interface SlideCardProps {
  slide: SlideMetadata;
  onSlideClick?: (slide: SlideMetadata) => void;
  onThumbUp?: (slideId: string) => void;
  onThumbDown?: (slideId: string) => void;
  isThumbUpActive?: boolean;
  isThumbDownActive?: boolean;
}

export const SlideCard: React.FC<SlideCardProps> = ({
  slide,
  onSlideClick,
  onThumbUp,
  onThumbDown,
  isThumbUpActive = false,
  isThumbDownActive = false,
}) => {
  const thumbnailUrl = React.useMemo(
    () => generateSlideThumbnail(slide.slideNumber, slide.documentName),
    [slide.slideNumber, slide.documentName]
  );

  return (
    <div
      onClick={() => onSlideClick?.(slide)}
      className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#00915A] hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col"
    >
      <div className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={thumbnailUrl}
          alt={slide.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      <div className="p-3 space-y-2 flex-shrink-0">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-[#00915A] transition-colors line-clamp-2 flex-1">
            {slide.title}
          </h3>
          {(onThumbUp || onThumbDown) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {onThumbUp && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onThumbUp(slide.id);
                  }}
                  className={`p-1 rounded transition-all ${
                    isThumbUpActive
                      ? 'bg-green-100 text-green-600'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-green-600'
                  }`}
                  title="Like this slide"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
              )}
              {onThumbDown && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onThumbDown(slide.id);
                  }}
                  className={`p-1 rounded transition-all ${
                    isThumbDownActive
                      ? 'bg-red-100 text-red-600'
                      : 'text-gray-400 hover:bg-gray-100 hover:text-red-600'
                  }`}
                  title="Report an issue"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-[#00915A] flex-shrink-0" />
            <span className="truncate">{slide.clientName}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#00915A] flex-shrink-0" />
            <span className="truncate">{slide.industry}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Globe2 className="w-3.5 h-3.5 text-[#00915A] flex-shrink-0" />
            <span className="truncate">{slide.region}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#00915A] flex-shrink-0" />
            <span className="truncate">{new Date(slide.creationDate).toLocaleDateString()}</span>
          </div>
        </div>

        {slide.tags && slide.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-gray-200">
            {slide.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs bg-[#00915A]/10 text-[#00915A] rounded border border-[#00915A]/20"
              >
                {tag}
              </span>
            ))}
            {slide.tags.length > 2 && (
              <span className="px-1.5 py-0.5 text-xs text-gray-500">
                +{slide.tags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
