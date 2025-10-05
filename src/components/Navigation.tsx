import React from 'react';
import { Search, MessageSquare, Sparkles, Menu, X, Settings, HelpCircle, ChevronLeft, Filter, Folder, Grid2x2 as Grid, History } from 'lucide-react';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  filtersOpen?: boolean;
  onFiltersToggle?: () => void;
  showFiltersButton?: boolean;
  itemsPerPage?: number;
  onItemsPerPageChange?: (value: number) => void;
  showPaginationControl?: boolean;
  groupByDocument?: boolean;
  onGroupByDocumentChange?: (value: boolean) => void;
  showGroupControl?: boolean;
  chatHistoryOpen?: boolean;
  onChatHistoryToggle?: () => void;
  showChatHistoryButton?: boolean;
  searchHistoryOpen?: boolean;
  onSearchHistoryToggle?: () => void;
  showSearchHistoryButton?: boolean;
}

const mainNavItems: NavigationItem[] = [
  {
    id: 'search',
    label: 'Search',
    icon: Search,
    description: 'Find slides and documents',
  },
  {
    id: 'ai-agent',
    label: 'AI Assistant',
    icon: MessageSquare,
    description: 'Chat with AI for insights',
  },
];

const secondaryNavItems: NavigationItem[] = [
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    description: 'Configure preferences',
  },
  {
    id: 'help',
    label: 'Help',
    icon: HelpCircle,
    description: 'Get support',
  },
];

