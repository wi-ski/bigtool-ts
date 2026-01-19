import { Annotation, messagesStateReducer } from '@langchain/langgraph';
/**
 * State annotation for the tool discovery graph.
 *
 * Tracks conversation messages, currently selected tools,
 * and search history for context.
 */
export const ToolDiscoveryAnnotation = Annotation.Root({
    /** Conversation messages with automatic message merging */
    messages: Annotation({
        reducer: messagesStateReducer,
        default: () => [],
    }),
    /** Currently selected tool IDs (available to the agent) */
    selectedToolIds: Annotation({
        reducer: (current, update) => {
            // Deduplicate tool IDs
            const set = new Set([...current, ...update]);
            return Array.from(set);
        },
        default: () => [],
    }),
    /** History of search queries for context */
    searchHistory: Annotation({
        reducer: (current, update) => [...current, ...update],
        default: () => [],
    }),
});
//# sourceMappingURL=state.js.map