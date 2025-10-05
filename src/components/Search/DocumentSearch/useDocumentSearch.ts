import { useState, useEffect } from 'react';
import { DocumentMetadata, SearchFilters } from '../../../types';
import { searchAPI } from '../../../services/api_client';

export const useDocumentSearch = (externalQuery?: string, externalFilters?: SearchFilters) => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    performSearch();
  }, [externalQuery, externalFilters]);

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
