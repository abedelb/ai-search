import React, { useState, useEffect } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { FilterPanel } from '../Filter/FilterPanel';
import { PageContainer } from '../../ui/layout/PageContainer';
import { SearchModeSelector } from './SearchModeSelector';
import { SlideSearch } from './SlideSearch';
import { DocumentSearch } from './DocumentSearch';
import { searchAPI } from '../../services/api_client';
import { historyService } from '../../services/historyService';
import { FilterOptions, SearchFilters } from '../../types';

interface SearchProps {
  filtersOpen: boolean;
  selectedSearchHistory: any;
  onSearchHistoryApplied: () => void;
  itemsPerPage?: number;
  groupByDocument?: boolean;
  filterPanelWidth?: number;
  onFilterPanelWidthChange?: (width: number) => void;
}

export const Search: React.FC<SearchProps> = ({
  filtersOpen,
  selectedSearchHistory,
  onSearchHistoryApplied,
  itemsPerPage = 12,
  groupByDocument = false,
  filterPanelWidth = 320,
  onFilterPanelWidthChange,
}) => {
  const [searchMode, setSearchMode] = useState<'slides' | 'documents'>('slides');
  const [query, setQuery] = useState('');
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

  useEffect(() => {
    loadFilterOptions();
  }, []);

  useEffect(() => {
    if (selectedSearchHistory) {
      setQuery(selectedSearchHistory.query);
      setSearchMode(selectedSearchHistory.searchMode);
      setFilters(selectedSearchHistory.filters);
      onSearchHistoryApplied();
    }
  }, [selectedSearchHistory]);

  const loadFilterOptions = async () => {
    const options = await searchAPI.getFilterOptions();
    setFilterOptions(options);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (query.trim()) {
        await historyService.saveSearchHistory(
          query,
          searchMode,
          filters,
          0
        );
      }
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="flex h-full w-full">
      {filtersOpen && <ResizableFilterPanel />}

      <PageContainer>
        <div className="border-b border-neutral-200 bg-white px-8 py-6 w-full">
          <h1 className="text-3xl font-bold gradient-text mb-6">IB Search</h1>
          
          <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }}>
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchMode === 'slides'
                      ? 'Search presentations, deals, or industries...'
                      : 'Search documents, reports, or analyses...'
                  }
                  className="w-full pl-14 pr-32 py-4 text-base border-2 border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm transition-all"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="group absolute right-2 top-1/2 -translate-y-1/2 overflow-hidden px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  <span className="relative">{loading ? 'Searching...' : 'Search'}</span>
                </button>
              </div>
              <SearchModeSelector mode={searchMode} onModeChange={setSearchMode} />
            </div>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6 bg-gray-50 w-full">
          {searchMode === 'slides' ? (
            <SlideSearch
              externalQuery={query}
              externalFilters={filters}
              externalFilterOptions={filterOptions}
              itemsPerPage={itemsPerPage}
              groupByDocument={groupByDocument}
            />
          ) : (
            <DocumentSearch
              externalQuery={query}
              externalFilters={filters}
              externalFilterOptions={filterOptions}
              itemsPerPage={itemsPerPage}
            />
          )}
        </div>
      </PageContainer>
    </div>
  );
};
