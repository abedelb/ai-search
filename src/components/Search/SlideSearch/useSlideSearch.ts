import { useState, useEffect } from 'react';
import { SlideMetadata, SearchFilters } from '../../../types';
import { searchAPI } from '../../../services/api_client';

export const useSlideSearch = (externalQuery?: string, externalFilters?: SearchFilters) => {
  const [slides, setSlides] = useState<SlideMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performSearch();
  }, [externalQuery, externalFilters]);

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
