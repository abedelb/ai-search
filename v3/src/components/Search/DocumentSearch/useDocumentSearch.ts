import { useState, useEffect, useRef, useMemo } from 'react';
import { DocumentMetadata, SearchFilters } from '../../../types';
import { searchAPI } from '../../../services/api_client';

export const useDocumentSearch = (externalQuery?: string, externalFilters?: SearchFilters) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
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
      const results = await searchAPI.searchDocuments(
        externalQuery || '',
        externalFilters || { clients: [], regions: [], industries: [] }
      );
      setDocuments(results);
    } finally {
      setLoading(false);
    }
  };

  return {
    documents,
    loading,
  };
};
