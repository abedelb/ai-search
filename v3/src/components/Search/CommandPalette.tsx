import React, { useState, useEffect, useRef } from 'react';
import { FileText, TrendingUp, Building2, DollarSign, Target, Briefcase, Users, BarChart3, FileCheck, Lightbulb } from 'lucide-react';

interface Command {
  id: string;
  icon: React.ReactNode;
  label: string;
  category: string;
  prompt: string;
  description: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCommand: (prompt: string) => void;
  searchQuery: string;
}

const commands: Command[] = [
  {
    id: 'pitch-deck',
    icon: <FileText className="w-4 h-4" />,
    label: 'Build Pitch Deck',
    category: 'Deal Execution',
    prompt: 'Help me create a comprehensive pitch deck for [COMPANY/SECTOR]. Include market overview, competitive landscape, financial analysis, and investment thesis.',
    description: 'Create a complete pitch deck with all standard sections'
  },
  {
    id: 'comps-analysis',
    icon: <Building2 className="w-4 h-4" />,
    label: 'Find Comparable Companies',
    category: 'Valuation',
    prompt: 'Find comparable public companies and recent M&A transactions for [COMPANY/SECTOR]. Focus on revenue multiples, EBITDA multiples, and deal premiums.',
    description: 'Identify trading and transaction comps with multiples'
  },
  {
    id: 'dcf-model',
    icon: <DollarSign className="w-4 h-4" />,
    label: 'Build DCF Model',
    category: 'Valuation',
    prompt: 'Help me build a DCF valuation model for [COMPANY]. What revenue growth, margin assumptions, WACC, and terminal value should I use?',
    description: 'Create discounted cash flow valuation with assumptions'
  },
  {
    id: 'market-analysis',
    icon: <TrendingUp className="w-4 h-4" />,
    label: 'Market Analysis',
    category: 'Research',
    prompt: 'Provide a comprehensive market analysis for [SECTOR/INDUSTRY]. Include market size, growth trends, key players, and recent M&A activity.',
    description: 'Analyze market trends, size, and competitive dynamics'
  },
  {
    id: 'due-diligence',
    icon: <Target className="w-4 h-4" />,
    label: 'Due Diligence Checklist',
    category: 'Deal Execution',
    prompt: 'Create a detailed due diligence checklist for [COMPANY/SECTOR]. Include financial, legal, operational, and commercial workstreams.',
    description: 'Generate comprehensive DD checklist by workstream'
  },
  {
    id: 'deal-summary',
    icon: <Briefcase className="w-4 h-4" />,
    label: 'Executive Summary',
    category: 'Deal Execution',
    prompt: 'Draft an executive summary for [DEAL/TRANSACTION]. Include deal rationale, key terms, synergies, and recommendation.',
    description: 'Write concise executive summary for deal approval'
  },
  {
    id: 'industry-trends',
    icon: <BarChart3 className="w-4 h-4" />,
    label: 'Industry Trends',
    category: 'Research',
    prompt: 'What are the current trends, disruptions, and consolidation opportunities in [INDUSTRY]? Include regulatory changes and technology impacts.',
    description: 'Identify key trends and consolidation opportunities'
  },
  {
    id: 'synergy-analysis',
    icon: <Users className="w-4 h-4" />,
    label: 'Synergy Analysis',
    category: 'Valuation',
    prompt: 'Analyze potential synergies between [ACQUIRER] and [TARGET]. Quantify revenue synergies, cost savings, and implementation timeline.',
    description: 'Quantify deal synergies and value creation'
  },
  {
    id: 'cim-outline',
    icon: <FileCheck className="w-4 h-4" />,
    label: 'CIM Outline',
    category: 'Deal Execution',
    prompt: 'Create a confidential information memorandum (CIM) outline for [COMPANY]. Include investment highlights, business overview, financials, and growth strategy.',
    description: 'Structure a professional CIM for sell-side process'
  },
  {
    id: 'deal-comps',
    icon: <Lightbulb className="w-4 h-4" />,
    label: 'Recent Deal Comparables',
    category: 'Research',
    prompt: 'Show me recent M&A transactions in [SECTOR] over the past 24 months. Include deal size, multiples paid, strategic rationale, and buyer profiles.',
    description: 'Find recent transactions with deal terms and rationale'
  }
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectCommand,
  searchQuery
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hoveredCommand, setHoveredCommand] = useState<Command | null>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const filteredCommands = searchQuery
    ? commands.filter(cmd =>
        cmd.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cmd.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) {
      acc[cmd.category] = [];
    }
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelectCommand(filteredCommands[selectedIndex].prompt);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredCommands, onSelectCommand, onClose]);

  if (!isOpen) return null;

  let globalIndex = 0;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 z-50">
      <div
        ref={paletteRef}
        className="bg-white border border-gray-300 rounded-xl shadow-2xl max-h-96 overflow-hidden"
      >
        <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <p className="text-xs font-semibold text-gray-700">Quick Commands</p>
          <p className="text-xs text-gray-500 mt-0.5">Use ↑↓ to navigate, Enter to select, Esc to close</p>
        </div>

        <div className="overflow-y-auto max-h-80">
          {Object.entries(groupedCommands).map(([category, cmds]) => (
            <div key={category}>
              <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{category}</p>
              </div>
              {cmds.map((cmd) => {
                const currentIndex = globalIndex++;
                const isSelected = currentIndex === selectedIndex;

                return (
                  <button
                    key={cmd.id}
                    onClick={() => {
                      onSelectCommand(cmd.prompt);
                      onClose();
                    }}
                    onMouseEnter={() => {
                      setSelectedIndex(currentIndex);
                      setHoveredCommand(cmd);
                    }}
                    onMouseLeave={() => setHoveredCommand(null)}
                    className={`w-full px-3 py-2.5 flex items-start gap-3 hover:bg-blue-50 transition-colors border-b border-gray-100 ${
                      isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {cmd.icon}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className={`text-sm font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                        {cmd.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                        {cmd.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {hoveredCommand && (
          <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-t border-amber-200">
            <p className="text-xs font-semibold text-amber-900 mb-1">Preview Prompt</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              {hoveredCommand.prompt}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
