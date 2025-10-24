import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Sparkles, ArrowLeft, Zap, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react';
import { FilterPanel } from '../Filter/FilterPanel';
import { PageContainer } from '../../ui/layout/PageContainer';
import { SearchModeSelector } from './SearchModeSelector';
import { SlideSearch } from './SlideSearch';
import { DocumentSearch } from './DocumentSearch';
import { SearchLanding } from './SearchLanding';
import { AIWithSources } from './AIWithSources';
import { QuickActions } from './QuickActions';
import { CommandPalette } from './CommandPalette';
import { searchAPI } from '../../services/api_client';
import { historyService } from '../../services/historyService';
import { FilterOptions, SearchFilters } from '../../types';

interface SearchWithAIProps {
  filtersOpen: boolean;
  selectedSearchHistory: any;
  onSearchHistoryApplied: () => void;
  itemsPerPage?: number;
  groupByDocument?: boolean;
  filterPanelWidth?: number;
  onFilterPanelWidthChange?: (width: number) => void;
}

type ViewMode = 'landing' | 'search' | 'both';

export const SearchWithAI: React.FC<SearchWithAIProps> = ({
  filtersOpen,
  selectedSearchHistory,
  onSearchHistoryApplied,
  itemsPerPage = 12,
  groupByDocument = false,
  filterPanelWidth = 320,
  onFilterPanelWidthChange,
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [searchMode, setSearchMode] = useState<'slides' | 'documents'>('slides');
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    clients: [],
    regions: [],
    industries: [],
  });
  const [filters, setFilters] = useState<SearchFilters>({
    clients: [],
    regions: [],
    industries: [],
  });
  const [loading, setLoading] = useState(false);
  const [aiSessionId, setAiSessionId] = useState<string | null>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelWidth, setAiPanelWidth] = useState(50);
  const [isResizingAI, setIsResizingAI] = useState(false);
  const [searchPanelOpen, setSearchPanelOpen] = useState(true);
  const [aiQueryToSubmit, setAiQueryToSubmit] = useState<string>('');
  const [aiTriggerSubmit, setAiTriggerSubmit] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !commandPaletteOpen && viewMode !== 'landing') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, viewMode]);

  useEffect(() => {
    if (selectedSearchHistory) {
      setQuery(selectedSearchHistory.query);
      setSubmittedQuery(selectedSearchHistory.query);
      setSearchMode(selectedSearchHistory.searchMode);
      setFilters(selectedSearchHistory.filters);
      setViewMode('search');
      onSearchHistoryApplied();
    }
  }, [selectedSearchHistory]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingAI) {
        const containerWidth = window.innerWidth;
        const newAiWidth = ((containerWidth - e.clientX) / containerWidth) * 100;
        const clampedWidth = Math.min(Math.max(30, newAiWidth), 70);
        setAiPanelWidth(clampedWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingAI(false);
    };

    if (isResizingAI) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingAI]);

  const loadFilterOptions = async () => {
    const options = await searchAPI.getFilterOptions();
    setFilterOptions(options);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSubmittedQuery(query);
    setViewMode('search');
    setShowQuickActions(false);

    try {
      await historyService.saveSearchHistory(
        query,
        searchMode,
        filters,
        0
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchAndAI = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSubmittedQuery(query);
    setAiQueryToSubmit(query);
    setViewMode('both');
    setAiPanelOpen(true);
    setSearchPanelOpen(true);
    setAiSessionId(null);
    setShowQuickActions(false);

    try {
      await historyService.saveSearchHistory(
        query,
        searchMode,
        filters,
        0
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = async (customQuery?: string) => {
    const finalQuery = customQuery || query;
    if (!finalQuery.trim()) return;

    setLoading(true);
    setQuery(finalQuery);
    setSubmittedQuery(finalQuery);
    setAiQueryToSubmit(finalQuery);
    setAiTriggerSubmit(true);
    setViewMode('both');
    setAiPanelOpen(true);
    setSearchPanelOpen(true);
    setAiSessionId(null);
    setShowQuickActions(false);

    try {
      await historyService.saveSearchHistory(
        finalQuery,
        searchMode,
        filters,
        0
      );
      setTimeout(() => setAiTriggerSubmit(false), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (searchQuery: string, aiPrompt: string) => {
    if (searchQuery) {
      setQuery(searchQuery);
      setSubmittedQuery(searchQuery);
      setViewMode('search');
      setLoading(true);
      historyService.saveSearchHistory(searchQuery, searchMode, filters, 0).finally(() => {
        setLoading(false);
      });
    }
    if (aiPrompt) {
      setQuery(aiPrompt);
      setAiQueryToSubmit(aiPrompt);
      setAiTriggerSubmit(true);
      setViewMode('both');
      setAiPanelOpen(true);
      setSearchPanelOpen(false);
      setAiSessionId(null);
      setTimeout(() => setAiTriggerSubmit(false), 100);
    }
    setShowQuickActions(false);
  };

  const handleBackToLanding = () => {
    setViewMode('landing');
    setQuery('');
    setSubmittedQuery('');
    setAiQueryToSubmit('');
    setAiTriggerSubmit(false);
    setAiPanelOpen(false);
  };

  const ResizableFilterPanel: React.FC = () => {
    const [isResizing, setIsResizing] = React.useState(false);
    const startXRef = React.useRef<number>(0);
    const startWidthRef = React.useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = filterPanelWidth;
      e.preventDefault();
    };

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isResizing && onFilterPanelWidthChange) {
          const delta = e.clientX - startXRef.current;
          const newWidth = Math.min(Math.max(250, startWidthRef.current + delta), 600);
          onFilterPanelWidthChange(newWidth);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
      };

      if (isResizing) {
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
      }

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }, [isResizing]);

    return (
      <div className="relative flex-shrink-0" style={{ width: `${filterPanelWidth}px` }}>
        <FilterPanel
          filterOptions={filterOptions}
          activeFilters={filters}
          onFilterChange={setFilters}
        />
        <div
          className="absolute top-0 right-0 w-2 h-full cursor-col-resize group hover:bg-primary-400/50 transition-colors z-50"
          onMouseDown={handleMouseDown}
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 w-1 h-16 bg-primary-500 rounded-l opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
        </div>
      </div>
    );
  };

  const SearchResults = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {!aiPanelOpen && (
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white px-6 py-5 w-full shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToLanding}
                className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="h-5 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm">
                <SearchIcon className="w-4 h-4 text-white" />
                <span className="text-sm font-bold text-white">Search Results</span>
              </div>
            </div>
            <button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="text-xs font-medium">Quick Actions</span>
            </button>
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className="flex-1 relative min-w-0">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search deals, companies, industries or ask AI..."
                  className="w-full pl-12 pr-40 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all hover:border-gray-400"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="submit"
                    disabled={loading || !query.trim()}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-1.5"
                    title="Search knowledge base"
                  >
                    <SearchIcon className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAskAI()}
                    disabled={!query.trim()}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-1.5"
                    title="Get AI insights"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI</span>
                  </button>
                </div>
              </div>
              <SearchModeSelector mode={searchMode} onModeChange={setSearchMode} />
            </div>

            {showQuickActions && (
              <QuickActions onActionClick={handleQuickAction} />
            )}

            <p className="text-xs text-gray-500 text-center">
              Click Quick Actions or use AI button to get insights from your search
            </p>
          </form>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-5 bg-gray-50">
        {searchMode === 'slides' ? (
          <SlideSearch
            externalQuery={submittedQuery}
            externalFilters={filters}
            externalFilterOptions={filterOptions}
            itemsPerPage={itemsPerPage}
            groupByDocument={groupByDocument}
          />
        ) : (
          <DocumentSearch
            externalQuery={submittedQuery}
            externalFilters={filters}
            externalFilterOptions={filterOptions}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );

  const UnifiedView = () => {
    let searchWidth = 100;
    let aiWidth = 0;

    if (aiPanelOpen && searchPanelOpen) {
      searchWidth = 100 - aiPanelWidth;
      aiWidth = aiPanelWidth;
    } else if (aiPanelOpen && !searchPanelOpen) {
      searchWidth = 0;
      aiWidth = 100;
    } else if (!aiPanelOpen && searchPanelOpen) {
      searchWidth = 100;
      aiWidth = 0;
    }

    return (
      <PageContainer>
        {aiPanelOpen && (
          <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-white w-full shadow-sm">
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleBackToLanding}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back</span>
                  </button>
                  <div className="h-5 w-px bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm">
                      <Zap className="w-4 h-4 text-white" />
                      <span className="text-sm font-bold text-white">Deal Intelligence</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQuickActions(!showQuickActions)}
                    className="flex items-center gap-2 px-3 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all border border-transparent hover:border-gray-200"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span className="text-xs font-medium">Quick Actions</span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleSearch} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative min-w-0">
                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search deals, companies, industries or ask AI... (Press / for commands)"
                      className="w-full pl-12 pr-40 py-3.5 text-base border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm transition-all hover:border-gray-400"
                    />
                    <CommandPalette
                      isOpen={commandPaletteOpen}
                      onClose={() => setCommandPaletteOpen(false)}
                      onSelectCommand={(prompt) => {
                        setQuery(prompt);
                        setCommandPaletteOpen(false);
                        handleAskAI(prompt);
                      }}
                      searchQuery={query}
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="submit"
                        disabled={loading || !query.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-1.5"
                        title="Search knowledge base"
                      >
                        <SearchIcon className="w-3.5 h-3.5" />
                        <span>Search</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAskAI()}
                        disabled={!query.trim()}
                        className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm flex items-center gap-1.5"
                        title="Get AI insights"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI</span>
                      </button>
                    </div>
                  </div>
                  <SearchModeSelector mode={searchMode} onModeChange={setSearchMode} />
                </div>

                {showQuickActions && (
                  <QuickActions onActionClick={handleQuickAction} />
                )}

                <p className="text-xs text-gray-500 text-center">
                  Click Quick Actions or use AI button to get insights from your search
                </p>
              </form>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {aiPanelOpen ? (
            <div
              className="bg-white border-r border-gray-200 flex flex-col overflow-hidden"
              style={{ width: `${aiWidth}%` }}
            >
              <button
                onClick={() => setAiPanelOpen(false)}
                className="absolute top-2 right-2 z-50 p-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm transition-all"
                title="Close AI panel"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <div className="flex-1 overflow-hidden relative">
                <AIWithSources
                  query={aiQueryToSubmit}
                  aiSessionId={aiSessionId}
                  onAiSessionIdChange={setAiSessionId}
                  filterOptions={filterOptions}
                  filters={filters}
                  itemsPerPage={itemsPerPage}
                  groupByDocument={groupByDocument}
                  showHeader={false}
                  triggerSubmit={aiTriggerSubmit}
                />
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setAiPanelOpen(true);
                if (query.trim() || submittedQuery) {
                  setAiQueryToSubmit(query.trim() || submittedQuery);
                }
              }}
              className="w-12 bg-gradient-to-b from-purple-50 via-pink-50 to-orange-50 hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 border-r border-purple-200 flex flex-col items-center justify-center transition-all group"
              title="Get AI insights"
            >
              <div className="flex flex-col items-center gap-2 py-6">
                <Sparkles className="w-5 h-5 text-purple-600 group-hover:text-purple-700 transition-colors animate-pulse" />
                <div className="text-[10px] font-semibold text-purple-600 group-hover:text-purple-700 uppercase tracking-wider writing-mode-vertical" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>AI</div>
              </div>
            </button>
          )}

          {aiPanelOpen && searchPanelOpen && (
            <div
              className="absolute top-0 h-full w-1 bg-gradient-to-b from-gray-200 to-gray-300 cursor-col-resize group hover:from-blue-400 hover:to-blue-500 transition-all z-50"
              style={{ left: `${aiWidth}%` }}
              onMouseDown={(e) => {
                setIsResizingAI(true);
                e.preventDefault();
              }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-24 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
            </div>
          )}

          {searchPanelOpen ? (
            <div
              className="bg-gray-50 flex flex-col overflow-hidden relative"
              style={{ width: `${searchWidth}%` }}
            >
              <button
                onClick={() => setSearchPanelOpen(false)}
                className="absolute top-2 right-2 z-50 p-1.5 bg-white hover:bg-gray-100 rounded-lg border border-gray-200 shadow-sm transition-all"
                title="Close search panel"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
              <SearchResults />
            </div>
          ) : (
            <button
              onClick={() => {
                setSearchPanelOpen(true);
              }}
              className="w-12 bg-gradient-to-b from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 border-l border-blue-200 flex flex-col items-center justify-center transition-all group"
              title="Show search results"
            >
              <div className="flex flex-col items-center gap-2 py-6">
                <SearchIcon className="w-5 h-5 text-blue-600 group-hover:text-blue-700 transition-colors" />
                <div className="text-[10px] font-semibold text-blue-600 group-hover:text-blue-700 uppercase tracking-wider writing-mode-vertical" style={{writingMode: 'vertical-rl', textOrientation: 'mixed'}}>Results</div>
              </div>
            </button>
          )}
        </div>
      </PageContainer>
    );
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'landing':
        return (
          <SearchLanding
            query={query}
            onQueryChange={setQuery}
            onSearch={handleSearch}
            onAskAI={handleAskAI}
            loading={loading}
          />
        );
      case 'search':
      case 'both':
        return <UnifiedView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full w-full">
      {filtersOpen && viewMode === 'search' && <ResizableFilterPanel />}
      {renderContent()}
    </div>
  );
};
