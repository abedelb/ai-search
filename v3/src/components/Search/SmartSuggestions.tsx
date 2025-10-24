import React from 'react';
import { Lightbulb } from 'lucide-react';

interface SmartSuggestionsProps {
  query: string;
  onSuggestionClick: (suggestion: string) => void;
}

const getSuggestions = (query: string): string[] => {
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.includes('tech') || lowerQuery.includes('software')) {
    return [
      'Show me tech M&A deals from 2023',
      'What are typical SaaS valuation multiples?',
      'Find comparable software companies'
    ];
  }

  if (lowerQuery.includes('healthcare') || lowerQuery.includes('pharma')) {
    return [
      'Recent healthcare acquisitions',
      'Biotech deal structures and terms',
      'Healthcare market trends and forecasts'
    ];
  }

  if (lowerQuery.includes('valuation') || lowerQuery.includes('dcf')) {
    return [
      'Build a DCF model with these assumptions',
      'What WACC should I use for this industry?',
      'Compare valuation multiples across sectors'
    ];
  }

  if (lowerQuery.includes('pitch') || lowerQuery.includes('deck')) {
    return [
      'Create a pitch deck outline',
      'What slides do I need for this deal?',
      'Find similar pitch decks for reference'
    ];
  }

  return [
    'Help me analyze this company',
    'Find recent deals in this sector',
    'What are the key risks to consider?'
  ];
};

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  query,
  onSuggestionClick
}) => {
  if (!query || query.length < 3) return null;

  const suggestions = getSuggestions(query);

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-900 mb-2">AI Suggestions</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="text-xs px-3 py-1.5 bg-white hover:bg-amber-50 text-amber-900 rounded-full border border-amber-200 hover:border-amber-400 transition-all"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
