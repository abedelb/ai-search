import React, { useState, useRef, useEffect } from 'react';
import { Send, StopCircle, Zap } from 'lucide-react';
import { CommandPalette } from '../Search/CommandPalette';
import { SmartSuggestions } from '../Search/SmartSuggestions';

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [localValue, setLocalValue] = useState('');

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 200)}px`;
    }
  }, [input, localValue]);

  useEffect(() => {
    if (!commandPaletteOpen) {
      setLocalValue(input);
    }
  }, [input, commandPaletteOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setLocalValue(value);

    if (value.startsWith('/')) {
      setCommandPaletteOpen(true);
      setCommandSearch(value.slice(1));
    } else {
      setCommandPaletteOpen(false);
      setCommandSearch('');
      onInputChange(value);
    }
  };

  const handleCommandSelect = (prompt: string) => {
    setLocalValue(prompt);
    onInputChange(prompt);
    setCommandPaletteOpen(false);
    setCommandSearch('');

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const firstParam = prompt.match(/\[(.*?)\]/);
        if (firstParam) {
          const start = prompt.indexOf(firstParam[0]);
          const end = start + firstParam[0].length;
          inputRef.current.setSelectionRange(start, end);
        }
      }
    }, 50);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      if (commandPaletteOpen) {
        e.preventDefault();
        setCommandPaletteOpen(false);
        setCommandSearch('');
        setLocalValue('');
        onInputChange('');
      }
    } else if (e.key === 'Tab' && !commandPaletteOpen && input.match(/\[.*?\]/)) {
      e.preventDefault();
      const text = input;
      const cursorPos = inputRef.current?.selectionStart || 0;
      const remainingText = text.slice(cursorPos);
      const nextParam = remainingText.match(/\[(.*?)\]/);

      if (nextParam && inputRef.current) {
        const start = cursorPos + remainingText.indexOf(nextParam[0]);
        const end = start + nextParam[0].length;
        inputRef.current.setSelectionRange(start, end);
      }
    } else if (e.key === 'Enter' && !e.shiftKey && !commandPaletteOpen) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onSubmit(e as any);
      }
    }
  };

  return (
    <div className="border-t border-neutral-200/50 glass-panel px-4 py-4 flex-shrink-0">
      <form onSubmit={onSubmit} className="flex flex-col gap-2">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={commandPaletteOpen ? localValue : input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type / for commands, or ask anything about deals, markets, or clients..."
              disabled={isStreaming}
              rows={1}
              className="w-full px-6 py-4 bg-white border-2 border-neutral-200 rounded-2xl text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-primary-500 focus:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md resize-none"
              style={{ minHeight: '56px', maxHeight: '200px' }}
            />
            <CommandPalette
              isOpen={commandPaletteOpen}
              onClose={() => {
                setCommandPaletteOpen(false);
                setCommandSearch('');
                setLocalValue('');
                onInputChange('');
              }}
              onSelectCommand={handleCommandSelect}
              searchQuery={commandSearch}
            />
          </div>

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="group relative overflow-hidden flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/40 transition-all duration-300 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <StopCircle className="relative w-5 h-5" />
              <span className="relative">Stop</span>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="group relative overflow-hidden flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <Send className="relative w-5 h-5" />
              <span className="relative">Send</span>
            </button>
          )}
        </div>

        {!commandPaletteOpen && input && input.length >= 3 && (
          <div className="px-2">
            <SmartSuggestions
              query={input}
              onSuggestionClick={(suggestion) => {
                onInputChange(suggestion);
              }}
            />
          </div>
        )}

        {!commandPaletteOpen && input.match(/\[.*?\]/) && (
          <div className="flex items-center gap-2 px-4">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-xs text-amber-700">
              <kbd className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-xs font-mono">Tab</kbd> to jump between parameters •{' '}
              <kbd className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-xs font-mono">Enter</kbd> to send
            </p>
          </div>
        )}

        {!isStreaming && !commandPaletteOpen && !input.match(/\[.*?\]/) && input.length < 3 && (
          <p className="text-xs text-gray-500 px-4">
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">/</kbd> for quick commands •{' '}
            <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs font-mono">Shift+Enter</kbd> for new line
          </p>
        )}
      </form>
    </div>
  );
};
