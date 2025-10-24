import React from 'react';
import { Calendar, Building2, Globe as Globe2, User, TrendingUp, ThumbsUp, ThumbsDown, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import { DocumentMetadata } from '../../types';

const getFileIcon = (fileType: string) => {
  switch (fileType.toUpperCase()) {
    case 'PDF':
    case 'DOC':
    case 'DOCX':
      return FileText;
    case 'XLSX':
    case 'XLS':
    case 'CSV':
      return FileSpreadsheet;
    case 'PPTX':
    case 'PPT':
      return Presentation;
    default:
      return FileText;
  }
};

const getFileIconColor = (fileType: string) => {
  switch (fileType.toUpperCase()) {
    case 'PDF':
      return 'text-red-600';
    case 'DOC':
    case 'DOCX':
      return 'text-blue-600';
    case 'XLSX':
    case 'XLS':
    case 'CSV':
      return 'text-green-600';
    case 'PPTX':
    case 'PPT':
      return 'text-orange-600';
    default:
      return 'text-gray-600';
  }
};

interface DocumentCardProps {
  document: DocumentMetadata;
  onClick?: (doc: DocumentMetadata) => void;
  onThumbUp?: (docId: string) => void;
  onThumbDown?: (docId: string) => void;
  isThumbUpActive?: boolean;
  isThumbDownActive?: boolean;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  document,
  onClick,
  onThumbUp,
  onThumbDown,
  isThumbUpActive = false,
  isThumbDownActive = false,
}) => {
  const FileIcon = getFileIcon(document.fileType);
  const iconColor = getFileIconColor(document.fileType);

  return (
    <div
      onClick={() => onClick?.(document)}
      className="group bg-white border border-gray-200 rounded-xl hover:border-primary-500 hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden"
    >
      <div className="flex items-center gap-4 p-3">
        <div className="relative flex-shrink-0 w-20 h-20 bg-gradient-to-br from-neutral-100 to-neutral-50 rounded-lg overflow-hidden border border-neutral-200 shadow-sm">
          <img
            src={`https://picsum.photos/seed/${document.id}/80/80`}
            alt={document.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute bottom-1 right-1 p-1 bg-white/95 backdrop-blur-sm rounded shadow-sm">
            <FileIcon className={`w-3.5 h-3.5 ${iconColor}`} />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors truncate mb-1">
              {document.title}
            </h3>
            <div className="flex items-center gap-4 text-xs text-neutral-600">
              <div className="flex items-center gap-1">
                <User className="w-3 h-3 text-primary-500" />
                <span className="truncate">{document.clientName}</span>
              </div>
              <div className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-primary-500" />
                <span className="truncate">{document.industry}</span>
              </div>
              <div className="flex items-center gap-1">
                <Globe2 className="w-3 h-3 text-primary-500" />
                <span className="truncate">{document.region}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary-500" />
                <span>{new Date(document.creationDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-xs text-neutral-600">
                <span className="text-primary-600 font-semibold">{document.hits}</span> hits
              </span>
            </div>

            <div className="flex items-center gap-1 border-l border-neutral-200 pl-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onThumbUp?.(document.id);
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  isThumbUpActive
                    ? 'bg-green-100 text-green-600'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-green-600'
                }`}
                title="Like this document"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onThumbDown?.(document.id);
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  isThumbDownActive
                    ? 'bg-red-100 text-red-600'
                    : 'text-neutral-400 hover:bg-neutral-100 hover:text-red-600'
                }`}
                title="Report an issue"
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
