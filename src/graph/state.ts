import { Annotation, messagesStateReducer } from '@langchain/langgraph';
import type { BaseMessage } from '@langchain/core/messages';

/**
 * Search query recorded in history
 */
export interface SearchQuery {
  query: string;
  results: string[];
  timestamp: number;
}

/**
 * State annotation for the tool discovery graph.
 * 
 * Tracks conversation messages, currently selected tools,
 * and search history for context.
 */
export const ToolDiscoveryAnnotation = Annotation.Root({
  /** Conversation messages with automatic message merging */
  messages: Annotation<BaseMessage[]>({
    reducer: messagesStateReducer,
    default: () => [],
  }),
  
  /** Currently selected tool IDs (available to the agent) */
  selectedToolIds: Annotation<string[]>({
    reducer: (current, update) => {
      // Deduplicate tool IDs
      const set = new Set([...current, ...update]);
      return Array.from(set);
    },
    default: () => [],
  }),
  
  /** History of search queries for context */
  searchHistory: Annotation<SearchQuery[]>({
    reducer: (current, update) => [...current, ...update],
    default: () => [],
  }),
});

export type ToolDiscoveryState = typeof ToolDiscoveryAnnotation.State;
export type ToolDiscoveryUpdate = typeof ToolDiscoveryAnnotation.Update;
