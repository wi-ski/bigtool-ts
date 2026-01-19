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
export declare const ToolDiscoveryAnnotation: import("@langchain/langgraph").AnnotationRoot<{
    /** Conversation messages with automatic message merging */
    messages: import("@langchain/langgraph").BinaryOperatorAggregate<BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[], BaseMessage<import("@langchain/core/messages").MessageStructure<import("@langchain/core/messages").MessageToolSet>, import("@langchain/core/messages").MessageType>[]>;
    /** Currently selected tool IDs (available to the agent) */
    selectedToolIds: import("@langchain/langgraph").BinaryOperatorAggregate<string[], string[]>;
    /** History of search queries for context */
    searchHistory: import("@langchain/langgraph").BinaryOperatorAggregate<SearchQuery[], SearchQuery[]>;
}>;
export type ToolDiscoveryState = typeof ToolDiscoveryAnnotation.State;
export type ToolDiscoveryUpdate = typeof ToolDiscoveryAnnotation.Update;
//# sourceMappingURL=state.d.ts.map