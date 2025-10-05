import React from 'react';
import { Send, StopCircle } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onStop: () => void;
  isStreaming: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  onInputChange,
  onSubmit,
  onStop,
  isStreaming,
}) => {
  return (
    <div className="border-t border-neutral-200/50 glass-panel px-4 py-4 flex-shrink-0">
      <form onSubmit={onSubmit} className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ask me anything about your deals, markets, or clients..."
            disabled={isStreaming}
            className="w-full px-6 py-4 bg-white border-2 border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          />
        </div>

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="group relative overflow-hidden flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 active:scale-95"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <StopCircle className="relative w-5 h-5" />
            <span className="relative">Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim()}
            className="group relative overflow-hidden flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <Send className="relative w-5 h-5" />
            <span className="relative">Send</span>
          </button>
        )}
      </form>
    </div>
  );
};
