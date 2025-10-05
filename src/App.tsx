import React from 'react';
import { Navigation } from './components/Navigation';
import { Search } from './components/Search';
import { AIAgent } from './components/AIAgent';
import { ChatHistory } from './components/History/ChatHistory';
import { SearchHistory } from './components/History/SearchHistory';
import { Settings } from './components/Settings';
import { Help } from './components/Help';
import { SearchHistoryItem } from './types';

function App() {
  const [activeTab, setActiveTab] = React.useState('search');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [itemsPerPage, setItemsPerPage] = React.useState(12);
  const [groupByDocument, setGroupByDocument] = React.useState(false);
  const [chatHistoryOpen, setChatHistoryOpen] = React.useState(false);
  const [currentChatSessionId, setCurrentChatSessionId] = React.useState<string | null>(null);
  const [searchHistoryOpen, setSearchHistoryOpen] = React.useState(false);
  const [selectedSearchHistory, setSelectedSearchHistory] = React.useState<SearchHistoryItem | null>(null);
  const [sidebarWidth, setSidebarWidth] = React.useState(320);
  const [filterPanelWidth, setFilterPanelWidth] = React.useState(320);

  const handleSearchHistorySelect = (item: SearchHistoryItem) => {
    setSelectedSearchHistory(item);
    setSearchHistoryOpen(false);
  };

  const handleFiltersToggle = () => {
    if (!filtersOpen) {
      // Close history when opening filters
      setSearchHistoryOpen(false);
      setChatHistoryOpen(false);
    }
    setFiltersOpen(!filtersOpen);
  };

  const handleSearchHistoryToggle = () => {
    if (!searchHistoryOpen) {
      // Close filters when opening history
      setFiltersOpen(false);
    }
    setSearchHistoryOpen(!searchHistoryOpen);
  };

  const handleChatHistoryToggle = () => {
    if (!chatHistoryOpen) {
      // Close filters when opening history
      setFiltersOpen(false);
    }
    setChatHistoryOpen(!chatHistoryOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'search':
        return (
          <div className="flex w-full h-full">
            {searchHistoryOpen && (
              <ResizableSidebar width={sidebarWidth} onWidthChange={setSidebarWidth}>
                <SearchHistory onSelectSearch={handleSearchHistorySelect} />
              </ResizableSidebar>
            )}
            <Search
              filtersOpen={filtersOpen}
              selectedSearchHistory={selectedSearchHistory}
              onSearchHistoryApplied={() => setSelectedSearchHistory(null)}
              itemsPerPage={itemsPerPage}
              groupByDocument={groupByDocument}
              filterPanelWidth={filterPanelWidth}
              onFilterPanelWidthChange={setFilterPanelWidth}
            />
          </div>
        );
      case 'ai-agent':
        return (
          <div className="flex w-full h-full">
            {chatHistoryOpen && (
              <ResizableSidebar width={sidebarWidth} onWidthChange={setSidebarWidth}>
                <ChatHistory
                  currentSessionId={currentChatSessionId}
                  onSelectSession={setCurrentChatSessionId}
                  onNewChat={() => setCurrentChatSessionId(null)}
                />
              </ResizableSidebar>
            )}
            <AIAgent
              currentSessionId={currentChatSessionId}
              onSessionIdChange={setCurrentChatSessionId}
              filtersOpen={filtersOpen}
              filterPanelWidth={filterPanelWidth}
              onFilterPanelWidthChange={setFilterPanelWidth}
            />
          </div>
        );
      case 'settings':
        return <Settings />;
      case 'help':
        return <Help />;
      default:
        return (
          <div className="flex w-full h-full">
            <Search
              filtersOpen={filtersOpen}
              selectedSearchHistory={null}
              onSearchHistoryApplied={() => {}}
              itemsPerPage={itemsPerPage}
              groupByDocument={groupByDocument}
              filterPanelWidth={filterPanelWidth}
              onFilterPanelWidthChange={setFilterPanelWidth}
            />
          </div>
        );
    }
  };

  const ResizableSidebar: React.FC<{ width: number; onWidthChange: (width: number) => void; children: React.ReactNode }> = ({
    width,
    onWidthChange,
    children,
  }) => {
    const [isResizing, setIsResizing] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const startXRef = React.useRef<number>(0);
    const startWidthRef = React.useRef<number>(0);

    const handleMouseDown = (e: React.MouseEvent) => {
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;
      e.preventDefault();
    };

    React.useEffect(() => {
      const handleMouseMove = (e: MouseEvent) => {
        if (isResizing) {
          const delta = e.clientX - startXRef.current;
          const newWidth = Math.min(Math.max(250, startWidthRef.current + delta), 600);
          onWidthChange(newWidth);
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
    }, [isResizing, onWidthChange]);

    return (
      <div ref={containerRef} className="relative flex-shrink-0" style={{ width: `${width}px` }}>
        {children}
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
    <div className="h-screen flex bg-gradient-to-br from-neutral-50 via-white to-primary-50/30 overflow-hidden">
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        filtersOpen={filtersOpen}
        onFiltersToggle={handleFiltersToggle}
        showFiltersButton={activeTab === 'search' || activeTab === 'ai-agent'}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        showPaginationControl={activeTab === 'search'}
        groupByDocument={groupByDocument}
        onGroupByDocumentChange={setGroupByDocument}
        showGroupControl={activeTab === 'search'}
        chatHistoryOpen={chatHistoryOpen}
        onChatHistoryToggle={handleChatHistoryToggle}
        showChatHistoryButton={activeTab === 'ai-agent'}
        searchHistoryOpen={searchHistoryOpen}
        onSearchHistoryToggle={handleSearchHistoryToggle}
        showSearchHistoryButton={activeTab === 'search'}
      />
      <div className="flex-1 flex overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}

export default App;
