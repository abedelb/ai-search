import React from 'react';
import { FileText, Presentation } from 'lucide-react';

interface SearchModeSelectorProps {
  mode: 'slides' | 'documents';
  onModeChange: (mode: 'slides' | 'documents') => void;
}

export const SearchModeSelector: React.FC<SearchModeSelectorProps> = ({ mode, onModeChange }) => {
  return (
    <div className="inline-flex rounded-xl bg-white border-2 border-neutral-200 p-1 shadow-sm">
      <button
        onClick={() => onModeChange('slides')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
          mode === 'slides'
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }`}
      >
        <Presentation className="w-4 h-4" />
        <span className="text-sm font-medium">Slides</span>
      </button>
      <button
        onClick={() => onModeChange('documents')}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
          mode === 'documents'
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
            : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">Documents</span>
      </button>
    </div>
  );
};
