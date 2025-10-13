import React from 'react';
import { User, Sparkles } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import { AgentStep } from './AgentStep';
import { StreamingMessage, Citation } from './types';

interface MessageBubbleProps {
  message: StreamingMessage;
  expandedSteps: Record<string, boolean>;
  onToggleStep: (messageId: string, stepIndex: number) => void;
  onCitationClick: (citation: Citation) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  expandedSteps,
  onToggleStep,
  onCitationClick,
}) => {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end animate-in w-full">
        <div className="flex items-start space-x-3">
          <div className="px-6 py-4 bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-2xl shadow-lg">
            <p className="text-sm leading-relaxed">{message.content}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neutral-600 to-neutral-700 flex items-center justify-center flex-shrink-0 shadow-md">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start animate-in w-full">
      <div className="flex items-start space-x-3 w-full">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Sparkles className={`w-5 h-5 text-white ${message.isStreaming ? 'animate-pulse' : ''}`} />
        </div>

        <div className="flex-1 space-y-4">
          {message.steps && message.steps.length > 0 && (
            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-neutral-200/50 shadow-soft">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                Thinking Process
              </p>
              <div className="space-y-1">
                {message.steps.map((step, idx) => (
                  <AgentStep
                    key={idx}
                    step={step}
                    messageId={message.id}
                    stepIndex={idx}
                    isExpanded={expandedSteps[`${message.id}-${idx}`] ?? false}
                    onToggle={() => onToggleStep(message.id, idx)}
                  />
                ))}
              </div>
            </div>
          )}

          {(message.content || (message.isStreaming && !message.steps?.length)) && (
            <div className="rounded-2xl p-6">
              {message.content ? (
                <MarkdownContent
                  content={message.content}
                  citations={message.citations || []}
                  messageId={message.id}
                  isStreaming={message.isStreaming}
                  hasActiveStep={message.steps?.some(s => s.isActive)}
                  onCitationClick={onCitationClick}
                />
              ) : (
                <div className="flex items-center space-x-2 text-neutral-500">
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
