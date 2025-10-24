import React from 'react';
import { AIAgent } from '../AIAgent';
import { FilterOptions, SearchFilters } from '../../types';

interface AIWithSourcesProps {
  query: string;
  aiSessionId: string | null;
  onAiSessionIdChange: (sessionId: string | null) => void;
  filterOptions: FilterOptions;
  filters: SearchFilters;
  itemsPerPage?: number;
  groupByDocument?: boolean;
  onClose?: () => void;
  showHeader?: boolean;
  triggerSubmit?: boolean;
}

export const AIWithSources: React.FC<AIWithSourcesProps> = React.memo(({
  query,
  aiSessionId,
  onAiSessionIdChange,
  onClose,
  showHeader = false,
  triggerSubmit = false,
}) => {
  const [submittedQuery, setSubmittedQuery] = React.useState<string>('');
  const prevTriggerRef = React.useRef(false);

  React.useEffect(() => {
    if (triggerSubmit && !prevTriggerRef.current && query.trim()) {
      setSubmittedQuery(query);
    }
    prevTriggerRef.current = triggerSubmit;
  }, [triggerSubmit, query]);

  return (
    <div className="h-full bg-white">
      <AIAgent
        currentSessionId={aiSessionId}
        onSessionIdChange={onAiSessionIdChange}
        filtersOpen={false}
        filterPanelWidth={0}
        onFilterPanelWidthChange={() => {}}
        initialQuery={submittedQuery}
        onSlidesUpdate={() => {}}
        onClose={onClose}
        showHeader={showHeader}
      />
    </div>
  );
});