const itemsPerPageOptions = [6, 12, 24, 48];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  filtersOpen = false,
  onFiltersToggle,
  showFiltersButton = false,
  itemsPerPage = 12,
  onItemsPerPageChange,
  showPaginationControl = false,
  groupByDocument = false,
  onGroupByDocumentChange,
  showGroupControl = false,
  chatHistoryOpen = false,
  onChatHistoryToggle,
  showChatHistoryButton = false,
  searchHistoryOpen = false,
  onSearchHistoryToggle,
  showSearchHistoryButton = false
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleNavClick = (itemId: string) => {
    onTabChange(itemId);
    setIsMobileMenuOpen(false);
  };

  const NavButton: React.FC<{ item: NavigationItem; showLabel?: boolean }> = ({ item, showLabel = false }) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        onClick={() => handleNavClick(item.id)}
        className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-300 w-full overflow-hidden ${
          isActive
            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
            : 'text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-white hover:shadow-sm'
        }`}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}>
        {/* Animated background on hover */}
        {!isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Active indicator */}
        {isActive && (
          <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-0 animate-pulse" />
        )}

        <div className={`relative flex items-center justify-center flex-shrink-0 w-5 h-5 transition-all duration-300 ${
          isActive ? 'scale-110' : 'group-hover:scale-110'
        }`}>
          <Icon
            className={`w-5 h-5 transition-all duration-300 ${
              isActive ? 'text-white drop-shadow-sm' : 'text-neutral-600 group-hover:text-primary-600'
            }`}
          />
        </div>

        {(showLabel || isExpanded) && (
          <span className={`relative text-xs font-semibold truncate transition-all duration-300 ${
            isActive ? 'text-white' : 'text-neutral-700 group-hover:text-primary-700'
          }`}>
            {item.label}
          </span>
        )}

        {item.badge && (
          <span className="relative ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-accent-500 to-accent-600 text-white rounded-full shadow-sm">
            {item.badge}
          </span>
        )}

        {!showLabel && !isExpanded && (
          <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
            {item.label}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
          </div>
        )}
      </button>
    );
  };

  return (
    <>
      <aside
        className={`hidden lg:flex flex-col glass-panel transition-all duration-500 ease-in-out ${
          isExpanded ? 'w-72' : 'w-20'
        }`}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="p-2.5 border-b border-neutral-200/50">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="relative w-full flex items-center gap-2 px-2.5 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 group overflow-hidden"
            aria-label={isExpanded ? 'Collapse navigation' : 'Expand navigation'}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />

            <div className="relative flex items-center justify-center flex-shrink-0 w-5 h-5">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            {isExpanded && (
              <>
                <span className="relative text-xs font-bold text-white truncate">Content Studio</span>
                <ChevronLeft className="relative w-3 h-3 text-white/90 ml-auto transition-transform duration-300 group-hover:scale-110 group-hover:-translate-x-0.5" />
              </>
            )}
            {!isExpanded && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                Expand Menu
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
              </div>
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-between p-2.5 overflow-hidden">
          <div className="space-y-2.5">
            <nav className="space-y-1 animate-in" aria-label="Primary navigation">
              {isExpanded ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-2">
                    Main
                  </label>
                  <div className="relative inline-flex w-full rounded-lg bg-gradient-to-r from-neutral-100 to-neutral-50 p-0.5 shadow-inner">
                    {mainNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleNavClick(item.id)}
                          className={`relative flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-md transition-all duration-300 flex-1 overflow-hidden ${
                            isActive
                              ? 'bg-white text-primary-600 shadow-md font-semibold'
                              : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                          }`}
                        >
                          {isActive && (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-30" />
                          )}
                          <Icon className={`relative w-4 h-4 transition-transform duration-300 ${
                            isActive ? 'scale-110' : ''
                          }`} />
                          <span className="relative text-[11px] font-semibold">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                mainNavItems.map((item) => (
                  <NavButton key={item.id} item={item} />
                ))
              )}
            </nav>

            {(showFiltersButton || showPaginationControl || showChatHistoryButton || showSearchHistoryButton) && (
              <div className="pt-2 border-t border-neutral-200/50 space-y-1">
                {showSearchHistoryButton && onSearchHistoryToggle && (
                  <button
                    onClick={onSearchHistoryToggle}
                    className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-300 w-full overflow-hidden ${
                      searchHistoryOpen
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25'
                        : 'text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-white hover:shadow-sm'
                    }`}
                    aria-label="Toggle search history"
                  >
                    {!searchHistoryOpen && (
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-50 to-accent-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    <div className={`relative flex items-center justify-center flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                      searchHistoryOpen ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      <History
                        className={`w-5 h-5 transition-all duration-300 ${
                          searchHistoryOpen ? 'text-white drop-shadow-sm' : 'text-neutral-600 group-hover:text-accent-600'
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <span className={`relative text-xs font-semibold truncate transition-all duration-300 ${
                        searchHistoryOpen ? 'text-white' : 'text-neutral-700 group-hover:text-accent-700'
                      }`}>
                        History
                      </span>
                    )}

                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        History
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
                      </div>
                    )}
                  </button>
                )}

                {showChatHistoryButton && onChatHistoryToggle && (
                  <button
                    onClick={onChatHistoryToggle}
                    className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-300 w-full overflow-hidden ${
                      chatHistoryOpen
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25'
                        : 'text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-white hover:shadow-sm'
                    }`}
                    aria-label="Toggle chat history"
                  >
                    {!chatHistoryOpen && (
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-50 to-accent-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    <div className={`relative flex items-center justify-center flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                      chatHistoryOpen ? 'scale-110' : 'group-hover:scale-110'
                    }`}>
                      <History
                        className={`w-5 h-5 transition-all duration-300 ${
                          chatHistoryOpen ? 'text-white drop-shadow-sm' : 'text-neutral-600 group-hover:text-accent-600'
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <span className={`relative text-xs font-semibold truncate transition-all duration-300 ${
                        chatHistoryOpen ? 'text-white' : 'text-neutral-700 group-hover:text-accent-700'
                      }`}>
                        History
                      </span>
                    )}

                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        History
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
                      </div>
                    )}
                  </button>
                )}

                {showFiltersButton && onFiltersToggle && (
                  <button
                    onClick={onFiltersToggle}
                    className={`group relative flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all duration-300 w-full overflow-hidden ${
                      filtersOpen
                        ? 'bg-gradient-to-r from-accent-500 to-accent-600 text-white shadow-lg shadow-accent-500/25'
                        : 'text-neutral-600 hover:bg-gradient-to-r hover:from-neutral-50 hover:to-white hover:shadow-sm'
                    }`}
                    aria-label="Toggle filters"
                  >
                    {!filtersOpen && (
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-50 to-accent-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    )}

                    <div className={`relative flex items-center justify-center flex-shrink-0 w-5 h-5 transition-all duration-300 ${
                      filtersOpen ? 'scale-110 rotate-180' : 'group-hover:scale-110'
                    }`}>
                      <Filter
                        className={`w-5 h-5 transition-all duration-300 ${
                          filtersOpen ? 'text-white drop-shadow-sm' : 'text-neutral-600 group-hover:text-accent-600'
                        }`}
                      />
                    </div>

                    {isExpanded && (
                      <span className={`relative text-xs font-semibold truncate transition-all duration-300 ${
                        filtersOpen ? 'text-white' : 'text-neutral-700 group-hover:text-accent-700'
                      }`}>
                        Filters
                      </span>
                    )}

                    {!isExpanded && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        Filters
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
                      </div>
                    )}
                  </button>
                )}

                {showPaginationControl && onItemsPerPageChange && (
                  <div className={`group relative ${isExpanded ? 'px-1.5 py-1.5' : 'px-2.5 py-2'}`}>
                    {isExpanded ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-1">
                          Per Page
                        </label>
                        <div className="grid grid-cols-4 gap-0.5">
                          {itemsPerPageOptions.map((option) => (
                            <button
                              key={option}
                              onClick={() => onItemsPerPageChange(option)}
                              className={`relative px-1.5 py-1 rounded-md text-[11px] font-bold transition-all duration-300 overflow-hidden ${
                                itemsPerPage === option
                                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md shadow-primary-500/30'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-white hover:shadow-sm'
                              }`}
                            >
                              {itemsPerPage === option && (
                                <div className="absolute inset-0 bg-gradient-to-r from-primary-400 to-primary-500 opacity-50" />
                              )}
                              <span className="relative">{option}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        Per Page: {itemsPerPage}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
                      </div>
                    )}
                  </div>
                )}

                {showGroupControl && onGroupByDocumentChange && (
                  <div className={`group relative ${isExpanded ? 'px-1.5 py-1.5' : 'px-2.5 py-2'}`}>
                    {isExpanded ? (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-1">
                          View
                        </label>
                        <div className="relative inline-flex w-full rounded-lg bg-gradient-to-r from-neutral-100 to-neutral-50 p-0.5 shadow-inner">
                          <button
                            onClick={() => onGroupByDocumentChange(false)}
                            className={`relative flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-300 flex-1 overflow-hidden ${
                              !groupByDocument
                                ? 'bg-white text-primary-600 shadow-md'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                            }`}
                          >
                            {!groupByDocument && (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-30" />
                            )}
                            <Grid className={`relative w-3 h-3 transition-transform duration-300 ${
                              !groupByDocument ? 'scale-110' : ''
                            }`} />
                            <span className="relative">Grid</span>
                          </button>
                          <button
                            onClick={() => onGroupByDocumentChange(true)}
                            className={`relative flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-[11px] font-semibold transition-all duration-300 flex-1 overflow-hidden ${
                              groupByDocument
                                ? 'bg-white text-primary-600 shadow-md'
                                : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                            }`}
                          >
                            {groupByDocument && (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-30" />
                            )}
                            <Folder className={`relative w-3 h-3 transition-transform duration-300 ${
                              groupByDocument ? 'scale-110' : ''
                            }`} />
                            <span className="relative">Group</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-neutral-900 text-white text-[11px] font-semibold rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap z-50 shadow-xl">
                        {groupByDocument ? 'Grouped' : 'Grid'}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-neutral-900 rotate-45" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className="space-y-1 border-t border-neutral-200/50 pt-2.5" aria-label="Secondary navigation">
            {secondaryNavItems.map((item) => (
              <NavButton key={item.id} item={item} />
            ))}
          </nav>
        </div>
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 glass-panel border-b border-neutral-200/50 shadow-soft">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-neutral-900 gradient-text">Deal Insights</span>
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-11 h-11 rounded-xl flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 transition-all duration-300 active:scale-95 shadow-sm"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-neutral-700" />
            ) : (
              <Menu className="w-5 h-5 text-neutral-700" />
            )}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="absolute top-full left-0 right-0 glass-panel border-b border-neutral-200/50 shadow-xl max-h-[calc(100vh-80px)] overflow-y-auto animate-slide-down">
            <nav className="p-3 space-y-2" aria-label="Mobile primary navigation">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-2">
                  Main
                </label>
                <div className="relative inline-flex w-full rounded-lg bg-gradient-to-r from-neutral-100 to-neutral-50 p-0.5 shadow-inner">
                  {mainNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`relative flex items-center justify-center space-x-1.5 px-2 py-1.5 rounded-md transition-all duration-300 flex-1 overflow-hidden ${
                          isActive
                            ? 'bg-white text-primary-600 shadow-md font-semibold'
                            : 'text-neutral-600 hover:text-neutral-900 hover:bg-white/50'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary-50 to-primary-100 opacity-30" />
                        )}
                        <Icon className={`relative w-4 h-4 transition-transform duration-300 ${
                          isActive ? 'scale-110' : ''
                        }`} />
                        <span className="relative text-[11px] font-semibold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </nav>

            <nav className="px-3 pb-3 space-y-1 border-t border-neutral-200/50 pt-2.5" aria-label="Mobile secondary navigation">
              {secondaryNavItems.map((item) => (
                <NavButton key={item.id} item={item} showLabel />
              ))}
            </nav>
          </div>
        )}
      </div>

      <div className="lg:hidden h-20" />
    </>
  );
};
