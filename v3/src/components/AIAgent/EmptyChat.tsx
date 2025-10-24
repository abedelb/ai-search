import React from 'react';
import { Sparkles, TrendingUp, PieChart, BarChart3, LineChart } from 'lucide-react';

interface EmptyChatProps {
  onSuggestionClick: (suggestion: string) => void;
}

const suggestions = [
  {
    icon: LineChart,
    label: 'Compare Company Performance',
    query: 'Compare revenue growth and profitability between Company A and Company B over the last 3 years',
    color: 'blue'
  },
  {
    icon: PieChart,
    label: 'Sector Distribution Analysis',
    query: 'Show me the distribution of deals across different sectors in our portfolio',
    color: 'purple'
  },
  {
    icon: BarChart3,
    label: 'Profit vs EBITDA Comparison',
    query: 'Compare net profit margins versus EBITDA margins for healthcare companies',
    color: 'green'
  },
  {
    icon: TrendingUp,
    label: 'Market Trends Analysis',
    query: 'What are the key growth trends in the technology sector and which companies are leading?',
    color: 'orange'
  },
  {
    icon: BarChart3,
    label: 'Regional Performance',
    query: 'Compare deal performance across North America, Europe, and Asia-Pacific regions',
    color: 'red'
  },
  {
    icon: LineChart,
    label: 'Valuation Multiples Trend',
    query: 'Show the trend of EV/EBITDA multiples in consumer goods sector over the past 2 years',
    color: 'indigo'
  },
];

const getColorClasses = (color: string) => {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200 hover:border-blue-500 hover:bg-blue-50',
    purple: 'bg-purple-100 text-purple-600 border-purple-200 hover:border-purple-500 hover:bg-purple-50',
    green: 'bg-green-100 text-green-600 border-green-200 hover:border-green-500 hover:bg-green-50',
    orange: 'bg-orange-100 text-orange-600 border-orange-200 hover:border-orange-500 hover:bg-orange-50',
    red: 'bg-red-100 text-red-600 border-red-200 hover:border-red-500 hover:bg-red-50',
    indigo: 'bg-indigo-100 text-indigo-600 border-indigo-200 hover:border-indigo-500 hover:bg-indigo-50',
  };
  return colors[color as keyof typeof colors] || colors.blue;
};

export const EmptyChat: React.FC<EmptyChatProps> = ({ onSuggestionClick }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-8">
      <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mb-6 shadow-xl">
        <Sparkles className="w-12 h-12 text-white" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">
        Deal Intelligence Assistant
      </h2>
      <p className="text-gray-600 max-w-md mb-8 text-lg">
        Ask me anything about deals, companies, or market trends. I can generate charts and insights.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl w-full">
        {suggestions.map((suggestion, i) => {
          const Icon = suggestion.icon;
          return (
            <button
              key={i}
              onClick={() => onSuggestionClick(suggestion.query)}
              className={`px-4 py-4 rounded-xl border-2 transition-all duration-200 text-left shadow-sm hover:shadow-md group ${getColorClasses(suggestion.color)}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold mb-1 group-hover:underline">
                    {suggestion.label}
                  </p>
                  <p className="text-xs opacity-80 line-clamp-2">
                    {suggestion.query}
                  </p>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
