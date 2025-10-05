import React from 'react';
import { Sparkles } from 'lucide-react';

export const ChatHeader: React.FC = () => {
  return (
    <div className="px-4 py-6 border-b border-neutral-200/50 glass-panel flex-shrink-0">
      <div className="flex items-center space-x-4 mb-3">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-soft">
          <Sparkles className="w-6 h-6 text-white animate-pulse-soft" />
        </div>
        <div>
          <h1 className="text-4xl font-bold gradient-text mb-1">
            IB AI Assistant
          </h1>
          <p className="text-sm text-neutral-600">
            Ask questions about deals, markets, or specific clients. I'll show you my reasoning process.
          </p>
        </div>
      </div>
    </div>
  );
};
