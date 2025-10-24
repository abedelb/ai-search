import React from 'react';
import { SearchBar } from '../../ui/widgets/SearchBar';

interface SearchHeaderProps {
  title: string;
  query: string;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
  loading: boolean;
  resultCount: number;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  title,
  query,
  onQueryChange,
  onSearch,
  placeholder,
  loading,
  resultCount,
}) => {
  return (
    <div className="p-6 border-b border-gray-200 bg-white">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{title}</h1>

      <SearchBar
        value={query}
        onChange={onQueryChange}
        onSearch={onSearch}
        placeholder={placeholder}
        loading={loading}
      />

      <div className="mt-4 text-sm text-gray-600">
        <span>{resultCount} results found</span>
      </div>
    </div>
  );
};
