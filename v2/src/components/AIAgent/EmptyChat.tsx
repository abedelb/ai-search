import React from 'react';
import { Sparkles } from 'lucide-react';

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  'What are the key trends in technology sector?',
  'Summarize recent M&A activity',
  'Which clients are in North America?',
  'Show me market analysis slides',
];

export const EmptyChat: React.FC<EmptyChatProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center mb-6 shadow-xl animate-float">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-2xl font-bold text-neutral-900 mb-3">
        Ready to assist you
      </h2>
      <p className="text-neutral-600 max-w-md mb-8">
        I'll walk you through my thinking process as I analyze presentations and find insights.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
        {suggestions.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-6 py-4 bg-white rounded-xl border-2 border-neutral-200 hover:border-primary-500 hover:bg-primary-50 transition-all duration-300 text-left text-sm font-medium text-neutral-700 hover:text-primary-700 shadow-sm hover:shadow-md"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
};
