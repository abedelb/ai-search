import React from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { StepData } from './types';
import { stepIcons, stepColors } from './constants';

interface AgentStepProps {
  step: StepData;
  messageId: string;
  stepIndex: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export const AgentStep: React.FC<AgentStepProps> = ({
  step,
  isExpanded,
  onToggle,
}) => {
  const Icon = stepIcons[step.step];
  const gradientColors = stepColors[step.step];

  return (
    <div
      className={`border-l-2 ${
        step.isComplete ? 'border-green-400' : step.isActive ? 'border-primary-400' : 'border-neutral-300'
      } mb-1.5`}
    >
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-2 px-3 py-2 bg-neutral-50/50 hover:bg-neutral-100/50 transition-colors text-left rounded-r-md ${step.isActive ? 'shimmer' : ''}`}
      >
        <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${gradientColors} flex items-center justify-center flex-shrink-0`}>
          {step.isComplete ? (
            <Check className="w-3 h-3 text-white" />
          ) : (
            <Icon className={`w-3 h-3 text-white ${step.isActive ? 'animate-pulse-soft' : ''}`} />
          )}
        </div>

        <span className="flex-1 font-medium text-neutral-700 text-xs">
          {step.title}
        </span>

        <div className="flex items-center gap-1.5">
          {step.isActive && (
            <div className="flex items-center gap-0.5">
              <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1 h-1 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          )}
          {isExpanded ? (
            <ChevronUp className="w-3 h-3 text-neutral-400" />
          ) : (
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          )}
        </div>
      </button>

      {isExpanded && step.content.length > 0 && (
        <div className="px-3 py-2 bg-white/50 space-y-1 ml-3">
          {step.content.map((line, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-neutral-600">
              <div className="w-1 h-1 bg-neutral-300 rounded-full mt-1.5 flex-shrink-0" />
              <span className="flex-1">{line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
