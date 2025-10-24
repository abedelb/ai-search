import { useState, useRef, useEffect } from 'react';
import { streamingChatAPI } from '../../services/api_client';
import { historyService } from '../../services/historyService';
import { StreamingMessage, StepData, Citation } from './types';
import { SearchFilters } from '../../types';

export const useAIChat = (currentSessionId: string | null) => {
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isStreaming || messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length, isStreaming]);

  useEffect(() => {
    if (currentSessionId) {
      loadSession(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  const loadSession = async (sessionId: string) => {
    const sessionMessages = await historyService.getChatMessages(sessionId);
    setMessages(sessionMessages.map(msg => ({
      ...msg,
      slides: msg.metadata?.slides || [],
    })));
  };

  const toggleStep = (messageId: string, stepIndex: number) => {
    const key = `${messageId}-${stepIndex}`;
    setExpandedSteps(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsStreaming(false);
  };

  const sendMessage = async (sessionId: string, userMessageId: string, assistantMessageId: string, setFeedbackMessageId: (id: string | null) => void, filters?: SearchFilters, queryOverride?: string) => {
    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const messageText = queryOverride || input;
    let userContent = messageText;
    if (filters && (filters.clients.length > 0 || filters.regions.length > 0 || filters.industries.length > 0)) {
      const filterParts: string[] = [];
      if (filters.clients.length > 0) {
        filterParts.push(`Clients: ${filters.clients.join(', ')}`);
      }
      if (filters.regions.length > 0) {
        filterParts.push(`Regions: ${filters.regions.join(', ')}`);
      }
      if (filters.industries.length > 0) {
        filterParts.push(`Industries: ${filters.industries.join(', ')}`);
      }
      userContent = `${messageText}\n\n[Filters: ${filterParts.join(' | ')}]`;
    }

    const userMessage: StreamingMessage = {
      id: userMessageId,
      role: 'user',
      content: userContent,
      timestamp: new Date(),
    };

    const assistantMessage: StreamingMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      steps: [],
      citations: [],
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInput('');

    try {
      await streamingChatAPI.streamMessage(
        messageText,
        (chunk) => {
          setMessages(prev => {
            const updated = [...prev];
            const msgIndex = updated.findIndex(m => m.id === assistantMessageId);
            if (msgIndex === -1) return prev;

            const msg = { ...updated[msgIndex] };

            if (chunk.type === 'step') {
              const steps = msg.steps || [];
              const existingIndex = steps.findIndex(s => s.step === chunk.step);

              if (existingIndex >= 0) {
                steps[existingIndex] = {
                  ...steps[existingIndex],
                  title: chunk.stepTitle || steps[existingIndex].title,
                  isActive: true,
                  isComplete: false,
                };
              } else {
                steps.push({
                  step: chunk.step!,
                  title: chunk.stepTitle || '',
                  content: [],
                  isComplete: false,
                  isActive: true,
                });
              }

              msg.steps = steps;
            } else if (chunk.type === 'step_content') {
              const steps = msg.steps || [];
              const stepIndex = steps.findIndex(s => s.step === chunk.step);
              if (stepIndex >= 0 && chunk.content) {
                steps[stepIndex].content.push(chunk.content);
              }
              msg.steps = steps;
            } else if (chunk.type === 'step_complete') {
              const steps = msg.steps || [];
              const stepIndex = steps.findIndex(s => s.step === chunk.step);
              if (stepIndex >= 0) {
                steps[stepIndex].isComplete = true;
                steps[stepIndex].isActive = false;
              }
              msg.steps = steps;
            } else if (chunk.type === 'content') {
              msg.content += chunk.content || '';
            } else if (chunk.type === 'citation' && chunk.citation) {
              const citations = msg.citations || [];
              citations.push(chunk.citation);
              msg.citations = citations;
            } else if (chunk.type === 'complete' && chunk.slides) {
              msg.slides = chunk.slides;
            }

            updated[msgIndex] = msg;
            return updated;
          });
        },
        controller.signal
      );

      let finalAssistantMessage: StreamingMessage | undefined;

      setMessages(prev => {
        const updated = [...prev];
        const msgIndex = updated.findIndex(m => m.id === assistantMessageId);
        if (msgIndex !== -1) {
          updated[msgIndex] = {
            ...updated[msgIndex],
            isStreaming: false,
          };
          finalAssistantMessage = updated[msgIndex];
        }
        return updated;
      });

      setIsStreaming(false);

      if (finalAssistantMessage && currentSessionId) {
        await historyService.saveChatMessage(sessionId, userMessage);
        await historyService.saveChatMessage(sessionId, finalAssistantMessage);
      }

      setTimeout(() => {
        setFeedbackMessageId(assistantMessageId);
      }, 2000);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => {
          const updated = [...prev];
          const msgIndex = updated.findIndex(m => m.id === assistantMessageId);
          if (msgIndex !== -1) {
            updated[msgIndex] = {
              ...updated[msgIndex],
              isStreaming: false,
              content: updated[msgIndex].content + '\n\n[Response stopped by user]',
            };
          }
          return updated;
        });
      } else {
        console.error('Error streaming message:', error);
        setMessages(prev => prev.filter(m => m.id !== assistantMessageId));
      }
      setIsStreaming(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  return {
    messages,
    input,
    setInput,
    isStreaming,
    expandedSteps,
    messagesEndRef,
    toggleStep,
    handleStopStreaming,
    sendMessage,
  };
};
