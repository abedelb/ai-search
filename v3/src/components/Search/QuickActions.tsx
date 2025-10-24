import React from 'react';
import { FileText, TrendingUp, Building2, DollarSign, Target, Briefcase } from 'lucide-react';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  query: string;
  aiPrompt: string;
}

interface QuickActionsProps {
  onActionClick: (query: string, aiPrompt: string) => void;
}

const quickActions: QuickAction[] = [
  {
    id: 'pitch-deck',
    label: 'Build Pitch Deck',
    icon: <FileText className="w-5 h-5" />,
    query: '',
    aiPrompt: 'Help me create a pitch deck. What deal or company should we focus on?'
  },
  {
    id: 'market-analysis',
    label: 'Market Analysis',
    icon: <TrendingUp className="w-5 h-5" />,
    query: 'market analysis',
    aiPrompt: 'Analyze market trends and provide insights for potential deals'
  },
  {
    id: 'comps',
    label: 'Find Comps',
    icon: <Building2 className="w-5 h-5" />,
    query: 'comparable companies',
    aiPrompt: 'Help me find comparable companies and transactions for valuation analysis'
  },
  {
    id: 'valuation',
    label: 'Valuation Model',
    icon: <DollarSign className="w-5 h-5" />,
    query: 'valuation dcf',
    aiPrompt: 'Help me build a valuation model. What metrics and assumptions should I consider?'
  },
  {
    id: 'due-diligence',
    label: 'Due Diligence',
    icon: <Target className="w-5 h-5" />,
    query: 'due diligence',
    aiPrompt: 'Guide me through due diligence checklist and key risk areas to investigate'
  },
  {
    id: 'deal-summary',
    label: 'Deal Summary',
    icon: <Briefcase className="w-5 h-5" />,
    query: '',
    aiPrompt: 'Help me create an executive summary for a deal. Which transaction should we summarize?'
  }
];

export const QuickActions: React.FC<QuickActionsProps> = ({ onActionClick }) => {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {quickActions.map((action) => (
          <button
            key={action.id}
            onClick={() => onActionClick(action.query, action.aiPrompt)}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center text-blue-600 group-hover:from-blue-100 group-hover:to-blue-200 transition-all">
              {action.icon}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
