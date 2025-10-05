import { ChatMessage } from '../../types';
import { AgentStep } from '../../services/api_client';

export interface Citation {
  slideId: string;
  documentId: string;
  slideNumber: number;
  citationNumber: number;
}

export interface StepData {
  step: AgentStep;
  title: string;
  content: string[];
  isComplete: boolean;
  isActive: boolean;
}

export interface StreamingMessage extends ChatMessage {
  isStreaming?: boolean;
  steps?: StepData[];
  citations?: Citation[];
}
