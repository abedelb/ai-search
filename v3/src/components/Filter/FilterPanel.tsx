import React from 'react';
import { X, ChevronDown, Check } from 'lucide-react';
import { FilterOptions, SearchFilters } from '../../types';

interface FilterPanelProps {
  filterOptions: FilterOptions;
  activeFilters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
  onClose?: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterOptions,
  activeFilters,
  onFilterChange,
  onClose,
}) => {
  const [expandedSections, setExpandedSections] = React.useState({
    clients: false,
    regions: false,
    industries: false,
  });

  const [openDropdowns, setOpenDropdowns] = React.useState({
    clients: false,
    regions: false,
    industries: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleDropdown = (dropdown: keyof typeof openDropdowns) => {
    setOpenDropdowns(prev => ({ ...prev, [dropdown]: !prev[dropdown] }));
  };

  const closeDropdown = (dropdown: keyof typeof openDropdowns) => {
    setOpenDropdowns(prev => ({ ...prev, [dropdown]: false }));
  };

  const toggleFilter = (category: keyof SearchFilters, value: string) => {
    const currentFilters = activeFilters[category];
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(v => v !== value)
      : [...currentFilters, value];

    onFilterChange({
      ...activeFilters,
      [category]: newFilters,
    });
  };

  const clearAllFilters = () => {
    onFilterChange({
      clients: [],
      regions: [],
      industries: [],
    });
  };

  const hasActiveFilters =
    activeFilters.clients.length > 0 ||
    activeFilters.regions.length > 0 ||
    activeFilters.industries.length > 0;

  const renderFilterSection = (
    title: string,
    category: keyof SearchFilters,
    options: string[],
    expanded: boolean
  ) => {
    const activeCount = activeFilters[category].length;
    const isDropdownOpen = openDropdowns[category];

    return (
      <div className="border-b border-neutral-200/50">
        <button
          onClick={() => toggleSection(category)}
          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <span className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">{title}</span>
            {activeCount > 0 && (
              <span className="badge">
                {activeCount}
              </span>
            )}
          </div>
          <ChevronDown
            className={`w-4 h-4 text-neutral-500 group-hover:text-primary-600 transition-all ${
              expanded ? 'transform rotate-180' : ''
            }`}
          />
        </button>

        {expanded && (
          <div className="px-6 pb-4 animate-in">
            <div className="relative">
              <button
                onClick={() => toggleDropdown(category)}
                className="w-full px-4 py-3 bg-white border-2 border-neutral-200 rounded-xl text-left flex items-center justify-between hover:border-primary-500 transition-all shadow-sm"
              >
                <span className="text-sm font-medium text-neutral-700">
                  {activeCount > 0 ? `${activeCount} selected` : `Select ${title.toLowerCase()}`}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-500 transition-transform ${
                    isDropdownOpen ? 'transform rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => closeDropdown(category)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-2 glass-panel rounded-2xl shadow-xl max-h-64 overflow-y-auto z-20 animate-slide-down scrollbar-primary">
                    {options.map((option) => {
                      const isActive = activeFilters[category].includes(option);
                      return (
                        <button
                          key={option}
                          onClick={() => toggleFilter(category, option)}
                          className="w-full px-4 py-3 text-left hover:bg-neutral-100 transition-colors flex items-center justify-between group"
                        >
                          <span
                            className={`text-sm font-medium ${
                              isActive ? 'text-primary-600' : 'text-neutral-700 group-hover:text-neutral-900'
                            }`}
                          >
                            {option}
                          </span>
                          {isActive && <Check className="w-4 h-4 text-primary-600" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {activeCount > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {activeFilters[category].map((filter) => (
                  <div
                    key={filter}
                    className="badge flex items-center space-x-1.5"
                  >
                    <span>{filter}</span>
                    <button
                      onClick={() => toggleFilter(category, filter)}
                      className="hover:text-[#007A4D] transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full glass-panel border-r border-neutral-200/50 flex flex-col h-full shadow-soft animate-slide-down">
      <div className="p-6 border-b border-neutral-200/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-bold gradient-text">Filters</h2>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs font-medium text-neutral-600 hover:text-primary-600 transition-colors flex items-center space-x-1"
              >
                <span>Clear All</span>
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-neutral-100 transition-colors text-neutral-600 hover:text-neutral-900"
                aria-label="Close filters"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
        <p className="text-sm text-neutral-600">Refine your search results</p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-primary">
        {renderFilterSection('Client', 'clients', filterOptions.clients, expandedSections.clients)}
        {renderFilterSection('Region', 'regions', filterOptions.regions, expandedSections.regions)}
        {renderFilterSection('Industry', 'industries', filterOptions.industries, expandedSections.industries)}
      </div>
    </div>
  );
};
