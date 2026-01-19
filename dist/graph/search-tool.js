/**
 * search_tools Tool
 *
 * The dynamic tool that allows the LLM to discover relevant tools
 * by searching through the tool catalog.
 */
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
/**
 * Schema for the search_tools input
 */
const SearchToolsSchema = z.object({
    query: z.string().describe("Search query to find relevant tools. Use natural language like 'github', 'send message', 'create file'"),
});
/**
 * Creates the search_tools DynamicStructuredTool.
 *
 * This tool is always bound to the LLM and allows it to discover
 * relevant tools based on what it needs to accomplish.
 *
 * @param config - Configuration for the search tool
 * @returns A DynamicStructuredTool for searching tools
 */
export function createSearchToolsTool(config) {
    const { index, catalog, limit = 5 } = config;
    return new DynamicStructuredTool({
        name: "search_tools",
        description: `Search for relevant tools based on what you need to accomplish.
Use this when you need to find tools for a specific task.
Example queries: "github", "send message", "create file", "database query"

After searching, the found tools will become available for you to use.`,
        schema: SearchToolsSchema,
        func: async ({ query }) => {
            // Execute the search
            const results = await index.search(query, { limit });
            if (results.length === 0) {
                return `No tools found matching "${query}". Try a different search query.`;
            }
            // Format the results with descriptions
            const descriptions = results
                .map((result) => {
                const meta = catalog.getMetadata(result.toolId);
                if (!meta)
                    return null;
                return `- **${meta.name}**: ${meta.description}`;
            })
                .filter(Boolean)
                .join("\n");
            return `Found ${results.length} tool${results.length === 1 ? "" : "s"}:\n${descriptions}\n\nYou can now use these tools.`;
        },
    });
}
//# sourceMappingURL=search-tool.js.map