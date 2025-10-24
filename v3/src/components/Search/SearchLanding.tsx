import React from 'react';
import { Search as SearchIcon, Sparkles } from 'lucide-react';

interface SearchLandingProps {
  query: string;
  onQueryChange: (query: string) => void;
  onSearch: () => void;
  onAskAI: () => void;
  loading: boolean;
}

export const SearchLanding: React.FC<SearchLandingProps> = ({
  query,
  onQueryChange,
  onSearch,
  onAskAI,
  loading,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch();
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-primary-50/30 px-8">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold gradient-text mb-4">
            Find the Perfect Slide
          </h1>
          <p className="text-xl text-gray-600">
            Search thousands of presentations or let AI help you find what you need
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="relative group">
            <SearchIcon className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search presentations, deals, industries, or ask AI anything..."
              className="w-full pl-16 pr-4 py-6 text-lg border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              type="submit"
              disabled={!query.trim() || loading}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <span className="relative">{loading ? 'Searching...' : 'Search'}</span>
            </button>

            <button
              type="button"
              onClick={onAskAI}
              disabled={!query.trim() || loading}
              className="group relative overflow-hidden px-8 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center gap-2">
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Ask AI</span>
              </div>
            </button>
          </div>
        </form>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary-600 mb-2">10K+</div>
            <div className="text-sm text-gray-600">Presentations</div>
          </div>
          <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary-600 mb-2">50K+</div>
            <div className="text-sm text-gray-600">Slides</div>
          </div>
          <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="text-3xl font-bold text-primary-600 mb-2">AI</div>
            <div className="text-sm text-gray-600">Powered</div>
          </div>
        </div>
      </div>
    </div>
  );
};
