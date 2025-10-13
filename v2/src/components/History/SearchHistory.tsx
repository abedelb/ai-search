import React from 'react';
import { Clock, Trash2, Search, Presentation, FileText, Filter } from 'lucide-react';
import { SearchHistoryItem } from '../../types';
import { historyService } from '../../services/historyService';

interface SearchHistoryProps {
  onSelectSearch: (item: SearchHistoryItem) => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ onSelectSearch }) => {
  const [history, setHistory] = React.useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await historyService.getSearchHistory(20);
      setHistory(data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await historyService.deleteSearchHistoryItem(id);
      setHistory(prev => prev.filter(h => h.id !== id));
    } catch (error) {
      console.error('Failed to delete history item:', error);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Clear all search history?')) return;
    try {
      await historyService.clearSearchHistory();
      setHistory([]);
    } catch (error) {
      console.error('Failed to clear history:', error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getFilterCount = (item: SearchHistoryItem) => {
    return (
      item.filters.clients.length +
      item.filters.regions.length +
      item.filters.industries.length
    );
  };

  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, SearchHistoryItem[]> = {
      Today: [],
      Yesterday: [],
      'This Week': [],
      Older: [],
    };

    const now = new Date();
    history.forEach(item => {
      const diff = now.getTime() - item.createdAt.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) groups.Today.push(item);
      else if (days === 1) groups.Yesterday.push(item);
      else if (days < 7) groups['This Week'].push(item);
      else groups.Older.push(item);
    });

    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [history]);

  return (
    <div className="w-80 border-r border-neutral-200 bg-neutral-50 flex flex-col h-full">
      <div className="p-4 border-b border-neutral-200 bg-white flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Search History</h2>
        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-neutral-600 hover:text-red-600 font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-primary">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-3 border-primary-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-8">
            <Search className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <p className="text-sm text-neutral-500">No search history yet</p>
            <p className="text-xs text-neutral-400 mt-1">Your searches will appear here</p>
          </div>
        ) : (
          groupedHistory.map(([groupName, groupItems]) => (
            <div key={groupName}>
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2 px-2">
                {groupName}
              </h3>
              <div className="space-y-2">
                {groupItems.map(item => (
                  <div
                    key={item.id}
                    onClick={() => onSelectSearch(item)}
                    className="group relative rounded-xl p-3 cursor-pointer transition-all duration-200 hover:bg-white hover:shadow-sm bg-white/50"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {item.searchMode === 'slides' ? (
                          <Presentation className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        ) : (
                          <FileText className="w-4 h-4 text-primary-600 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 line-clamp-2">
                            {item.query || 'Empty search'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={e => handleDelete(item.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-neutral-500">
                      <span>{item.resultCount} results</span>
                      {getFilterCount(item) > 0 && (
                        <span className="flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          {getFilterCount(item)} filters
                        </span>
                      )}
                      <span className="flex items-center gap-1 ml-auto">
                        <Clock className="w-3 h-3" />
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
