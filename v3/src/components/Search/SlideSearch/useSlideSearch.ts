import { useState, useEffect, useRef } from 'react';
import { searchAPI } from '../../../services/api_client';
import { SlideMetadata, SearchFilters } from '../../../types';

export const useSlideSearch = (
  externalQuery?: string,
  externalFilters?: SearchFilters
) => {
  const [slides, setSlides] = useState<SlideMetadata[]>([]);
  const [loading, setLoading] = useState(false);
  const lastSearchedQueryRef = useRef<string>('');

  useEffect(() => {
    if (!externalQuery?.trim()) {
      setSlides([]);
      lastSearchedQueryRef.current = '';
      return;
    }

    // Only search if query has actually changed
    if (externalQuery === lastSearchedQueryRef.current) {
      return;
    }

    const performSearch = async () => {
      lastSearchedQueryRef.current = externalQuery;
      setLoading(true);
      try {
        const results = await searchAPI.searchSlides(
          externalQuery,
          externalFilters || { clients: [], regions: [], industries: [] }
        );
        setSlides(results);
      } catch (error) {
        console.error('Error searching slides:', error);
        setSlides([]);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [externalQuery, externalFilters]);

  return {
    slides,
    loading,
  };
};
