import { useState, useEffect, useRef, useMemo } from 'react';
import { SlideMetadata, SearchFilters } from '../../../types';
import { searchAPI } from '../../../services/api_client';

export const useSlideSearch = (externalQuery?: string, externalFilters?: SearchFilters) => {
  const [slides, setSlides] = useState<SlideMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSearchedQueryRef = useRef<string>('');
  const lastSearchedFiltersRef = useRef<string>('');

  const filtersKey = useMemo(() => JSON.stringify(externalFilters), [
    externalFilters?.clients?.length,
    externalFilters?.regions?.length,
    externalFilters?.industries?.length,
    JSON.stringify(externalFilters?.clients),
    JSON.stringify(externalFilters?.regions),
    JSON.stringify(externalFilters?.industries)
  ]);

  useEffect(() => {
    const shouldSearch = externalQuery &&
      (externalQuery !== lastSearchedQueryRef.current ||
       filtersKey !== lastSearchedFiltersRef.current);

    if (shouldSearch) {
      lastSearchedQueryRef.current = externalQuery;
      lastSearchedFiltersRef.current = filtersKey;
      performSearch();
    }
  }, [externalQuery, filtersKey]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const results = await searchAPI.searchSlides(
        externalQuery || '',
        externalFilters || { clients: [], regions: [], industries: [] }
      );
      setSlides(results);
    } finally {
      setLoading(false);
    }
  };

  return {
    slides,
    loading,
  };
};
