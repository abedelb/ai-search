import { Brain, Search as SearchIcon, BarChart3, FileText, Sparkles } from 'lucide-react';
import { AgentStep } from '../../services/api_client';

export const stepIcons: Record<AgentStep, React.ElementType> = {
  reasoning: Brain,
  searching: SearchIcon,
  analyzing: BarChart3,
  summarizing: FileText,
  complete: Sparkles,
};

export const stepColors: Record<AgentStep, string> = {
  reasoning: 'from-purple-500 to-purple-600',
  searching: 'from-blue-500 to-blue-600',
  analyzing: 'from-green-500 to-green-600',
  summarizing: 'from-orange-500 to-orange-600',
  complete: 'from-primary-500 to-primary-600',
};
